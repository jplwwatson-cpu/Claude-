import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildF22: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 18.9,
      noseRadius: 0.3,
      bodyRadius: 1.2,
      canopyBulge: 0.3,
      tailRadius: 0.6,
      wingSpan: 5.5,
      wingRootChord: 6.4,
      wingTipChord: 1.4,
      wingSweepDeg: 42,
      wingS: 0.5,
      dihedralDeg: 0,
      finCount: 2,
      finHeight: 2.8,
      finSweepDeg: 42,
      engineCount: 2,
      engineRadius: 0.62,
    },
    envMap,
  );
