import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

export const buildMig29: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 17.3,
      noseRadius: 0.3,
      bodyRadius: 1.15,
      canopyBulge: 0.26,
      tailRadius: 0.6,
      wingSpan: 5.7,
      wingRootChord: 5.0,
      wingTipChord: 1.1,
      wingSweepDeg: 40,
      wingS: 0.5,
      dihedralDeg: -2,
      finCount: 2,
      finHeight: 2.7,
      finSweepDeg: 45,
      engineCount: 2,
      engineRadius: 0.52,
    },
    envMap,
  );
