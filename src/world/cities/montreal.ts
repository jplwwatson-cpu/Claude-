import * as THREE from "three";
import type { CityDefinition } from "./cityTypes";
import { buildSkyscraperCluster, buildRunway } from "./cityKit";

const CENTER = new THREE.Vector2(0, 0);
const BASE_ELEVATION = 4;

function buildOlympicTower(group: THREE.Group, envMap: THREE.Texture | null): void {
  // The real Montreal Tower leans at ~45 degrees — the tallest inclined tower in the world.
  const mat = new THREE.MeshStandardMaterial({
    color: 0xb8b2a2,
    metalness: 0.3,
    roughness: 0.6,
    envMap: envMap ?? undefined,
  });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 9, 165, 8), mat);
  tower.position.set(CENTER.x + 900, BASE_ELEVATION + 70, CENTER.y - 600);
  tower.rotation.z = THREE.MathUtils.degToRad(45);
  tower.castShadow = true;
  group.add(tower);

  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c4, metalness: 0.2, roughness: 0.7 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(95, 110, 28, 24), bowlMat);
  bowl.position.set(CENTER.x + 900, BASE_ELEVATION + 14, CENTER.y - 380);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);
}

function buildMountRoyal(group: THREE.Group): void {
  const mat = new THREE.MeshStandardMaterial({ color: 0x2d4a2b, roughness: 1 });
  const hill = new THREE.Mesh(new THREE.SphereGeometry(650, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), mat);
  hill.position.set(CENTER.x - 1400, BASE_ELEVATION - 40, CENTER.y + 900);
  hill.receiveShadow = true;
  group.add(hill);

  const crossMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, emissive: 0xffffff, emissiveIntensity: 0.15 });
  const crossGroup = new THREE.Group();
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 2), crossMat);
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 2), crossMat);
  horizontal.position.y = 7;
  crossGroup.add(vertical, horizontal);
  crossGroup.position.set(CENTER.x - 1400, BASE_ELEVATION + 220, CENTER.y + 900);
  group.add(crossGroup);
}

export const MONTREAL: CityDefinition = {
  id: "montreal",
  name: "Montreal",
  center: CENTER,
  flattenRadius: 3200,
  baseElevation: BASE_ELEVATION,
  runway: {
    start: new THREE.Vector2(CENTER.x - 1900, CENTER.y - 500),
    end: new THREE.Vector2(CENTER.x - 900, CENTER.y - 500),
    width: 45,
  },
  spawnPosition: new THREE.Vector3(CENTER.x - 1850, BASE_ELEVATION + 2, CENTER.y - 500),
  spawnHeadingRad: 0,
  buildLandmarks(group, envMap) {
    buildSkyscraperCluster(
      group,
      { count: 90, centerX: CENTER.x + 200, centerZ: CENTER.y + 100, spread: 900, minHeight: 40, maxHeight: 220, baseY: BASE_ELEVATION },
      envMap,
    );
    buildOlympicTower(group, envMap);
    buildMountRoyal(group);
    buildRunway(group, this.runway, BASE_ELEVATION);
  },
};
