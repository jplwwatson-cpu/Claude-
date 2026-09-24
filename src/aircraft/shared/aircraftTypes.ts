import * as THREE from "three";
import type { AircraftConfig } from "../../physics/aircraftConfigs";
import type { AnimatedParts } from "./animatedParts";

export interface AircraftInstance {
  /** Root visual group. Local -Z is the nose/forward direction, +Y is up. */
  group: THREE.Group;
  parts: AnimatedParts;
  /** Camera position for cockpit view, in the group's local space. */
  cockpitOffset: THREE.Vector3;
  config: AircraftConfig;
}

export type AircraftBuilder = (config: AircraftConfig, envMap: THREE.Texture | null) => AircraftInstance;
