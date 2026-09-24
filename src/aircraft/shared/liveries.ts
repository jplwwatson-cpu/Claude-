import * as THREE from "three";
import type { AircraftConfig } from "../../physics/aircraftConfigs";

export interface LiveryTextures {
  camoMap: THREE.Texture | null;
  baseColor: number;
  roundel: THREE.Texture;
  tailFlash: THREE.Texture;
  tailText: string;
}

function blank(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

/** Two-tone blotchy air-superiority camo, tileable-ish, used as the fuselage/wing base color map. */
function createCamoTexture(colorA: string, colorB: string, colorC: string): THREE.Texture {
  const { canvas, ctx } = blank(512);
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 512, 512);
  const blot = (color: string, count: number, minR: number, maxR: number) => {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = minR + Math.random() * (maxR - minR);
      ctx.beginPath();
      const points = 7 + Math.floor(Math.random() * 4);
      for (let p = 0; p < points; p++) {
        const ang = (p / points) * Math.PI * 2;
        const rr = r * (0.7 + Math.random() * 0.6);
        const px = x + Math.cos(ang) * rr;
        const py = y + Math.sin(ang) * rr;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  };
  blot(colorB, 14, 40, 90);
  blot(colorC, 10, 25, 60);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** Draws a stylized 11-point maple-leaf silhouette (polar lobed star), not a traced logo. */
function drawMapleLeaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const lobed = 1 + 0.32 * Math.cos(5 * theta) * Math.max(0, Math.cos(theta * 0.5));
    const stemPinch = theta > Math.PI * 0.85 && theta < Math.PI * 1.15 ? 0.55 : 1;
    const radius = r * lobed * stemPinch;
    const x = cx + Math.cos(theta - Math.PI / 2) * radius;
    const y = cy + Math.sin(theta - Math.PI / 2) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function createRoundel(kind: AircraftConfig["livery"]): THREE.Texture {
  const size = 256;
  const { canvas, ctx } = blank(size);
  const cx = size / 2;
  const cy = size / 2;

  if (kind === "rcaf") {
    ctx.fillStyle = "#5b9bd5";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5f7fa";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    drawMapleLeaf(ctx, cx, cy, size * 0.26, "#c8102e");
  } else if (kind === "usaf" || kind === "usn") {
    ctx.fillStyle = "#0a2f5c";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5f7fa";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a2f5c";
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.22);
    ctx.lineTo(cx + size * 0.22, cy);
    ctx.lineTo(cx, cy + size * 0.22);
    ctx.lineTo(cx - size * 0.22, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#c8102e";
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "french") {
    const bands = ["#0055a4", "#ffffff", "#ef4135"];
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.clip();
    bands.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i / 3) * size, 0, size / 3, size);
    });
    ctx.restore();
  } else if (kind === "civilian") {
    ctx.fillStyle = "#1c3d6e";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2c744";
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.3);
    for (let i = 1; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? size * 0.3 : size * 0.14;
      ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#7a1f1f";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e0c34c";
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createTailFlash(kind: AircraftConfig["livery"], label: string): THREE.Texture {
  const w = 256;
  const h = 384;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);

  const palette: Record<string, [string, string]> = {
    rcaf: ["#1c1c1e", "#c8102e"],
    usaf: ["#1c1c1e", "#0a2f5c"],
    usn: ["#0a2f5c", "#f5c518"],
    french: ["#1c1c1e", "#0055a4"],
    civilian: ["#f5f7fa", "#1c3d6e"],
    "generic-military": ["#2b2b28", "#7a1f1f"],
  };
  const [bg, accent] = palette[kind] ?? palette["generic-military"];
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, h * 0.72, w, h * 0.1);

  ctx.fillStyle = kind === "civilian" ? "#1c3d6e" : "#f5f7fa";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.save();
  ctx.translate(w * 0.5, h * 0.42);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(label, 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const CAMO_PALETTES: Record<string, [string, string, string]> = {
  rcaf: ["#6d757a", "#565e63", "#7d858a"],
  usaf: ["#5b6268", "#484e53", "#6a7176"],
  usn: ["#4a5257", "#3a4145", "#5a6469"],
  french: ["#5f6a6f", "#4a5458", "#71797d"],
  "generic-military": ["#5c5648", "#453f34", "#6b6455"],
};

export function createLivery(config: AircraftConfig): LiveryTextures {
  const label = config.livery === "rcaf" ? "RCAF · ARC" : config.displayName.split(" ")[0].toUpperCase();
  const roundel = createRoundel(config.livery);
  const tailFlash = createTailFlash(config.livery, label);

  if (config.livery === "civilian") {
    return { camoMap: null, baseColor: 0xf2f4f6, roundel, tailFlash, tailText: "AERODYNE AIRLINES" };
  }

  const palette = CAMO_PALETTES[config.livery] ?? CAMO_PALETTES["generic-military"];
  const camoMap = config.category === "stealthBomber" ? null : createCamoTexture(...palette);
  const baseColor =
    config.category === "stealthBomber" ? 0x15171a : parseInt(palette[0].replace("#", ""), 16);

  return { camoMap, baseColor, roundel, tailFlash, tailText: label };
}

export function attachDecal(
  parent: THREE.Object3D,
  texture: THREE.Texture,
  position: THREE.Vector3,
  widthMeters: number,
  heightMeters: number,
  rotationY = 0,
  rotationX = 0,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(widthMeters, heightMeters);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.rotation.y = rotationY;
  mesh.rotation.x = rotationX;
  parent.add(mesh);
  return mesh;
}
