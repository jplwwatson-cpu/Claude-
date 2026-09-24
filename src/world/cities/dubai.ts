import * as THREE from "three";
import type { CityDefinition } from "./cityTypes";
import { buildSkyscraperCluster, buildRunway, buildTaperedSpire } from "./cityKit";

const CENTER = new THREE.Vector2(60000, 60000);
const BASE_ELEVATION = 2;

export const DUBAI: CityDefinition = {
  id: "dubai",
  name: "Dubai",
  center: CENTER,
  flattenRadius: 3200,
  baseElevation: BASE_ELEVATION,
  runway: {
    start: new THREE.Vector2(CENTER.x - 2100, CENTER.y - 1100),
    end: new THREE.Vector2(CENTER.x - 1100, CENTER.y - 1100),
    width: 50,
  },
  spawnPosition: new THREE.Vector3(CENTER.x - 2050, BASE_ELEVATION + 2, CENTER.y - 1100),
  spawnHeadingRad: 0,
  buildLandmarks(group, envMap) {
    buildSkyscraperCluster(
      group,
      { count: 110, centerX: CENTER.x, centerZ: CENTER.y, spread: 1000, minHeight: 50, maxHeight: 230, baseY: BASE_ELEVATION },
      envMap,
    );
    buildTaperedSpire(group, new THREE.Vector3(CENTER.x + 100, BASE_ELEVATION, CENTER.y - 100), 828);
    buildRunway(group, this.runway, BASE_ELEVATION);
  },
};
