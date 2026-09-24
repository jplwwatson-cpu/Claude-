import * as THREE from "three";
import type { AircraftConfig } from "../../physics/aircraftConfigs";
import { buildFuselage, buildWingPanel, buildCylinderZ, makeMesh } from "./geometryHelpers";
import {
  createFuselageMaterial,
  createCanopyMaterial,
  createEngineMetalMaterial,
  createGlassMaterial,
} from "./pbrMaterials";
import { createLivery, attachDecal } from "./liveries";
import {
  emptyAnimatedParts,
  buildGearLeg,
  buildControlSurface,
  buildAfterburnerNozzle,
  buildWingSweepPivot,
  buildVtolNozzlePivot,
  type AnimatedParts,
} from "./animatedParts";
import type { AircraftInstance } from "./aircraftTypes";

export interface FighterShapeParams {
  fuselageLength: number;
  noseRadius: number;
  bodyRadius: number;
  canopyBulge: number;
  tailRadius: number;
  wingSpan: number;
  wingRootChord: number;
  wingTipChord: number;
  wingSweepDeg: number;
  wingS: number; // 0..1, position of wing root as a fraction of fuselage length from the nose
  dihedralDeg: number;
  finCount: 0 | 1 | 2;
  finHeight: number;
  finSweepDeg: number;
  engineCount: 1 | 2;
  engineRadius: number;
  hasCanards?: boolean;
  /** F-14-style variable-sweep wings: root panel pivots about a hinge instead of being fixed. */
  sweepable?: boolean;
  /** F-35-style STOVL: engine nozzle pivots from aft-facing to down-facing. */
  vtolCapable?: boolean;
}

const CG_FRACTION = 0.42; // origin sits 42% of fuselage length back from the nose

