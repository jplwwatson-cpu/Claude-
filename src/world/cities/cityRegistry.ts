import * as THREE from "three";
import { terrainHeightBase, terrainDetail } from "../noise";
import type { CityDefinition } from "./cityTypes";
import { MONTREAL } from "./montreal";
import { NEW_YORK } from "./newyork";
import { PARIS } from "./paris";
import { DUBAI } from "./dubai";
import { TOKYO } from "./tokyo";

export const CITIES: CityDefinition[] = [MONTREAL, NEW_YORK, PARIS, DUBAI, TOKYO];

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  let t = lenSq > 0 ? ((px - ax) * dx + (pz - az) * dz) / lenSq : 0;
  t = THREE.MathUtils.clamp(t, 0, 1);
  const cx = ax + dx * t;
  const cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

/**
 * World ground height: base procedural terrain, smoothly flattened toward
 * each city's elevation near its footprint, with runways flattened exactly.
 */
export function getWorldGroundHeight(x: number, z: number): number {
  const base = terrainHeightBase(x, z) + terrainDetail(x, z);
  let height = base;
  let maxWeight = 0;

  for (const city of CITIES) {
    const d = Math.hypot(x - city.center.x, z - city.center.y);
    const weight = 1 - THREE.MathUtils.smoothstep(d, city.flattenRadius * 0.4, city.flattenRadius);
    if (weight > maxWeight) maxWeight = weight;
    if (weight > 0.001) {
      height = THREE.MathUtils.lerp(height, city.baseElevation, weight);
    }

    const runwayDist = distanceToSegment(
      x,
      z,
      city.runway.start.x,
      city.runway.start.y,
      city.runway.end.x,
      city.runway.end.y,
    );
    const runwayWeight = 1 - THREE.MathUtils.smoothstep(runwayDist, city.runway.width * 0.5, city.runway.width * 0.5 + 25);
    if (runwayWeight > 0.001) {
      height = THREE.MathUtils.lerp(height, city.baseElevation, runwayWeight);
    }
  }

  return height;
}

export function getCity(id: string): CityDefinition {
  const city = CITIES.find((c) => c.id === id);
  if (!city) throw new Error(`Unknown city id: ${id}`);
  return city;
}
