import * as THREE from "three";
import { RigidBodyState, integrateRigidBody } from "./rigidBody";
import type { AircraftConfig } from "./aircraftConfigs";

export interface ControlInputs {
  throttle: number; // 0..1
  afterburner: boolean;
  pitch: number; // -1..1, positive = nose up
  roll: number; // -1..1, positive = right wing down
  yaw: number; // -1..1, positive = nose right
  flaps: number; // 0..1
  speedbrake: boolean;
  gearDown: boolean;
  vtolNozzle: number; // 0 (horizontal thrust) .. 1 (fully vertical), F-35 only
  wingSweep: number; // 0 (min sweep) .. 1 (max sweep), F-14 only
}

export function defaultControls(): ControlInputs {
  return {
    throttle: 0.6,
    afterburner: false,
    pitch: 0,
    roll: 0,
    yaw: 0,
    flaps: 0,
    speedbrake: false,
    gearDown: true,
    vtolNozzle: 0,
    wingSweep: 0,
  };
}

export interface FlightTelemetry {
  airspeed: number;
  altitude: number;
  altitudeAGL: number;
  angleOfAttack: number;
  gForce: number;
  mach: number;
  stalled: boolean;
  onGround: boolean;
  headingRad: number;
  climbRate: number;
}

const GRAVITY = 9.81;
const SEA_LEVEL_DENSITY = 1.225;
const SCALE_HEIGHT = 9000;
const SOUND_SPEED_SEA_LEVEL = 340;
const REFERENCE_DYNAMIC_PRESSURE = 4500; // Pa, tunes how quickly control authority builds with speed

export function airDensityAt(altitude: number): number {
  return SEA_LEVEL_DENSITY * Math.exp(-Math.max(0, altitude) / SCALE_HEIGHT);
}

export function speedOfSoundAt(altitude: number): number {
  const tempFactor = Math.max(0.82, 1 - altitude / 44000);
  return SOUND_SPEED_SEA_LEVEL * Math.sqrt(tempFactor);
}

function transonicDragFactor(mach: number): number {
  // Smooth drag hump around Mach 1 — the "sound barrier" feel.
  const x = (mach - 1.0) / 0.18;
  return 1 + 1.6 * Math.exp(-x * x);
}

const _velDir = new THREE.Vector3();
const _invQuat = new THREE.Quaternion();
const _vLocal = new THREE.Vector3();
const _rightWorld = new THREE.Vector3();
const _forwardWorld = new THREE.Vector3();
const _upWorld = new THREE.Vector3();
const _liftDir = new THREE.Vector3();
const _thrustDir = new THREE.Vector3();
const _totalForce = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/**
 * Advances the flight model by dt seconds: computes lift/drag/thrust/weight,
 * integrates the rigid body, and returns telemetry for HUD/effects/audio.
 *
 * Effective wing geometry (area, aspect ratio, parasitic drag) is passed in
 * pre-adjusted for wing sweep so this function stays aircraft-agnostic.
 */
