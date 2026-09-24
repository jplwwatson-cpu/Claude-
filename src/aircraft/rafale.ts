import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildRafale: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 15.3,
      noseRadius: 0.28,
      bodyRadius: 0.95,
      canopyBulge: 0.28,
      tailRadius: 0.5,
      wingSpan: 5.6,
      wingRootChord: 5.4,
      wingTipChord: 1.0,
      wingSweepDeg: 42,
      wingS: 0.5,
      dihedralDeg: 1,
      finCount: 1,
      finHeight: 2.6,
      finSweepDeg: 40,
      engineCount: 2,
      engineRadius: 0.46,
      hasCanards: true,
    },
    envMap,
  );
