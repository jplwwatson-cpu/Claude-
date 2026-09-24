import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildF18: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 17.1,
      noseRadius: 0.32,
      bodyRadius: 1.05,
      canopyBulge: 0.3,
      tailRadius: 0.55,
      wingSpan: 5.4,
      wingRootChord: 4.6,
      wingTipChord: 1.3,
      wingSweepDeg: 20,
      wingS: 0.52,
      dihedralDeg: 3,
      finCount: 2,
      finHeight: 2.9,
      finSweepDeg: 38,
      engineCount: 2,
      engineRadius: 0.5,
    },
    envMap,
  );
