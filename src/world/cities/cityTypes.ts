import * as THREE from "three";

export interface RunwayDef {
  start: THREE.Vector2;
  end: THREE.Vector2;
  width: number;
}

export interface CityDefinition {
  id: string;
  name: string;
  center: THREE.Vector2;
  flattenRadius: number;
  baseElevation: number;
  runway: RunwayDef;
  spawnPosition: THREE.Vector3;
  spawnHeadingRad: number;
  /** Adds landmark meshes (positioned in world space) to the given group. */
  buildLandmarks: (group: THREE.Group, envMap: THREE.Texture | null) => void;
}
