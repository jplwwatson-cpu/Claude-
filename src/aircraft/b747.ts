import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

// NOTE: placeholder silhouette pending a bespoke widebody model with
// underwing-pylon engines and an upper deck. Flight physics already uses
// the real 747-400 config (mass, wing area, four-engine thrust).
export const buildB747: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 70.6,
      noseRadius: 1.2,
      bodyRadius: 3.2,
      canopyBulge: 0.1,
      tailRadius: 0.8,
      wingSpan: 32.0,
      wingRootChord: 14.0,
      wingTipChord: 3.5,
      wingSweepDeg: 37,
      wingS: 0.48,
      dihedralDeg: 6,
      finCount: 1,
      finHeight: 9.0,
      finSweepDeg: 40,
      engineCount: 2,
      engineRadius: 1.4,
    },
    envMap,
  );
