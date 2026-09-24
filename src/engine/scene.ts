import * as THREE from "three";

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbfd6e8, 0.000022);

  const hemi = new THREE.HemisphereLight(0xbcd6f0, 0x2b2a24, 0.65);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.12);
  scene.add(ambient);

  return scene;
}
