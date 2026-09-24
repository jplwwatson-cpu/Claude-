import * as THREE from "three";
import type { CityDefinition } from "./cityTypes";
import { buildSkyscraperCluster, buildRunway, buildLatticeTower } from "./cityKit";

const CENTER = new THREE.Vector2(-60000, 30000);
const BASE_ELEVATION = 3;

export const TOKYO: CityDefinition = {
  id: "tokyo",
  name: "Tokyo",
  center: CENTER,
  flattenRadius: 3300,
  baseElevation: BASE_ELEVATION,
  runway: {
    start: new THREE.Vector2(CENTER.x - 2000, CENTER.y - 1200),
    end: new THREE.Vector2(CENTER.x - 1000, CENTER.y - 1200),
    width: 45,
  },
  spawnPosition: new THREE.Vector3(CENTER.x - 1950, BASE_ELEVATION + 2, CENTER.y - 1200),
  spawnHeadingRad: 0,
  buildLandmarks(group, envMap) {
    buildSkyscraperCluster(
      group,
      { count: 150, centerX: CENTER.x, centerZ: CENTER.y, spread: 1000, minHeight: 40, maxHeight: 210, baseY: BASE_ELEVATION },
      envMap,
    );
    // Tokyo Tower — same lattice silhouette technique as Paris's, in its signature orange/white.
    buildLatticeTower(group, new THREE.Vector3(CENTER.x + 200, BASE_ELEVATION, CENTER.y + 300), 333, 0xd94f2a);
    buildRunway(group, this.runway, BASE_ELEVATION);
  },
};