export function stepFlightModel(
  state: RigidBodyState,
  config: AircraftConfig,
  controls: ControlInputs,
  dt: number,
  groundHeightAt: (x: number, z: number) => number,
  windWorld: THREE.Vector3,
  elapsedTime: number,
): FlightTelemetry {
  const groundY = groundHeightAt(state.position.x, state.position.z);
  const altitudeAGL = Math.max(0, state.position.y - groundY);
  const altitude = state.position.y;

  // Relative wind = aircraft velocity minus ambient wind (gusts).
  _tmp.copy(state.velocity).sub(windWorld);
  const airspeed = _tmp.length();
  const rho = airDensityAt(altitude);
  const soundSpeed = speedOfSoundAt(altitude);
  const mach = airspeed / soundSpeed;

  _forwardWorld.set(0, 0, -1).applyQuaternion(state.quaternion);
  _upWorld.set(0, 1, 0).applyQuaternion(state.quaternion);
  _rightWorld.set(1, 0, 0).applyQuaternion(state.quaternion);

  let angleOfAttack = 0;
  if (airspeed > 1) {
    _velDir.copy(_tmp).normalize();
    _invQuat.copy(state.quaternion).invert();
    _vLocal.copy(_velDir).applyQuaternion(_invQuat);
    angleOfAttack = Math.atan2(-_vLocal.y, -_vLocal.z);
  }

  // Wing sweep affects effective aspect ratio / area / parasitic drag (F-14).
  const sweep = config.hasVariableSweep ? controls.wingSweep : 0;
  const effAspectRatio = THREE.MathUtils.lerp(config.aspectRatio, config.aspectRatio * 0.35, sweep);
  const effParasiticDrag = THREE.MathUtils.lerp(config.parasiticDrag, config.parasiticDrag * 1.35, sweep);

  // --- Lift ---
  let rawCL = config.liftSlope * (angleOfAttack - config.zeroLiftAoA);
  const stallMargin = Math.abs(angleOfAttack) - config.stallAoA;
  let stalled = false;
  if (stallMargin > 0) {
    stalled = true;
    const falloff = 1 / (1 + stallMargin * 6);
    rawCL *= 0.45 + 0.55 * falloff;
  }
  const flapLift = controls.flaps * 0.45;
  let CL = THREE.MathUtils.clamp(rawCL + flapLift, -config.maxLiftCoefficient * 0.8, config.maxLiftCoefficient);

  const dynamicPressure = 0.5 * rho * airspeed * airspeed;
  let liftMag = dynamicPressure * config.wingArea * CL;

  // Fly-by-wire style G-limiting: scale lift down so commanded G stays within structural limit.
  const gFromLift = liftMag / (state.mass * GRAVITY);
  if (gFromLift > config.maxG && gFromLift > 0.01) {
    liftMag *= config.maxG / gFromLift;
  } else if (gFromLift < config.minG && gFromLift < -0.01) {
    liftMag *= config.minG / gFromLift;
  }

  // Ground effect: extra lift, less induced drag, within ~15m of the ground.
  const groundEffect = altitudeAGL < 15 ? THREE.MathUtils.lerp(1.2, 1, altitudeAGL / 15) : 1;
  liftMag *= groundEffect;

  _liftDir.copy(_rightWorld).cross(_velDir.lengthSq() > 0 ? _velDir : _forwardWorld).normalize();

  // --- Drag ---
  const inducedDragFactor = 1 / (Math.PI * effAspectRatio * config.oswaldEfficiency);
  let CD = effParasiticDrag + inducedDragFactor * CL * CL;
  if (controls.gearDown) CD += 0.018;
  if (controls.speedbrake) CD += 0.05;
  CD += controls.flaps * 0.025;
  const dragMag = dynamicPressure * config.wingArea * CD * transonicDragFactor(mach) / groundEffect;

  // --- Thrust ---
  const maxAvailable = controls.afterburner && config.hasAfterburner ? config.afterburnerThrust : config.maxThrust;
  const thrustMag = maxAvailable * THREE.MathUtils.clamp(controls.throttle, 0, 1);
  const vtol = config.hasVTOL ? THREE.MathUtils.clamp(controls.vtolNozzle, 0, 1) : 0;
  _thrustDir.copy(_forwardWorld).multiplyScalar(1 - vtol).addScaledVector(_upWorld, vtol);
  if (_thrustDir.lengthSq() > 1e-6) _thrustDir.normalize();

  // --- Assemble forces ---
  _totalForce.set(0, -state.mass * GRAVITY, 0); // weight
  _totalForce.addScaledVector(_thrustDir, thrustMag);
  if (airspeed > 0.5) {
    _totalForce.addScaledVector(_liftDir, liftMag);
    _totalForce.addScaledVector(_velDir, -dragMag);
  }

  // Low-altitude turbulence + ambient gust buffeting (small, constant character).
  const turbulenceScale = altitudeAGL < 60 ? THREE.MathUtils.lerp(1.8, 0.3, altitudeAGL / 60) : 0.3;
  const gust =
    Math.sin(elapsedTime * 3.1 + state.position.x * 0.01) * Math.cos(elapsedTime * 1.7 + state.position.z * 0.01);
  _totalForce.addScaledVector(_upWorld, gust * turbulenceScale * dynamicPressure * 0.02);

  // --- Ground contact ---
  const gearHeight = config.category === "airliner" ? 5.2 : config.category === "stealthBomber" ? 3.2 : 1.6;
  let onGround = false;
  if (altitudeAGL <= gearHeight) {
    onGround = true;
    state.position.y = groundY + gearHeight;
    if (state.velocity.y < 0) state.velocity.y = 0;
    // Rolling friction on the ground.
    state.velocity.x *= 0.995;
    state.velocity.z *= 0.995;
    _totalForce.y += state.mass * GRAVITY; // cancel residual sink while resting on gear
  }

  integrateRigidBody(state, _totalForce, dt);

  // --- Rotational control (rate-commanded with inertia, authority scales with airspeed) ---
  const authority = THREE.MathUtils.clamp(dynamicPressure / REFERENCE_DYNAMIC_PRESSURE, 0.12, 1.5);
  const targetAngular = new THREE.Vector3(
    controls.pitch * config.maxPitchRate * authority,
    controls.yaw * config.maxYawRate * authority * 0.7,
    -controls.roll * config.maxRollRate * authority,
  );
  const responsiveness = onGround ? 3 : 7;
  const blend = 1 - Math.exp(-responsiveness * dt);
  state.angularVelocity.lerp(targetAngular, blend);
  if (onGround) state.angularVelocity.x = Math.min(state.angularVelocity.x, 0.15);

  const heading = Math.atan2(_forwardWorld.x, -_forwardWorld.z);

  return {
    airspeed,
    altitude: state.position.y,
    altitudeAGL: Math.max(0, state.position.y - groundY),
    angleOfAttack,
    gForce: gFromLift,
    mach,
    stalled,
    onGround,
    headingRad: heading,
    climbRate: state.velocity.y,
  };
}
