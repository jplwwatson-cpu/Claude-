import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildGenericFighter } from "./shared/genericJetBuilder";

// Variable-sweep wings mounted on a hinge pivot (12deg cruise to 62deg swept),
// animated live in flight and toggled with N — the real Tomcat's signature feature.
export const buildF14: AircraftBuilder = (config, envMap) =>
  buildGenericFighter(
    config,
    {
      fuselageLength: 19.1,
      noseRadius: 0.28,
      bodyRadius: 1.25,
      canopyBulge: 0.3,
      tailRadius: 0.65,
      wingSpan: 5.5,
      wingRootChord: 6.8,
      wingTipChord: 1.5,
      wingSweepDeg: 25,
      wingS: 0.5,
      dihedralDeg: 2,
      finCount: 2,
      finHeight: 2.4,
      finSweepDeg: 35,
      engineCount: 2,
      engineRadius: 0.55,
      sweepable: true,
    },
    envMap,
  );
