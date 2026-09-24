import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildA10: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 16.3,
      noseRadius: 0.4,
      bodyRadius: 1.0,
      canopyBulge: 0.32,
      tailRadius: 0.5,
      wingSpan: 8.5,
      wingRootChord: 3.2,
      wingTipChord: 1.6,
      wingSweepDeg: 5,
      wingS: 0.48,
      dihedralDeg: 4,
      finCount: 2,
      finHeight: 2.6,
      finSweepDeg: 25,
      engineCount: 2,
      engineRadius: 0.6,
    },
    envMap,
  );
