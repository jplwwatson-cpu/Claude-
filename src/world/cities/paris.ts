import * as THREE from "three";
import type { CityDefinition } from "./cityTypes";
import { buildSkyscraperCluster, buildRunway, buildLatticeTower } from "./cityKit";

const CENTER = new THREE.Vector2(0, 60000);
const BASE_ELEVATION = 5;

export const PARIS: CityDefinition = {
  id: "paris",
  name: "Paris",
  center: CENTER,
  flattenRadius: 3000,
  baseElevation: BASE_ELEVATION,
  runway: {
    start: new THREE.Vector2(CENTER.x - 2000, CENTER.y + 900),
    end: new THREE.Vector2(CENTER.x - 1000, CENTER.y + 900),
    width: 45,
  },
  spawnPosition: new THREE.Vector3(CENTER.x - 1950, BASE_ELEVATION + 2, CENTER.y + 900),
  spawnHeadingRad: 0,
  buildLandmarks(group, envMap) {
    // Lower, denser European-style blocks with one modern tower on the periphery.
    buildSkyscraperCluster(
      group,
      { count: 100, centerX: CENTER.x + 300, centerZ: CENTER.y - 100, spread: 1100, minHeight: 18, maxHeight: 45, baseY: BASE_ELEVATION },
      envMap,
    );
    buildSkyscraperCluster(
      group,
      { count: 8, centerX: CENTER.x + 1400, centerZ: CENTER.y - 600, spread: 250, minHeight: 100, maxHeight: 210, baseY: BASE_ELEVATION },
      envMap,
    );
    buildLatticeTower(group, new THREE.Vector3(CENTER.x - 300, BASE_ELEVATION, CENTER.y + 200), 330, 0x5a4a34);
    buildRunway(group, this.runway, BASE_ELEVATION);
  },
};
