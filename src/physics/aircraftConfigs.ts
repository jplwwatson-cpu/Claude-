// Per-aircraft physical/aerodynamic data. Units: SI (kg, m, m^2, N, rad).
// These are reasonable real-world-informed approximations, not classified specs.

export type AircraftCategory = "fighter" | "stealthBomber" | "attack" | "reconnaissance" | "airliner";

export interface AircraftConfig {
  id: string;
  displayName: string;
  category: AircraftCategory;

  // Mass
  emptyMass: number; // kg
  fuelMass: number; // kg, burned toward 40% over a long flight for feel (not modeled granularly)

  // Aerodynamics
  wingArea: number; // m^2
  aspectRatio: number; // wingspan^2 / wingArea, drives induced drag
  liftSlope: number; // dCL/dAlpha, per radian (~5.5-6.0 typical for swept wings)
  zeroLiftAoA: number; // rad, usually slightly negative (cambered wing)
  stallAoA: number; // rad, positive stall angle
  maxLiftCoefficient: number; // CLmax achieved near stall
  parasiticDrag: number; // CD0, baseline drag coefficient
  oswaldEfficiency: number; // 0.7-0.9 typical

  // Propulsion
  maxThrust: number; // N, total dry thrust, all engines
  afterburnerThrust: number; // N, total with afterburner (0 if none)
  hasAfterburner: boolean;

  // Control authority (rad/s at full deflection, scaled by dynamic pressure at runtime)
  maxRollRate: number;
  maxPitchRate: number;
  maxYawRate: number;

  // Limits
  maxG: number;
  minG: number; // negative G limit
  maxSpeed: number; // m/s, roughly Vmax at altitude, used for effects (vapor cone) thresholds

  // Special mechanics
  hasVTOL: boolean;
  hasVariableSweep: boolean;

  // Livery
  livery: "rcaf" | "usaf" | "usn" | "raf" | "french" | "generic-military" | "civilian";
}

