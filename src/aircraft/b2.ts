import * as THREE from "three";
import type { AircraftBuilder } from "./shared/aircraftTypes";
import { makeMesh } from "./shared/geometryHelpers";
import { createStealthMaterial, createCanopyMaterial, createEngineMetalMaterial } from "./shared/pbrMaterials";
import { createLivery, attachDecal } from "./shared/liveries";
import { emptyAnimatedParts, buildGearLeg, buildControlSurface, type AnimatedParts } from "./shared/animatedParts";

// True flying wing: no fuselage/tail meshes at all, the whole airframe is one
// lofted wing solid (THREE.Shape planform + ExtrudeGeometry for thickness).
const L = 21.0; // nose to centerline trailing point, matches the real B-2's length
const SPAN = 52.4;
const HALF_SPAN = SPAN / 2;
const CG_FRACTION = 0.3; // flying-wing CG sits near the broad center section's aerodynamic center
const MAX_THICKNESS = 2.6; // centerline height, tapers toward the tips

const noseOffset = L * CG_FRACTION;
/** Converts "distance from nose" (0..L) to local Z (negative = forward/nose, positive = aft/tail). */
const z = (s: number) => s - noseOffset;

/** 1 at the centerline, tapering toward ~0 at the wingtips for a thin, sharp outer wing. */
function thicknessTaper(x: number): number {
  const t = Math.min(1, Math.abs(x) / HALF_SPAN);
  return 1 - 0.9 * Math.pow(t, 1.4);
}

function topSurfaceY(x: number): number {
  return (MAX_THICKNESS / 2) * thicknessTaper(x);
}

function bottomSurfaceY(x: number): number {
  return -topSurfaceY(x);
}

/**
 * Shallow double-sawtooth planform: a single clean leading-edge sweep from the
 * nose apex to each wingtip, and a compound "W" trailing edge (the B-2's
 * signature) sweeping from the centerline tail point back out to the tips.
 */
function buildPlanformShape(): THREE.Shape {
  const leTip: [number, number] = [HALF_SPAN, 17.5];
  const leKink: [number, number] = [5.24, 2.8];
  const te: Array<[number, number]> = [
    [22.3, 15.0],
    [14.4, 11.0],
    [7.9, 17.0],
    [2.6, 13.5],
    [0, 21.0],
  ];

  const shape = new THREE.Shape();
  shape.moveTo(0, z(0));
  shape.lineTo(leKink[0], z(leKink[1]));
  shape.lineTo(leTip[0], z(leTip[1]));
  for (const [x, s] of te) shape.lineTo(x, z(s));
  for (const [x, s] of te.slice(0, -1).reverse()) shape.lineTo(-x, z(s));
  shape.lineTo(-leTip[0], z(leTip[1]));
  shape.lineTo(-leKink[0], z(leKink[1]));
  shape.closePath();
  return shape;
}

function buildWingSolid(): THREE.BufferGeometry {
  const shape = buildPlanformShape();
  // Shape (x=span, y=z(s)) extruded along its local Z (thickness), then rotated
  // so extrude-Z becomes world +Y (up) and shape-Y becomes world Z (aft) directly.
  const geo = new THREE.ExtrudeGeometry(shape, { depth: MAX_THICKNESS, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, MAX_THICKNESS / 2, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * thicknessTaper(pos.getX(i)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export const buildB2: AircraftBuilder = (config, envMap) => {
  const group = new THREE.Group();
  const parts: AnimatedParts = emptyAnimatedParts();
  const livery = createLivery(config);

  const skinMat = createStealthMaterial(0x15171a, envMap);
  skinMat.side = THREE.DoubleSide; // defensive: guards against any winding flip from the extrude/rotate/taper pipeline

  const wing = makeMesh(buildWingSolid(), skinMat);
  group.add(wing);

  // Raised central spine / canopy bump, just aft of the nose apex.
  const canopy = makeMesh(new THREE.SphereGeometry(1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), createCanopyMaterial(envMap));
  canopy.scale.set(0.85, 0.4, 1.7);
  canopy.position.set(0, topSurfaceY(0) + 0.25, z(3.2));
  group.add(canopy);

  // Low intake bumps on top, forward of the wing's broadest section.
  for (const side of [1, -1] as const) {
    const intake = makeMesh(new THREE.SphereGeometry(0.95, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), skinMat);
    intake.scale.set(1.0, 0.4, 1.35);
    intake.position.set(side * 2.3, topSurfaceY(2.3) + 0.18, z(4.8));
    group.add(intake);
  }

  // Flush exhaust slots on the trailing edge top surface (no round afterburner nozzles).
  const exhaustMat = createEngineMetalMaterial(envMap);
  for (const side of [1, -1] as const) {
    const exhaust = makeMesh(new THREE.BoxGeometry(1.9, 0.07, 3.2), exhaustMat);
    exhaust.position.set(side * 5.5, topSurfaceY(5.5) + 0.02, z(15.5));
    group.add(exhaust);
  }

  // Outboard elevons (aileron) and inboard elevons (flap) along the trailing edge.
  for (const side of [1, -1] as const) {
    const aileron = buildControlSurface({
      width: 7.2,
      chord: 3.0,
      thickness: 0.14,
      material: skinMat,
      axis: "x",
      kind: "aileron",
      sign: side,
      deployedAngle: THREE.MathUtils.degToRad(14),
    });
    aileron.pivot.position.set(side * 18.2, topSurfaceY(18.2) * 0.3, z(13.2));
    group.add(aileron.pivot);
    parts.surfaces.push(aileron);

    const flap = buildControlSurface({
      width: 4.8,
      chord: 2.6,
      thickness: 0.14,
      material: skinMat,
      axis: "x",
      kind: "flap",
    });
    flap.pivot.position.set(side * 5.0, topSurfaceY(5.0) * 0.3, z(16.0));
    group.add(flap.pivot);
    parts.surfaces.push(flap);
  }

  // Tricycle gear tucked under the centerbody.
  const noseGear = buildGearLeg({ strutLength: 1.6, wheelRadius: 0.32 });
  noseGear.pivot.position.set(0, bottomSurfaceY(0), z(4.0));
  group.add(noseGear.pivot);
  parts.gearLegs.push(noseGear);

  for (const side of [1, -1] as const) {
    const mainGear = buildGearLeg({ strutLength: 2.3, wheelRadius: 0.5 });
    mainGear.pivot.position.set(side * 4.0, bottomSurfaceY(4.0), z(9.5));
    group.add(mainGear.pivot);
    parts.gearLegs.push(mainGear);
  }

  // Small top-surface national insignia; the B-2 has no vertical fin for a tail flash.
  for (const side of [1, -1] as const) {
    attachDecal(
      group,
      livery.roundel,
      new THREE.Vector3(side * 9.0, topSurfaceY(9.0) + 0.02, z(12.0)),
      3.0,
      3.0,
      0,
      -Math.PI / 2,
    );
  }

  return {
    group,
    parts,
    cockpitOffset: new THREE.Vector3(0, topSurfaceY(0) + 0.55, z(2.5)),
    config,
  };
};
