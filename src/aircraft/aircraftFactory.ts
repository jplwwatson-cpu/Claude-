import type { AircraftBuilder, AircraftInstance } from "./shared/aircraftTypes";
import * as THREE from "three";
import { getAircraftConfig } from "../physics/aircraftConfigs";
import { buildF18 } from "./f18";
import { buildF35 } from "./f35";
import { buildRafale } from "./rafale";
import { buildB2 } from "./b2";
import { buildMig29 } from "./mig29";
import { buildF22 } from "./f22";
import { buildF14 } from "./f14";
import { buildA10 } from "./a10";
import { buildF16 } from "./f16";
import { buildSr71 } from "./sr71";
import { buildB747 } from "./b747";

const REGISTRY: Record<string, AircraftBuilder> = {
  f18: buildF18,
  f35: buildF35,
  rafale: buildRafale,
  b2: buildB2,
  mig29: buildMig29,
  f22: buildF22,
  f14: buildF14,
  a10: buildA10,
  f16: buildF16,
  sr71: buildSr71,
  b747: buildB747,
};

export function createAircraft(id: string, envMap: THREE.Texture | null): AircraftInstance {
  const builder = REGISTRY[id];
  if (!builder) throw new Error(`No aircraft builder registered for id: ${id}`);
  const config = getAircraftConfig(id);
  return builder(config, envMap);
}

export const AVAILABLE_AIRCRAFT_IDS = Object.keys(REGISTRY);
