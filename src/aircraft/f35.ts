import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

// Single-engine airframe with a visible STOVL nozzle that rotates from
// aft-facing (wing-borne flight) to down-facing (hover), toggled with V.
export const buildF35: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 15.7,
      noseRadius: 0.3,
      bodyRadius: 1.1,
      canopyBulge: 0.32,
      tailRadius: 0.58,
      wingSpan: 5.1,
      wingRootChord: 5.6,
      wingTipChord: 1.3,
      wingSweepDeg: 33,
      wingS: 0.5,
      dihedralDeg: -1,
      finCount: 2,
      finHeight: 2.5,
      finSweepDeg: 38,
      engineCount: 1,
      engineRadius: 0.68,
      vtolCapable: true,
    },
    envMap,
  );
