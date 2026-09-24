import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

// NOTE: placeholder silhouette pending a bespoke blended-body/chine model.
// Flight physics already uses the real SR-71 config (Mach 3-class thrust/drag).
export const buildSr71: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 32.7,
      noseRadius: 0.25,
      bodyRadius: 1.3,
      canopyBulge: 0.2,
      tailRadius: 0.4,
      wingSpan: 5.6,
      wingRootChord: 12.0,
      wingTipChord: 1.2,
      wingSweepDeg: 55,
      wingS: 0.45,
      dihedralDeg: -2,
      finCount: 2,
      finHeight: 2.2,
      finSweepDeg: 50,
      engineCount: 2,
      engineRadius: 0.85,
    },
    envMap,
  );
