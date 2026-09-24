import * as THREE from "three";
import type { ControlInputs } from "../../physics/flightModel";
import type { FlightTelemetry } from "../../physics/flightModel";
import { createEngineMetalMaterial, createTireMaterial } from "./pbrMaterials";

export interface GearLeg {
  pivot: THREE.Group; // rotates from deployed (0) to retracted (retractAngle)
  retractAngle: number;
}

export interface ControlSurface {
  pivot: THREE.Group;
  axis: "x" | "z";
  deployedAngle: number; // radians at full deflection (flaps=1 or speedbrake open)
  kind: "flap" | "speedbrake" | "aileron";
  sign?: number; // for ailerons, +1 or -1 to differentiate left/right
}

export interface AfterburnerNozzle {
  flame: THREE.Mesh; // additive-blended cone, opacity driven by throttle/afterburner
  glowLight: THREE.PointLight;
}

export interface WingSweepPivot {
  pivot: THREE.Group; // rotates about Y to sweep wing back
  minAngle: number;
  maxAngle: number;
}

export interface VtolNozzlePivot {
  pivot: THREE.Group; // rotates about X from horizontal (0) to vertical (-PI/2)
}

export interface AnimatedParts {
  gearLegs: GearLeg[];
  surfaces: ControlSurface[];
  afterburners: AfterburnerNozzle[];
  wingSweeps: WingSweepPivot[];
  vtolNozzles: VtolNozzlePivot[];
  canopyPivot?: { pivot: THREE.Group; openAngle: number };
}

export function emptyAnimatedParts(): AnimatedParts {
  return { gearLegs: [], surfaces: [], afterburners: [], wingSweeps: [], vtolNozzles: [] };
}

export function buildGearLeg(opts: {
  strutLength: number;
  wheelRadius: number;
  retractAngle?: number;
}): GearLeg {
  const pivot = new THREE.Group();
  const strutMat = createEngineMetalMaterial();
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, opts.strutLength, 8), strutMat);
  strut.position.y = -opts.strutLength / 2;
  strut.castShadow = true;
  pivot.add(strut);

  const tireMat = createTireMaterial();
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(opts.wheelRadius, opts.wheelRadius, opts.wheelRadius * 0.6, 16),
    tireMat,
  );
  wheel.rotation.x = Math.PI / 2;
  wheel.position.y = -opts.strutLength;
  wheel.castShadow = true;
  pivot.add(wheel);

  return { pivot, retractAngle: opts.retractAngle ?? Math.PI * 0.55 };
}

export function buildControlSurface(opts: {
  width: number;
  chord: number;
  thickness: number;
  material: THREE.Material;
  axis?: "x" | "z";
  deployedAngle?: number;
  kind?: ControlSurface["kind"];
  sign?: number;
}): ControlSurface {
  const pivot = new THREE.Group();
  const geo = new THREE.BoxGeometry(opts.width, opts.thickness, opts.chord);
  const mesh = new THREE.Mesh(geo, opts.material);
  // Surface trails aft of its hinge line (positive local Z = aft), so rotating
  // the pivot about X deflects the trailing edge the way a real flap/aileron would.
  mesh.position.z = opts.chord / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pivot.add(mesh);
  return {
    pivot,
    axis: opts.axis ?? "x",
    deployedAngle: opts.deployedAngle ?? THREE.MathUtils.degToRad(28),
    kind: opts.kind ?? "flap",
    sign: opts.sign ?? 1,
  };
}

export function buildAfterburnerNozzle(radius: number): AfterburnerNozzle {
  const geo = new THREE.ConeGeometry(radius, radius * 3.6, 16, 1, true);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff8a33,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const flame = new THREE.Mesh(geo, mat);
  flame.rotation.x = Math.PI / 2;
  flame.position.z = radius * 1.8;
  const glowLight = new THREE.PointLight(0xff7a2a, 0, 40, 2);
  glowLight.position.z = radius * 2;
  return { flame, glowLight };
}

