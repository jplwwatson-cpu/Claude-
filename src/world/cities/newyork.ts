import * as THREE from "three";
import type { CityDefinition } from "./cityTypes";
import { buildSkyscraperCluster, buildRunway, buildSimpleStatue } from "./cityKit";

const CENTER = new THREE.Vector2(60000, 0);
const BASE_ELEVATION = 3;

export const NEW_YORK: CityDefinition = {
  id: "newyork",
  name: "New York",
  center: CENTER,
  flattenRadius: 3400,
  baseElevation: BASE_ELEVATION,
  runway: {
    start: new THREE.Vector2(CENTER.x - 2000, CENTER.y - 1300),
    end: new THREE.Vector2(CENTER.x - 1000, CENTER.y - 1300),
    width: 45,
  },
  spawnPosition: new THREE.Vector3(CENTER.x - 1950, BASE_ELEVATION + 2, CENTER.y - 1300),
  spawnHeadingRad: 0,
  buildLandmarks(group, envMap) {
    // Dense Manhattan-style core with one standout tower.
    buildSkyscraperCluster(
      group,
      { count: 140, centerX: CENTER.x, centerZ: CENTER.y, spread: 950, minHeight: 60, maxHeight: 260, baseY: BASE_ELEVATION },
      envMap,
    );
    const spireMat = new THREE.MeshStandardMaterial({ color: 0xcfcfd6, metalness: 0.5, roughness: 0.3, envMap: envMap ?? undefined });
    const tallest = new THREE.Mesh(new THREE.BoxGeometry(45, 420, 45), spireMat);
    tallest.position.set(CENTER.x + 60, BASE_ELEVATION + 210, CENTER.y + 40);
    tallest.castShadow = true;
    group.add(tallest);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2, 60, 8), spireMat);
    antenna.position.set(CENTER.x + 60, BASE_ELEVATION + 450, CENTER.y + 40);
    group.add(antenna);

    buildSimpleStatue(group, new THREE.Vector3(CENTER.x - 700, BASE_ELEVATION, CENTER.y - 700), 60);
    buildRunway(group, this.runway, BASE_ELEVATION);
  },
};