export const AIRCRAFT_CONFIGS: Record<string, AircraftConfig> = {
  f18: {
    id: "f18",
    displayName: "F/A-18 Hornet (RCAF)",
    category: "fighter",
    emptyMass: 10800,
    fuelMass: 4900,
    wingArea: 37.2,
    aspectRatio: 3.5,
    liftSlope: 5.8,
    zeroLiftAoA: -0.02,
    stallAoA: 0.35,
    maxLiftCoefficient: 1.6,
    parasiticDrag: 0.022,
    oswaldEfficiency: 0.82,
    maxThrust: 2 * 49000,
    afterburnerThrust: 2 * 79000,
    hasAfterburner: true,
    maxRollRate: 5.5,
    maxPitchRate: 2.2,
    maxYawRate: 1.4,
    maxG: 7.5,
    minG: -3,
    maxSpeed: 590,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "rcaf",
  },
  f35: {
    id: "f35",
    displayName: "F-35 Lightning II (RCAF)",
    category: "fighter",
    emptyMass: 13300,
    fuelMass: 8300,
    wingArea: 42.7,
    aspectRatio: 2.7,
    liftSlope: 5.5,
    zeroLiftAoA: -0.015,
    stallAoA: 0.33,
    maxLiftCoefficient: 1.55,
    parasiticDrag: 0.02,
    oswaldEfficiency: 0.8,
    maxThrust: 125000,
    afterburnerThrust: 191000,
    hasAfterburner: true,
    maxRollRate: 5.0,
    maxPitchRate: 2.4,
    maxYawRate: 1.3,
    maxG: 9,
    minG: -3,
    maxSpeed: 560,
    hasVTOL: true,
    hasVariableSweep: false,
    livery: "rcaf",
  },
  rafale: {
    id: "rafale",
    displayName: "Dassault Rafale",
    category: "fighter",
    emptyMass: 10000,
    fuelMass: 4700,
    wingArea: 45.7,
    aspectRatio: 2.6,
    liftSlope: 5.9,
    zeroLiftAoA: -0.02,
    stallAoA: 0.4,
    maxLiftCoefficient: 1.7,
    parasiticDrag: 0.019,
    oswaldEfficiency: 0.83,
    maxThrust: 2 * 50000,
    afterburnerThrust: 2 * 75000,
    hasAfterburner: true,
    maxRollRate: 6.0,
    maxPitchRate: 2.6,
    maxYawRate: 1.5,
    maxG: 9,
    minG: -3.2,
    maxSpeed: 600,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "french",
  },
  b2: {
    id: "b2",
    displayName: "B-2 Spirit",
    category: "stealthBomber",
    emptyMass: 71700,
    fuelMass: 75000,
    wingArea: 478,
    aspectRatio: 5.9,
    liftSlope: 4.8,
    zeroLiftAoA: -0.01,
    stallAoA: 0.28,
    maxLiftCoefficient: 1.3,
    parasiticDrag: 0.014,
    oswaldEfficiency: 0.88,
    maxThrust: 4 * 77000,
    afterburnerThrust: 0,
    hasAfterburner: false,
    maxRollRate: 1.6,
    maxPitchRate: 0.9,
    maxYawRate: 0.5,
    maxG: 2.5,
    minG: -1,
    maxSpeed: 280,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "usaf",
  },
  mig29: {
    id: "mig29",
    displayName: "MiG-29 Fulcrum",
    category: "fighter",
    emptyMass: 11000,
    fuelMass: 3400,
    wingArea: 38,
    aspectRatio: 3.4,
    liftSlope: 5.7,
    zeroLiftAoA: -0.018,
    stallAoA: 0.38,
    maxLiftCoefficient: 1.65,
    parasiticDrag: 0.023,
    oswaldEfficiency: 0.79,
    maxThrust: 2 * 50000,
    afterburnerThrust: 2 * 81000,
    hasAfterburner: true,
    maxRollRate: 5.8,
    maxPitchRate: 2.5,
    maxYawRate: 1.4,
    maxG: 9,
    minG: -3,
    maxSpeed: 620,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "generic-military",
  },
  f22: {
    id: "f22",
    displayName: "F-22 Raptor",
    category: "fighter",
    emptyMass: 19700,
    fuelMass: 8200,
    wingArea: 78.0,
    aspectRatio: 2.4,
    liftSlope: 5.6,
    zeroLiftAoA: -0.015,
    stallAoA: 0.42,
    maxLiftCoefficient: 1.6,
    parasiticDrag: 0.018,
    oswaldEfficiency: 0.85,
    maxThrust: 2 * 104000,
    afterburnerThrust: 2 * 156000,
    hasAfterburner: true,
    maxRollRate: 6.5,
    maxPitchRate: 2.8,
    maxYawRate: 1.6,
    maxG: 9.5,
    minG: -3.5,
    maxSpeed: 650,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "usaf",
  },
  f14: {
    id: "f14",
    displayName: "F-14 Tomcat",
    category: "fighter",
    emptyMass: 19800,
    fuelMass: 7300,
    wingArea: 52.5, // at 20deg sweep; adjusted dynamically by sweep angle
    aspectRatio: 7.3, // at min sweep; adjusted dynamically
    liftSlope: 5.4,
    zeroLiftAoA: -0.015,
    stallAoA: 0.36,
    maxLiftCoefficient: 1.5,
    parasiticDrag: 0.021,
    oswaldEfficiency: 0.8,
    maxThrust: 2 * 55000,
    afterburnerThrust: 2 * 93000,
    hasAfterburner: true,
    maxRollRate: 4.5,
    maxPitchRate: 2.0,
    maxYawRate: 1.2,
    maxG: 7.5,
    minG: -2.5,
    maxSpeed: 610,
    hasVTOL: false,
    hasVariableSweep: true,
    livery: "usn",
  },
  a10: {
    id: "a10",
    displayName: "A-10 Thunderbolt II",
    category: "attack",
    emptyMass: 11300,
    fuelMass: 4900,
    wingArea: 47,
    aspectRatio: 6.5,
    liftSlope: 5.9,
    zeroLiftAoA: -0.025,
    stallAoA: 0.3,
    maxLiftCoefficient: 1.9,
    parasiticDrag: 0.028,
    oswaldEfficiency: 0.85,
    maxThrust: 2 * 40000,
    afterburnerThrust: 0,
    hasAfterburner: false,
    maxRollRate: 3.2,
    maxPitchRate: 1.6,
    maxYawRate: 1.0,
    maxG: 6,
    minG: -3,
    maxSpeed: 210,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "usaf",
  },
  f16: {
    id: "f16",
    displayName: "F-16 Fighting Falcon",
    category: "fighter",
    emptyMass: 8570,
    fuelMass: 3200,
    wingArea: 27.9,
    aspectRatio: 3.2,
    liftSlope: 6.0,
    zeroLiftAoA: -0.02,
    stallAoA: 0.45,
    maxLiftCoefficient: 1.7,
    parasiticDrag: 0.02,
    oswaldEfficiency: 0.83,
    maxThrust: 79000,
    afterburnerThrust: 129000,
    hasAfterburner: true,
    maxRollRate: 7.0,
    maxPitchRate: 3.0,
    maxYawRate: 1.6,
    maxG: 9,
    minG: -3,
    maxSpeed: 620,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "usaf",
  },
  sr71: {
    id: "sr71",
    displayName: "SR-71 Blackbird",
    category: "reconnaissance",
    emptyMass: 30600,
    fuelMass: 46000,
    wingArea: 167,
    aspectRatio: 1.7,
    liftSlope: 4.2,
    zeroLiftAoA: -0.01,
    stallAoA: 0.3,
    maxLiftCoefficient: 1.1,
    parasiticDrag: 0.024,
    oswaldEfficiency: 0.75,
    maxThrust: 2 * 68000,
    afterburnerThrust: 2 * 145000,
    hasAfterburner: true,
    maxRollRate: 3.0,
    maxPitchRate: 1.4,
    maxYawRate: 0.7,
    maxG: 3.2,
    minG: -1,
    maxSpeed: 980, // ~Mach 3.3 at altitude
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "usaf",
  },
  b747: {
    id: "b747",
    displayName: "Boeing 747-400",
    category: "airliner",
    emptyMass: 183500,
    fuelMass: 150000,
    wingArea: 511,
    aspectRatio: 7.0,
    liftSlope: 5.0,
    zeroLiftAoA: -0.03,
    stallAoA: 0.25,
    maxLiftCoefficient: 2.2, // with flaps idealized
    parasiticDrag: 0.018,
    oswaldEfficiency: 0.85,
    maxThrust: 4 * 252000,
    afterburnerThrust: 0,
    hasAfterburner: false,
    maxRollRate: 0.5,
    maxPitchRate: 0.35,
    maxYawRate: 0.25,
    maxG: 2.5,
    minG: -1,
    maxSpeed: 260,
    hasVTOL: false,
    hasVariableSweep: false,
    livery: "civilian",
  },
};

export function getAircraftConfig(id: string): AircraftConfig {
  const cfg = AIRCRAFT_CONFIGS[id];
  if (!cfg) throw new Error(`Unknown aircraft id: ${id}`);
  return cfg;
}

export const AIRCRAFT_IDS = Object.keys(AIRCRAFT_CONFIGS);
