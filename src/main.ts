import * as THREE from "three";
import { createRenderer, createCamera, handleResize } from "./engine/renderer";
import { createScene } from "./engine/scene";
import { startLoop } from "./engine/loop";
import { initInput, pollInput } from "./engine/input";
import { createPostFX } from "./engine/postprocessing";
import { createSkySystem } from "./world/sky";
import { EnvironmentProbe } from "./world/environment";
import { ChunkedTerrain } from "./world/terrain";
import { createOcean, updateOcean } from "./world/water";
import { createCloudField } from "./world/clouds";
import { CITIES, getWorldGroundHeight, getCity } from "./world/cities/cityRegistry";
import { RigidBodyState } from "./physics/rigidBody";
import { stepFlightModel, defaultControls, type ControlInputs } from "./physics/flightModel";
import { getAircraftConfig } from "./physics/aircraftConfigs";
import { createAircraft } from "./aircraft/aircraftFactory";
import { updateAnimatedParts } from "./aircraft/shared/animatedParts";
import { CameraRig } from "./camera/cameraRig";
import { Hud } from "./ui/hud";
import { MainMenu } from "./ui/menu";
import { EngineAudio } from "./audio/engineAudio";
import { TrailSystem } from "./effects/trails";

function clampVal(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const canvas = document.getElementById("viewport") as HTMLCanvasElement;
const renderer = createRenderer(canvas);
const camera = createCamera();
camera.position.set(280, 210, 480);
camera.lookAt(0, 70, 0);
const scene = createScene();

const sky = createSkySystem(scene);

// One-time PBR environment probe generated from the sky, so metal fuselages
// and glass canopies get real reflections without downloading an HDRI.
const envProbe = new EnvironmentProbe(renderer);
const envMap = envProbe.refresh(scene);
scene.environment = envMap;

const terrain = new ChunkedTerrain(scene, getWorldGroundHeight);
const ocean = createOcean(sky.sunDirection);
scene.add(ocean);
const clouds = createCloudField(scene);

const landmarksGroup = new THREE.Group();
scene.add(landmarksGroup);
for (const city of CITIES) city.buildLandmarks(landmarksGroup, envMap);

const postFX = createPostFX(renderer, scene, camera);
handleResize(renderer, camera, (w, h) => postFX.resize(w, h));

initInput();
const hud = new Hud();
hud.setVisible(false);
const cameraRig = new CameraRig();
const engineAudio = new EngineAudio();
const trails = new TrailSystem(scene);

const aircraftRoot = new THREE.Group();
scene.add(aircraftRoot);

let flightActive = false;
let rigidBody = new RigidBodyState();
let controls: ControlInputs = defaultControls();
let currentConfig = getAircraftConfig("f18");
let currentCockpitOffset = new THREE.Vector3(0, 1.1, -1.5);

let vtolTarget = 0;
let vtolValue = 0;
let sweepTarget = 0;
let sweepValue = 0;

new MainMenu(({ aircraftId, cityId }) => {
  const config = getAircraftConfig(aircraftId);
  const city = getCity(cityId);

  aircraftRoot.clear();
  const instance = createAircraft(aircraftId, envMap);
  aircraftRoot.add(instance.group);
  currentConfig = config;
  currentCockpitOffset = instance.cockpitOffset;

  rigidBody = new RigidBodyState();
  rigidBody.position.copy(city.spawnPosition);
  const heading = city.spawnHeadingRad;
  rigidBody.velocity.set(-Math.sin(heading) * 62, 0, -Math.cos(heading) * 62);
  rigidBody.quaternion.setFromEuler(new THREE.Euler(0, heading, 0));
  rigidBody.mass = config.emptyMass + config.fuelMass;

  controls = defaultControls();
  vtolTarget = 0;
  vtolValue = 0;
  sweepTarget = config.hasVariableSweep ? 1 : 0;
  sweepValue = sweepTarget;

  hud.setStaticInfo(config, city.name);
  hud.setVisible(true);
  engineAudio.start();
  flightActive = true;

  currentInstance = instance;
});

let currentInstance: ReturnType<typeof createAircraft> | null = null;

const windDir = new THREE.Vector3(1, 0, 0.3).normalize();
const wind = new THREE.Vector3();

startLoop((dt, elapsed) => {
  sky.update(elapsed);
  updateOcean(ocean, dt, sky.sunDirection);
  clouds.update(sky.sunDirection, (scene.fog as THREE.FogExp2).color);

  if (flightActive && currentInstance) {
    const input = pollInput();
    controls.throttle = clampVal(controls.throttle + input.throttleDelta * dt, 0, 1);
    controls.pitch = input.pitch;
    controls.roll = input.roll;
    controls.yaw = input.yaw;
    controls.afterburner = input.afterburner && controls.throttle > 0.95 && currentConfig.hasAfterburner;
    controls.speedbrake = input.speedbrake;
    if (input.gearToggle) controls.gearDown = !controls.gearDown;
    if (input.flapsToggle) controls.flaps = controls.flaps > 0.5 ? 0 : 1;
    if (currentConfig.hasVTOL && input.vtolToggle) vtolTarget = vtolTarget > 0.5 ? 0 : 1;
    if (currentConfig.hasVariableSweep && input.wingSweepToggle) sweepTarget = sweepTarget > 0.5 ? 0 : 1;
    if (input.cameraCycle) cameraRig.cycle();

    vtolValue += (vtolTarget - vtolValue) * (1 - Math.exp(-dt * 1.2));
    sweepValue += (sweepTarget - sweepValue) * (1 - Math.exp(-dt * 0.6));
    controls.vtolNozzle = vtolValue;
    controls.wingSweep = sweepValue;

    wind.copy(windDir).multiplyScalar(6 + Math.sin(elapsed * 0.05) * 3);

    const telemetry = stepFlightModel(rigidBody, currentConfig, controls, dt, getWorldGroundHeight, wind, elapsed);

    aircraftRoot.position.copy(rigidBody.position);
    aircraftRoot.quaternion.copy(rigidBody.quaternion);

    updateAnimatedParts(currentInstance.parts, controls, telemetry, dt);
    terrain.update(rigidBody.position.x, rigidBody.position.z);
    cameraRig.update(camera, aircraftRoot, telemetry, dt, currentCockpitOffset);

    const speedT = Math.min(1, telemetry.airspeed / 280);
    postFX.setSpeedFactor(speedT * 0.6);

    const wingSpan = Math.sqrt(currentConfig.aspectRatio * currentConfig.wingArea);
    trails.update(dt, aircraftRoot, telemetry, wingSpan);
    engineAudio.update(controls, telemetry);
    hud.update(telemetry, controls, cameraRig.mode);
  } else {
    terrain.update(camera.position.x, camera.position.z);
  }

  postFX.composer.render();
});
