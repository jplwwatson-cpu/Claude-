import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildF16: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 15.0,
      noseRadius: 0.26,
      bodyRadius: 0.78,
      canopyBulge: 0.3,
      tailRadius: 0.5,
      wingSpan: 5.0,
      wingRootChord: 4.6,
      wingTipChord: 0.9,
      wingSweepDeg: 40,
      wingS: 0.55,
      dihedralDeg: 0,
      finCount: 1,
      finHeight: 2.9,
      finSweepDeg: 48,
      engineCount: 1,
      engineRadius: 0.62,
    },
    envMap,
  );