export function buildGenericFighter(
  config: AircraftConfig,
  params: FighterShapeParams,
  envMap: THREE.Texture | null,
): AircraftInstance {
  const group = new THREE.Group();
  const parts: AnimatedParts = emptyAnimatedParts();
  const livery = createLivery(config);
  const isStealth = config.category === "stealthBomber";

  const L = params.fuselageLength;
  const noseOffset = L * CG_FRACTION;
  /** Converts "distance from nose" (0..L) to local Z (negative = forward/nose, positive = aft/tail). */
  const z = (s: number) => s - noseOffset;

  const fuselageMat = createFuselageMaterial({
    color: livery.baseColor,
    map: livery.camoMap ?? undefined,
    envMap,
    metalness: isStealth ? 0.3 : 0.75,
    roughness: isStealth ? 0.7 : 0.4,
  });

  const profile: Array<[number, number]> = [
    [z(0), 0.05],
    [z(L * 0.05), params.noseRadius * 0.5],
    [z(L * 0.14), params.noseRadius],
    [z(L * 0.3), params.bodyRadius * 0.72 + params.canopyBulge * 0.3],
    [z(L * 0.42), params.bodyRadius],
    [z(L * 0.68), params.bodyRadius * 0.96],
    [z(L * 0.85), params.bodyRadius * 0.7],
    [z(L * 0.96), params.tailRadius],
    [z(L), params.tailRadius * 0.7],
  ];
  const fuselage = makeMesh(buildFuselage(profile, 18), fuselageMat);
  group.add(fuselage);

  // Canopy — sits over the forward-mid fuselage.
  const canopyGeo = new THREE.SphereGeometry(params.bodyRadius * 0.62, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const canopy = makeMesh(canopyGeo, createCanopyMaterial(envMap));
  canopy.scale.set(0.85, 0.9, 2.1);
  canopy.position.set(0, params.bodyRadius * 0.55, z(L * 0.22));
  group.add(canopy);

  // Wings (right + left mirrored). Sweepable wings mount the panel + control
  // surfaces on a yaw pivot at the root hinge; landing gear stays fuselage-fixed.
  const wingZ = z(L * params.wingS);
  const wingRootX = params.bodyRadius * 0.85;
  for (const side of [1, -1] as const) {
    const wingGeo = buildWingPanel({
      rootChord: params.wingRootChord,
      tipChord: params.wingTipChord,
      span: params.wingSpan,
      sweepAngle: THREE.MathUtils.degToRad(params.sweepable ? 12 : params.wingSweepDeg),
      dihedral: THREE.MathUtils.degToRad(params.dihedralDeg),
      thickness: 0.22,
      side,
    });
    const wing = makeMesh(wingGeo, fuselageMat);

    const aileron = buildControlSurface({
      width: params.wingSpan * 0.32,
      chord: params.wingTipChord * 0.5,
      thickness: 0.06,
      material: fuselageMat,
      axis: "x",
      kind: "aileron",
      sign: side,
      deployedAngle: THREE.MathUtils.degToRad(18),
    });

    const flap = buildControlSurface({
      width: params.wingSpan * 0.34,
      chord: params.wingRootChord * 0.32,
      thickness: 0.06,
      material: fuselageMat,
      axis: "x",
      kind: "flap",
    });

    if (params.sweepable) {
      const sweepPivot = buildWingSweepPivot(12, 62);
      sweepPivot.pivot.position.set(side * wingRootX, 0, wingZ);
      wing.position.set(0, 0, 0);
      aileron.pivot.position.set(side * params.wingSpan * 0.72, 0, params.wingRootChord * 0.32);
      flap.pivot.position.set(side * params.bodyRadius * 0.2, 0, params.wingRootChord * 0.28);
      sweepPivot.pivot.add(wing, aileron.pivot, flap.pivot);
      group.add(sweepPivot.pivot);
      parts.wingSweeps.push(sweepPivot);
    } else {
      wing.position.set(side * wingRootX, 0, wingZ);
      aileron.pivot.position.set(side * (wingRootX + params.wingSpan * 0.72), 0, wingZ + params.wingRootChord * 0.32);
      flap.pivot.position.set(side * (params.bodyRadius * 1.05), 0, wingZ + params.wingRootChord * 0.28);
      group.add(wing, aileron.pivot, flap.pivot);
    }
    parts.surfaces.push(aileron, flap);

    // Landing gear under wing root — fixed to the fuselage regardless of sweep.
    const gear = buildGearLeg({ strutLength: params.bodyRadius * 2.1, wheelRadius: params.bodyRadius * 0.32 });
    gear.pivot.position.set(side * params.bodyRadius * 1.1, -params.bodyRadius * 0.3, wingZ - params.wingRootChord * 0.05);
    group.add(gear.pivot);
    parts.gearLegs.push(gear);
  }

  // Nose gear
  const noseGear = buildGearLeg({ strutLength: params.bodyRadius * 1.6, wheelRadius: params.bodyRadius * 0.22 });
  noseGear.pivot.position.set(0, -params.noseRadius * 0.4, z(L * 0.12));
  group.add(noseGear.pivot);
  parts.gearLegs.push(noseGear);

  // Vertical fin(s)
  const finZ = z(L * 0.82);
  for (let i = 0; i < params.finCount; i++) {
    const finX = params.finCount === 2 ? (i === 0 ? 1 : -1) * params.bodyRadius * 0.7 : 0;
    const finGeo = buildWingPanel({
      rootChord: params.wingRootChord * 0.55,
      tipChord: params.wingRootChord * 0.22,
      span: params.finHeight,
      sweepAngle: THREE.MathUtils.degToRad(params.finSweepDeg),
      dihedral: 0,
      thickness: 0.16,
      side: 1,
    });
    finGeo.rotateZ(Math.PI / 2);
    const fin = makeMesh(finGeo, fuselageMat);
    fin.position.set(finX, params.bodyRadius * 0.3, finZ);
    group.add(fin);
  }

  // Horizontal stabilizers
  const stabZ = z(L * 0.86);
  for (const side of [1, -1] as const) {
    const stabGeo = buildWingPanel({
      rootChord: params.wingRootChord * 0.4,
      tipChord: params.wingRootChord * 0.18,
      span: params.wingSpan * 0.4,
      sweepAngle: THREE.MathUtils.degToRad(params.wingSweepDeg + 8),
      dihedral: 0,
      thickness: 0.14,
      side,
    });
    const stab = makeMesh(stabGeo, fuselageMat);
    stab.position.set(side * params.bodyRadius * 0.4, 0, stabZ);
    group.add(stab);
  }

  if (params.hasCanards) {
    const canardZ = z(L * 0.28);
    for (const side of [1, -1] as const) {
      const canardGeo = buildWingPanel({
        rootChord: params.wingRootChord * 0.3,
        tipChord: params.wingRootChord * 0.12,
        span: params.wingSpan * 0.2,
        sweepAngle: THREE.MathUtils.degToRad(35),
        dihedral: 0,
        thickness: 0.1,
        side,
      });
      const canard = makeMesh(canardGeo, fuselageMat);
      canard.position.set(side * params.bodyRadius * 0.6, params.bodyRadius * 0.1, canardZ);
      group.add(canard);
    }
  }

  // Engine nacelle(s) + afterburner nozzle(s) — at the tail. VTOL-capable
  // aircraft mount the nozzle + flame on a pivot that rotates toward vertical.
  const engineMat = createEngineMetalMaterial(envMap);
  const engineZ = z(L * 0.97);
  for (let i = 0; i < params.engineCount; i++) {
    const ex = params.engineCount === 2 ? (i === 0 ? 1 : -1) * params.bodyRadius * 0.5 : 0;
    const nozzleGeo = buildCylinderZ(params.engineRadius, params.engineRadius * 0.82, params.engineRadius * 2.4, 14);
    const nozzle = makeMesh(nozzleGeo, engineMat);

    const ab = buildAfterburnerNozzle(params.engineRadius * 0.75);

    if (params.vtolCapable) {
      const vtolPivot = buildVtolNozzlePivot();
      vtolPivot.pivot.position.set(ex, 0, engineZ);
      nozzle.position.set(0, 0, 0);
      ab.flame.position.set(0, 0, params.engineRadius * 1.8);
      ab.glowLight.position.set(0, 0, params.engineRadius * 2.4);
      vtolPivot.pivot.add(nozzle, ab.flame, ab.glowLight);
      group.add(vtolPivot.pivot);
      parts.vtolNozzles.push(vtolPivot);
    } else {
      nozzle.position.set(ex, 0, engineZ);
      ab.flame.position.set(ex, 0, engineZ + params.engineRadius * 1.8);
      ab.glowLight.position.set(ex, 0, engineZ + params.engineRadius * 2.4);
      group.add(nozzle, ab.flame, ab.glowLight);
    }
    parts.afterburners.push(ab);
  }

  // Cockpit glass strip / HUD frame accent (small detail)
  const rail = makeMesh(new THREE.BoxGeometry(params.bodyRadius * 0.9, 0.03, L * 0.16), createGlassMaterial());
  rail.position.set(0, params.bodyRadius * 0.68, z(L * 0.22));
  group.add(rail);

  // Livery decals
  const roundelSize = params.bodyRadius * 1.6;
  const roundelZ = z(L * 0.5);
  attachDecal(group, livery.roundel, new THREE.Vector3(params.bodyRadius * 0.98, params.bodyRadius * 0.1, roundelZ), roundelSize, roundelSize, Math.PI / 2);
  attachDecal(group, livery.roundel, new THREE.Vector3(-params.bodyRadius * 0.98, params.bodyRadius * 0.1, roundelZ), roundelSize, roundelSize, -Math.PI / 2);
  attachDecal(group, livery.tailFlash, new THREE.Vector3(0.02, params.bodyRadius * 0.3 + params.finHeight * 0.45, finZ), params.finHeight * 0.7, params.finHeight * 0.95, Math.PI / 2);

  return {
    group,
    parts,
    cockpitOffset: new THREE.Vector3(0, params.bodyRadius * 0.62, z(L * 0.24)),
    config,
  };
}
