import * as THREE from "three";
import type { RunwayDef } from "./cityTypes";

let cachedWindowMap: THREE.Texture | null = null;

/** Procedural lit-window facade texture shared by every skyscraper in every city. */
function windowMap(): THREE.Texture {
  if (cachedWindowMap) return cachedWindowMap;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d1720";
  ctx.fillRect(0, 0, size, size);
  const cell = 16;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const lit = Math.random() < 0.35;
      ctx.fillStyle = lit ? `rgba(255,${200 + Math.random() * 55},${140 + Math.random() * 60},0.9)` : "rgba(40,55,68,0.85)";
      ctx.fillRect(x + 2, y + 2, cell - 4, cell - 5);
    }
  }
  cachedWindowMap = new THREE.CanvasTexture(canvas);
  cachedWindowMap.wrapS = cachedWindowMap.wrapT = THREE.RepeatWrapping;
  return cachedWindowMap;
}

export interface SkyscraperOptions {
  count: number;
  centerX: number;
  centerZ: number;
  spread: number;
  minHeight: number;
  maxHeight: number;
  baseY?: number;
}

export function buildSkyscraperCluster(group: THREE.Group, opts: SkyscraperOptions, envMap: THREE.Texture | null): void {
  const material = new THREE.MeshStandardMaterial({
    map: windowMap(),
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.35,
    envMap: envMap ?? undefined,
    envMapIntensity: 1.2,
  });
  const baseY = opts.baseY ?? 0;
  for (let i = 0; i < opts.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.6) * opts.spread;
    const x = opts.centerX + Math.cos(angle) * radius;
    const z = opts.centerZ + Math.sin(angle) * radius;
    const heightT = 1 - radius / opts.spread;
    const height = THREE.MathUtils.lerp(opts.minHeight, opts.maxHeight, Math.pow(heightT, 1.5) * (0.5 + Math.random() * 0.6));
    const width = 18 + Math.random() * 26;
    const depth = 18 + Math.random() * 26;
    const geo = new THREE.BoxGeometry(width, height, depth);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let v = 0; v < uv.count; v++) {
      uv.setXY(v, uv.getX(v) * (width / 10), uv.getY(v) * (height / 10));
    }
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, baseY + height / 2, z);
    mesh.rotation.y = Math.random() * Math.PI * 0.1;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}

let cachedLatticeMap: THREE.Texture | null = null;
function latticeAlphaMap(): THREE.Texture {
  if (cachedLatticeMap) return cachedLatticeMap;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  for (let i = -size; i < size * 2; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  cachedLatticeMap = new THREE.CanvasTexture(canvas);
  cachedLatticeMap.wrapS = cachedLatticeMap.wrapT = THREE.RepeatWrapping;
  cachedLatticeMap.repeat.set(1, 6);
  return cachedLatticeMap;
}

/** A tapered open-lattice tower stack — used for Eiffel-Tower-like and Tokyo-Tower-like landmarks. */
export function buildLatticeTower(
  group: THREE.Group,
  position: THREE.Vector3,
  totalHeight: number,
  color: number,
): void {
  const mat = new THREE.MeshStandardMaterial({
    color,
    map: latticeAlphaMap(),
    alphaMap: latticeAlphaMap(),
    transparent: true,
    metalness: 0.7,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const segments = [
    { h: totalHeight * 0.45, rBottom: totalHeight * 0.16, rTop: totalHeight * 0.09 },
    { h: totalHeight * 0.3, rBottom: totalHeight * 0.09, rTop: totalHeight * 0.045 },
    { h: totalHeight * 0.25, rBottom: totalHeight * 0.045, rTop: totalHeight * 0.006 },
  ];
  let y = position.y;
  for (const seg of segments) {
    const geo = new THREE.CylinderGeometry(seg.rTop, seg.rBottom, seg.h, 4, 1, true);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = Math.PI / 4;
    mesh.position.set(position.x, y + seg.h / 2, position.z);
    mesh.castShadow = true;
    group.add(mesh);
    y += seg.h;
  }
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 1.2, totalHeight * 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 }),
  );
  antenna.position.set(position.x, y + (totalHeight * 0.06) / 2, position.z);
  group.add(antenna);
}

/** A tall tiered, tapering spire — used for Burj-Khalifa-like landmarks. */
export function buildTaperedSpire(group: THREE.Group, position: THREE.Vector3, totalHeight: number): void {
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 0.75, roughness: 0.2 });
  const tiers = 7;
  let y = position.y;
  let radius = totalHeight * 0.045;
  for (let i = 0; i < tiers; i++) {
    const h = totalHeight * (0.16 - i * 0.008);
    const rTop = radius * (0.78 - i * 0.02);
    const geo = new THREE.CylinderGeometry(rTop, radius, h, 8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, y + h / 2, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    y += h;
    radius = rTop;
  }
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, radius, totalHeight * 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.15 }),
  );
  spire.position.set(position.x, y + (totalHeight * 0.12) / 2, position.z);
  group.add(spire);
}

/** A simplified statue-on-pedestal landmark (evokes Statue-of-Liberty-style silhouettes). */
export function buildSimpleStatue(group: THREE.Group, position: THREE.Vector3, height: number): void {
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x9c8f74, roughness: 0.85 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.22, height * 0.26, height * 0.3, 8), pedestalMat);
  pedestal.position.set(position.x, position.y + height * 0.15, position.z);
  pedestal.castShadow = true;
  group.add(pedestal);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a8a72, roughness: 0.7, metalness: 0.15 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.1, height * 0.16, height * 0.5, 10), bodyMat);
  body.position.set(position.x, position.y + height * 0.3 + height * 0.25, position.z);
  body.castShadow = true;
  group.add(body);

  const armGeo = new THREE.CylinderGeometry(height * 0.03, height * 0.035, height * 0.28, 6);
  const arm = new THREE.Mesh(armGeo, bodyMat);
  arm.position.set(position.x + height * 0.08, position.y + height * 0.75, position.z);
  arm.rotation.z = THREE.MathUtils.degToRad(-15);
  group.add(arm);

  const torch = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.04, height * 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0xffcc55, emissive: 0xffaa33, emissiveIntensity: 0.4 }),
  );
  torch.position.set(position.x + height * 0.1, position.y + height * 0.92, position.z);
  group.add(torch);
}

export function buildRunway(group: THREE.Group, runway: RunwayDef, elevation: number): void {
  const dir = new THREE.Vector2().subVectors(runway.end, runway.start);
  const length = dir.length();
  const mid = new THREE.Vector2().addVectors(runway.start, runway.end).multiplyScalar(0.5);
  const angle = Math.atan2(dir.y, dir.x);

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3a3d40";
  ctx.fillRect(0, 0, 128, 1024);
  ctx.strokeStyle = "#e8e8e0";
  ctx.lineWidth = 8;
  ctx.setLineDash([40, 30]);
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.lineTo(64, 1024);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#e8e8e0";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(20, 20 + i * 22, 12, 14);
    ctx.fillRect(96, 20 + i * 22, 12, 14);
  }
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(runway.width, length), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angle + Math.PI / 2;
  mesh.position.set(mid.x, elevation + 0.03, mid.y);
  mesh.receiveShadow = true;
  group.add(mesh);
}
