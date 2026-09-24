import { createNoise2D } from "simplex-noise";

// Deterministic seeded PRNG so terrain/clouds are identical every run (no external data needed).
function mulberry32(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const terrainNoise = createNoise2D(mulberry32(1337));
const detailNoise = createNoise2D(mulberry32(9001));
const cloudNoise = createNoise2D(mulberry32(4242));

/** Fractal Brownian motion terrain height in meters, before any per-city flattening. */
export function terrainHeightBase(x: number, z: number): number {
  let amplitude = 1;
  let frequency = 1 / 6000;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < 6; i++) {
    sum += terrainNoise(x * frequency, z * frequency) * amplitude;
    norm += amplitude;
    amplitude *= 0.48;
    frequency *= 2.15;
  }
  const macro = sum / norm; // -1..1
  // Push toward rolling lowlands with occasional ridgelines rather than uniform noise.
  const ridge = Math.pow(Math.abs(terrainNoise(x / 15000, z / 15000)), 1.4);
  return macro * 55 + ridge * 140 - 60;
}

export function terrainDetail(x: number, z: number): number {
  return detailNoise(x / 40, z / 40) * 0.6;
}

export function cloudDensity(x: number, y: number, z: number, t: number): number {
  const drift = t * 6;
  let sum = 0;
  let amp = 1;
  let freq = 1 / 900;
  for (let i = 0; i < 4; i++) {
    sum += cloudNoise((x + drift) * freq, (z + drift * 0.6) * freq) * amp;
    amp *= 0.5;
    freq *= 2.3;
  }
  const vertical = 1 - Math.min(1, Math.abs(y) / 400);
  return Math.max(0, sum * 0.5 + 0.35) * vertical;
}
