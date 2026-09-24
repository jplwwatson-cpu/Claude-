import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { WATER_LEVEL } from "./terrain";

/** Procedural tileable water-ripple normal map — no external waternormals.jpg needed. */
function proceduralWaterNormals(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      let h = 0;
      h += Math.sin(u * 6 + Math.cos(v * 5)) * 0.5;
      h += Math.sin(v * 9 + Math.cos(u * 7)) * 0.35;
      h += Math.sin((u + v) * 13) * 0.15;
      heights[y * size + x] = h;
    }
  }
  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = at(x - 1, y);
      const r = at(x + 1, y);
      const u = at(x, y - 1);
      const d = at(x, y + 1);
      const nx = (l - r) * 1.4;
      const ny = (u - d) * 1.4;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createOcean(sunDirection: THREE.Vector3): Water {
  const geometry = new THREE.PlaneGeometry(400000, 400000);
  const water = new Water(geometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: proceduralWaterNormals(),
    sunDirection: sunDirection.clone(),
    sunColor: 0xfff3e0,
    waterColor: 0x0a3a4a,
    distortionScale: 3.2,
    fog: true,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_LEVEL;
  (water.material as THREE.ShaderMaterial).uniforms["size"].value = 6;
  return water;
}

export function updateOcean(water: Water, dt: number, sunDirection: THREE.Vector3): void {
  const mat = water.material as THREE.ShaderMaterial;
  mat.uniforms["time"].value += dt * 0.7;
  mat.uniforms["sunDirection"].value.copy(sunDirection);
}
