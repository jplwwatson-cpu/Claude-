import * as THREE from "three";

let cachedPanelNormalMap: THREE.Texture | null = null;
let cachedPanelRoughnessMap: THREE.Texture | null = null;

/** Procedural panel-line + rivet detail maps shared by every aircraft skin (no texture downloads). */
function panelMaps(): { normalMap: THREE.Texture; roughnessMap: THREE.Texture } {
  if (cachedPanelNormalMap && cachedPanelRoughnessMap) {
    return { normalMap: cachedPanelNormalMap, roughnessMap: cachedPanelRoughnessMap };
  }
  const size = 512;
  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = heightCanvas.height = size;
  const hctx = heightCanvas.getContext("2d")!;
  hctx.fillStyle = "rgb(128,128,128)";
  hctx.fillRect(0, 0, size, size);

  // Panel seams
  hctx.strokeStyle = "rgba(80,80,80,0.9)";
  hctx.lineWidth = 1.5;
  const cell = 48;
  for (let x = 0; x <= size; x += cell) {
    hctx.beginPath();
    hctx.moveTo(x + (Math.random() - 0.5) * 4, 0);
    hctx.lineTo(x + (Math.random() - 0.5) * 4, size);
    hctx.stroke();
  }
  for (let y = 0; y <= size; y += cell) {
    hctx.beginPath();
    hctx.moveTo(0, y + (Math.random() - 0.5) * 4);
    hctx.lineTo(size, y + (Math.random() - 0.5) * 4);
    hctx.stroke();
  }
  // Rivets
  hctx.fillStyle = "rgba(170,170,170,0.8)";
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    hctx.fillRect(x, y, 1, 1);
  }
  // Fine noise for brushed-metal micro detail
  const img = hctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = img.data[i];
    img.data[i + 2] = img.data[i];
  }
  hctx.putImageData(img, 0, 0);

  const src = hctx.getImageData(0, 0, size, size).data;
  const at = (x: number, y: number) => src[((((y + size) % size) * size + ((x + size) % size)) * 4)] / 255;
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = normalCanvas.height = size;
  const nctx = normalCanvas.getContext("2d")!;
  const nimg = nctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = at(x - 1, y);
      const r = at(x + 1, y);
      const u = at(x, y - 1);
      const d = at(x, y + 1);
      const nx = (l - r) * 3.0;
      const ny = (u - d) * 3.0;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      nimg.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      nimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = roughCanvas.height = size;
  const rctx = roughCanvas.getContext("2d")!;
  const rimg = rctx.createImageData(size, size);
  for (let i = 0; i < rimg.data.length; i += 4) {
    const v = 90 + Math.random() * 60 + (src[i] - 128) * 0.3;
    rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = Math.max(0, Math.min(255, v));
    rimg.data[i + 3] = 255;
  }
  rctx.putImageData(rimg, 0, 0);

  cachedPanelNormalMap = new THREE.CanvasTexture(normalCanvas);
  cachedPanelRoughnessMap = new THREE.CanvasTexture(roughCanvas);
  for (const t of [cachedPanelNormalMap, cachedPanelRoughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    t.needsUpdate = true;
  }
  return { normalMap: cachedPanelNormalMap, roughnessMap: cachedPanelRoughnessMap };
}

export function createFuselageMaterial(opts: {
  color: number;
  metalness?: number;
  roughness?: number;
  map?: THREE.Texture;
  envMap?: THREE.Texture | null;
}): THREE.MeshStandardMaterial {
  const { normalMap, roughnessMap } = panelMaps();
  return new THREE.MeshStandardMaterial({
    color: opts.color,
    map: opts.map,
    metalness: opts.metalness ?? 0.75,
    roughness: opts.roughness ?? 0.45,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap,
    envMap: opts.envMap ?? undefined,
    envMapIntensity: 1.1,
  });
}

export function createCanopyMaterial(envMap?: THREE.Texture | null): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0d1a1f,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.55,
    thickness: 0.3,
    transparent: true,
    opacity: 0.92,
    envMap: envMap ?? undefined,
    envMapIntensity: 1.6,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
}

export function createStealthMaterial(color = 0x14161a, envMap?: THREE.Texture | null): THREE.MeshStandardMaterial {
  const { normalMap } = panelMaps();
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.35,
    roughness: 0.75,
    normalMap,
    normalScale: new THREE.Vector2(0.2, 0.2),
    envMap: envMap ?? undefined,
    envMapIntensity: 0.5,
  });
}

export function createEngineMetalMaterial(envMap?: THREE.Texture | null): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x3a3d42,
    metalness: 0.95,
    roughness: 0.32,
    envMap: envMap ?? undefined,
    envMapIntensity: 1.3,
  });
}

export function createAfterburnerMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xff8a33,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function createGlassMaterial(color = 0x111417): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.15 });
}

export function createTireMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.05, roughness: 0.85 });
}
