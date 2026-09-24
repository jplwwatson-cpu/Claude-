import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

// Physically-based Rayleigh/Mie sky (bundled with three, no external HDRI needed).
// Also drives the sun directional light so lighting and sky stay consistent.

export interface SkySystem {
  sky: Sky;
  sunLight: THREE.DirectionalLight;
  sunDirection: THREE.Vector3;
  update: (elapsedSeconds: number) => void;
}

export function createSkySystem(scene: THREE.Scene): SkySystem {
  const sky = new Sky();
  sky.scale.setScalar(45000);
  scene.add(sky);

  const uniforms = sky.material.uniforms;
  uniforms["turbidity"].value = 0.6;
  uniforms["rayleigh"].value = 0.55;
  uniforms["mieCoefficient"].value = 0.0012;
  uniforms["mieDirectionalG"].value = 0.6;

  const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 4000;
  sunLight.shadow.camera.left = -1500;
  sunLight.shadow.camera.right = 1500;
  sunLight.shadow.camera.top = 1500;
  sunLight.shadow.camera.bottom = -1500;
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const sunDirection = new THREE.Vector3();
  const sunPos = new THREE.Vector3();

  function update(elapsedSeconds: number): void {
    // Slow day cycle: full pass ~20 minutes so lighting drifts cinematically without racing.
    const t = (elapsedSeconds / 1200) * Math.PI * 2;
    const elevation = THREE.MathUtils.degToRad(18 + Math.sin(t) * 35 + 25);
    const azimuth = THREE.MathUtils.degToRad(130 + elapsedSeconds * 0.3);

    sunPos.setFromSphericalCoords(1, Math.PI / 2 - elevation, azimuth);
    uniforms["sunPosition"].value.copy(sunPos);
    sunDirection.copy(sunPos).normalize();

    sunLight.position.copy(sunDirection).multiplyScalar(3000);
    sunLight.intensity = THREE.MathUtils.clamp(1.3 * Math.sin(elevation) + 0.25, 0.2, 1.6);
    const warmth = THREE.MathUtils.clamp(1 - Math.sin(elevation), 0, 1);
    sunLight.color.setRGB(1, 1 - warmth * 0.25, 1 - warmth * 0.5);
  }

  update(0);

  return { sky, sunLight, sunDirection, update };
}

export function followTarget(sunLight: THREE.DirectionalLight, target: THREE.Vector3): void {
  const offset = sunLight.position.clone().normalize().multiplyScalar(3000);
  sunLight.position.copy(target).add(offset);
  sunLight.target.position.copy(target);
  sunLight.target.updateMatrixWorld();
}
