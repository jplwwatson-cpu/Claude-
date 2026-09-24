import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

// NOTE: placeholder silhouette pending a bespoke true flying-wing model
// (no separate tail/fuselage). Flight physics already uses the real B-2 config.
export const buildB2: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 21.0,
      noseRadius: 0.5,
      bodyRadius: 1.8,
      canopyBulge: 0.2,
      tailRadius: 0.3,
      wingSpan: 26.0,
      wingRootChord: 9.0,
      wingTipChord: 0.6,
      wingSweepDeg: 33,
      wingS: 0.5,
      dihedralDeg: -1,
      finCount: 0,
      finHeight: 0.01,
      finSweepDeg: 0,
      engineCount: 2,
      engineRadius: 0.6,
    },
    envMap,
  );