export function buildWingSweepPivot(minAngleDeg: number, maxAngleDeg: number): WingSweepPivot {
  return {
    pivot: new THREE.Group(),
    minAngle: THREE.MathUtils.degToRad(minAngleDeg),
    maxAngle: THREE.MathUtils.degToRad(maxAngleDeg),
  };
}

export function buildVtolNozzlePivot(): VtolNozzlePivot {
  return { pivot: new THREE.Group() };
}

const gearState = new WeakMap<AnimatedParts, number>();
const sweepState = new WeakMap<AnimatedParts, number>();
const vtolState = new WeakMap<AnimatedParts, number>();

export function updateAnimatedParts(
  parts: AnimatedParts,
  controls: ControlInputs,
  telemetry: FlightTelemetry,
  dt: number,
): void {
  const gearBlend = 1 - Math.exp(-dt * 1.6);
  const currentGear = gearState.get(parts) ?? (controls.gearDown ? 1 : 0);
  const targetGear = controls.gearDown ? 1 : 0;
  const nextGear = THREE.MathUtils.lerp(currentGear, targetGear, gearBlend);
  gearState.set(parts, nextGear);
  for (const leg of parts.gearLegs) {
    leg.pivot.rotation.x = THREE.MathUtils.lerp(leg.retractAngle, 0, nextGear);
    leg.pivot.visible = nextGear > 0.02;
  }

  for (const s of parts.surfaces) {
    let target = 0;
    if (s.kind === "flap") target = controls.flaps * s.deployedAngle;
    else if (s.kind === "speedbrake") target = controls.speedbrake ? s.deployedAngle : 0;
    else if (s.kind === "aileron") target = controls.roll * s.deployedAngle * (s.sign ?? 1);
    const blend = 1 - Math.exp(-dt * 8);
    if (s.axis === "x") s.pivot.rotation.x = THREE.MathUtils.lerp(s.pivot.rotation.x, target, blend);
    else s.pivot.rotation.z = THREE.MathUtils.lerp(s.pivot.rotation.z, target, blend);
  }

  const dryGlow = controls.throttle > 0.82 ? (controls.throttle - 0.82) / 0.18 : 0;
  const abGlow = controls.afterburner ? 1 : 0;
  const flameOpacity = Math.max(dryGlow * 0.5, abGlow);
  const flicker = 0.9 + Math.random() * 0.1;
  for (const ab of parts.afterburners) {
    const mat = ab.flame.material as THREE.MeshBasicMaterial;
    mat.opacity = flameOpacity * flicker;
    const scale = abGlow ? 1.5 + Math.random() * 0.4 : 0.9 + dryGlow * 0.3;
    ab.flame.scale.set(1, scale, 1);
    ab.glowLight.intensity = flameOpacity * (abGlow ? 6 : 2);
  }

  if (parts.wingSweeps.length > 0) {
    const currentSweep = sweepState.get(parts) ?? 0;
    const blend = 1 - Math.exp(-dt * 0.6);
    const nextSweep = THREE.MathUtils.lerp(currentSweep, controls.wingSweep, blend);
    sweepState.set(parts, nextSweep);
    for (const ws of parts.wingSweeps) {
      // Rotating the pivot's local +X (spanwise) axis toward local +Z (aft) sweeps the tip back;
      // that requires opposite-signed yaw on each side since they mirror across X.
      const sign = ws.pivot.position.x >= 0 ? -1 : 1;
      ws.pivot.rotation.y = sign * THREE.MathUtils.lerp(ws.minAngle, ws.maxAngle, nextSweep);
    }
  }

  if (parts.vtolNozzles.length > 0) {
    const current = vtolState.get(parts) ?? 0;
    const blend = 1 - Math.exp(-dt * 1.2);
    const next = THREE.MathUtils.lerp(current, controls.vtolNozzle, blend);
    vtolState.set(parts, next);
    for (const nz of parts.vtolNozzles) {
      // Rotates the nozzle's aft-pointing exhaust (local +Z) down toward local -Y for hover.
      nz.pivot.rotation.x = next * (Math.PI / 2);
    }
  }

}
