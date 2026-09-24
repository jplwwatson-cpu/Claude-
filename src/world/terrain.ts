import * as THREE from "three";

export type HeightFn = (x: number, z: number) => number;

const WATER_LEVEL = 0;

function createDetailTextures(): { normalMap: THREE.Texture; roughnessMap: THREE.Texture } {
  const size = 256;
  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = heightCanvas.height = size;
  const hctx = heightCanvas.getContext("2d")!;
  const img = hctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n =
        (Math.sin(x * 0.15) + Math.cos(y * 0.17) + Math.sin((x + y) * 0.09)) * 20 +
        (Math.random() - 0.5) * 40 +
        128;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, n));
      img.data[i + 3] = 255;
    }
  }
  hctx.putImageData(img, 0, 0);

  // Sobel-derive a normal map from the noise height canvas.
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = normalCanvas.height = size;
  const nctx = normalCanvas.getContext("2d")!;
  const src = hctx.getImageData(0, 0, size, size).data;
  const nimg = nctx.createImageData(size, size);
  const at = (x: number, y: number) => src[((((y + size) % size) * size + ((x + size) % size)) * 4)] / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = at(x - 1, y);
      const r = at(x + 1, y);
      const u = at(x, y - 1);
      const d = at(x, y + 1);
      const nx = (l - r) * 2.2;
      const ny = (u - d) * 2.2;
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
    const v = 150 + Math.random() * 90;
    rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = v;
    rimg.data[i + 3] = 255;
  }
  rctx.putImageData(rimg, 0, 0);

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  for (const tex of [normalMap, roughnessMap]) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(400, 400);
    tex.needsUpdate = true;
  }
  return { normalMap, roughnessMap };
}

const _grass = new THREE.Color(0x3d5a2e);
const _dirt = new THREE.Color(0x6b5a3f);
const _rock = new THREE.Color(0x767268);
const _sand = new THREE.Color(0xcdb489);
const _snow = new THREE.Color(0xf3f5f7);
const _tmpColor = new THREE.Color();

function biomeColor(height: number, slope: number): THREE.Color {
  let c: THREE.Color;
  if (height < WATER_LEVEL + 3) c = _tmpColor.copy(_sand);
  else if (height > 340) c = _tmpColor.copy(_snow);
  else c = _tmpColor.copy(_grass).lerp(_dirt, THREE.MathUtils.clamp((height - 40) / 220, 0, 1));
  return c.lerp(_rock, THREE.MathUtils.clamp((slope - 0.35) / 0.5, 0, 1));
}

interface ChunkKey {
  cx: number;
  cz: number;
  lod: number;
}

export class ChunkedTerrain {
  readonly group = new THREE.Group();
  private chunks = new Map<string, THREE.Mesh>();
  private material: THREE.MeshStandardMaterial;
  private lastCenter = new THREE.Vector2(Infinity, Infinity);

  static readonly CHUNK_SIZE = 500;
  static readonly LOD_RINGS = [
    { radiusChunks: 5, segments: 56 },
    { radiusChunks: 11, segments: 18 },
    { radiusChunks: 20, segments: 8 },
  ];

  constructor(
    private scene: THREE.Scene,
    private heightFn: HeightFn,
  ) {
    const { normalMap, roughnessMap } = createDetailTextures();
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      normalMap,
      roughnessMap,
      roughness: 1,
      metalness: 0,
      normalScale: new THREE.Vector2(0.6, 0.6),
    });
    scene.add(this.group);
  }

  private buildChunk(cx: number, cz: number, lod: number): THREE.Mesh {
    const size = ChunkedTerrain.CHUNK_SIZE;
    const segments = ChunkedTerrain.LOD_RINGS[lod].segments;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const originX = cx * size;
    const originZ = cz * size;

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = originX + lx;
      const wz = originZ + lz;
      const h = this.heightFn(wx, wz);
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    const normalAttr = geo.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const slope = 1 - normalAttr.getY(i);
      const c = biomeColor(pos.getY(i), slope);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.position.set(originX, 0, originZ);
    mesh.receiveShadow = true;
    mesh.castShadow = lod === 0;
    return mesh;
  }

  update(centerX: number, centerZ: number): void {
    const chunkSize = ChunkedTerrain.CHUNK_SIZE;
    if (Math.hypot(centerX - this.lastCenter.x, centerZ - this.lastCenter.y) < chunkSize * 0.5) return;
    this.lastCenter.set(centerX, centerZ);

    const centerCx = Math.round(centerX / chunkSize);
    const centerCz = Math.round(centerZ / chunkSize);

    const wanted = new Map<string, ChunkKey>();
    const rings = ChunkedTerrain.LOD_RINGS;
    for (let lod = 0; lod < rings.length; lod++) {
      const inner = lod === 0 ? 0 : rings[lod - 1].radiusChunks;
      const outer = rings[lod].radiusChunks;
      for (let dz = -outer; dz <= outer; dz++) {
        for (let dx = -outer; dx <= outer; dx++) {
          const d = Math.max(Math.abs(dx), Math.abs(dz));
          if (d > outer || d <= inner) continue;
          const cx = centerCx + dx;
          const cz = centerCz + dz;
          wanted.set(`${cx}:${cz}`, { cx, cz, lod });
        }
      }
    }

    for (const [key, mesh] of this.chunks) {
      if (!wanted.has(key)) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
        this.chunks.delete(key);
      }
    }
    for (const [key, k] of wanted) {
      if (!this.chunks.has(key)) {
        const mesh = this.buildChunk(k.cx, k.cz, k.lod);
        this.chunks.set(key, mesh);
        this.group.add(mesh);
      }
    }
  }

  dispose(): void {
    for (const mesh of this.chunks.values()) mesh.geometry.dispose();
    this.material.dispose();
  }
}

export { WATER_LEVEL };
