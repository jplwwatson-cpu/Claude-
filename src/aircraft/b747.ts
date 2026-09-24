import * as THREE from "three";
import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildFuselage, buildWingPanel, buildCylinderZ, makeMesh } from "./shared/geometryHelpers";
import { createFuselageMaterial, createGlassMaterial } from "./shared/pbrMaterials";
import { createLivery, attachDecal } from "./shared/liveries";
import { emptyAnimatedParts, buildGearLeg, buildControlSurface, type AnimatedParts } from "./shared/animatedParts";

const L = 70.6; // real 747-400 length
const CG_FRACTION = 0.42;
const BODY_R = 3.25;
const HALF_SPAN = 32.2; // ~64.4m span with winglets

const noseOffset = L * CG_FRACTION;
/** Converts "distance from nose" (0..L) to local Z (negative = forward/nose, positive = aft/tail). */
const z = (s: number) => s - noseOffset;

/**
 * A single row of cabin windows down each side, baked into the fuselage's
 * albedo map (LatheGeometry UVs: u wraps the circumference, v runs nose-to-tail).
 */
function buildCabinWindowMap(baseColor: number): THREE.Texture {
  const w = 1024;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `#${baseColor.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1b2126";
  const rows = 64;
  const vStart = 0.13;
  const vEnd = 0.8;
  for (let i = 0; i < rows; i++) {
    const v = vStart + (i / (rows - 1)) * (vEnd - vStart);
    const y = v * h;
    for (const u of [0, 0.5, 1]) {
      ctx.fillRect(u * w - 6, y - 5, 12, 9);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export const buildB747: AircraftBuilder = (config, envMap) => {
  const group = new THREE.Group();
  const parts: AnimatedParts = emptyAnimatedParts();
  const livery = createLivery(config);

  const windowMap = buildCabinWindowMap(livery.baseColor);
  const skinMat = createFuselageMaterial({ color: 0xffffff, map: windowMap, envMap, metalness: 0.2, roughness: 0.4 });

  // Circular-section fuselage.
  const profile: Array<[number, number]> = [
    [z(0), 0.05],
    [z(L * 0.03), 1.1],
    [z(L * 0.07), 2.3],
    [z(L * 0.14), 3.0],
    [z(L * 0.2), BODY_R],
    [z(L * 0.75), BODY_R],
    [z(L * 0.85), BODY_R * 0.9],
    [z(L * 0.93), 1.8],
    [z(L * 0.98), 0.7],
    [z(L), 0.15],
  ];
  const fuselage = makeMesh(buildFuselage(profile, 22), skinMat);
  group.add(fuselage);

  // Upper-deck hump: a smaller lathe overlapping the top of the main tube.
  const humpProfile: Array<[number, number]> = [
    [z(L * 0.05), 0.05],
    [z(L * 0.08), 0.55],
    [z(L * 0.12), 1.05],
    [z(L * 0.16), 1.25],
    [z(L * 0.2), 1.1],
    [z(L * 0.24), 0.3],
    [z(L * 0.26), 0.05],
  ];
  const hump = makeMesh(buildFuselage(humpProfile, 14), skinMat);
  hump.position.y = BODY_R * 0.75;
  group.add(hump);

  // Cockpit windscreen strip on the nose, just below the hump.
  const windscreen = makeMesh(new THREE.BoxGeometry(2.4, 0.5, 2.6), createGlassMaterial(0x0c1418));
  windscreen.position.set(0, BODY_R * 0.35, z(L * 0.045));
  group.add(windscreen);

  // High-swept wing, low-mounted on the fuselage like the real low-wing 747.
  const wingRootX = BODY_R * 0.95;
  const wingSpanPanel = HALF_SPAN - wingRootX;
  const wingRootY = -BODY_R * 0.28;
  const wingRootChord = 12.5;
  const wingTipChord = 5.2;
  const sweepDeg = 40;
  const dihedralDeg = 6;
  const sweepRad = THREE.MathUtils.degToRad(sweepDeg);
  const dihedralRad = THREE.MathUtils.degToRad(dihedralDeg);
  const wingS = CG_FRACTION;
  const wingZ = z(L * wingS);

  /**
   * Wing surface's y, chord-center z, and local chord at a given absolute (unsigned)
   * X. Root-to-tip LE and TE are each straight lines in buildWingPanel, so their
   * midpoint (the chord center) sweeps linearly too, independent of chord taper.
   */
  function wingSurface(absX: number): { y: number; centerZ: number; chord: number } {
    const s = THREE.MathUtils.clamp(absX - wingRootX, 0, wingSpanPanel);
    const f = s / wingSpanPanel;
    return {
      y: wingRootY + s * Math.tan(dihedralRad),
      centerZ: wingZ + s * Math.tan(sweepRad),
      chord: THREE.MathUtils.lerp(wingRootChord, wingTipChord, f),
    };
  }

  const engineMat = createFuselageMaterial({ color: 0x3a3d42, envMap, metalness: 0.85, roughness: 0.3 });
  for (const side of [1, -1] as const) {
    const wingGeo = buildWingPanel({
      rootChord: wingRootChord,
      tipChord: wingTipChord,
      span: wingSpanPanel,
      sweepAngle: sweepRad,
      dihedral: dihedralRad,
      thickness: 0.45,
      side,
    });
    const wing = makeMesh(wingGeo, skinMat);
    wing.position.set(side * wingRootX, wingRootY, wingZ);
    group.add(wing);

    const aileron = buildControlSurface({
      width: wingSpanPanel * 0.28,
      chord: wingTipChord * 0.45,
      thickness: 0.1,
      material: skinMat,
      axis: "x",
      kind: "aileron",
      sign: side,
      deployedAngle: THREE.MathUtils.degToRad(12),
    });
    const aileronSurf = wingSurface(wingRootX + wingSpanPanel * 0.75);
    aileron.pivot.position.set(side * (wingRootX + wingSpanPanel * 0.75), aileronSurf.y, aileronSurf.centerZ + aileronSurf.chord * 0.4);
    group.add(aileron.pivot);
    parts.surfaces.push(aileron);

    const flap = buildControlSurface({
      width: wingSpanPanel * 0.4,
      chord: wingRootChord * 0.3,
      thickness: 0.1,
      material: skinMat,
      axis: "x",
      kind: "flap",
    });
    const flapSurf = wingSurface(wingRootX + wingSpanPanel * 0.25);
    flap.pivot.position.set(side * (wingRootX + wingSpanPanel * 0.25), flapSurf.y, flapSurf.centerZ + flapSurf.chord * 0.4);
    group.add(flap.pivot);
    parts.surfaces.push(flap);

    // Four engines, two per side, hung below the wing on pylons — never at the tail.
    for (const spanFrac of [0.34, 0.66]) {
      const absX = wingRootX + spanFrac * wingSpanPanel;
      const surf = wingSurface(absX);
      const leadingEdgeZ = surf.centerZ - surf.chord * 0.5;
      const nacelleR = THREE.MathUtils.lerp(1.25, 1.05, spanFrac);
      const nacelleLen = 5.6;
      const nacelleZ = leadingEdgeZ - nacelleLen * 0.35; // inlet projects ahead of the wing LE
      const pylonDrop = 1.6;
      const nacelleY = surf.y - pylonDrop - nacelleR;

      const nacelle = makeMesh(buildCylinderZ(nacelleR, nacelleR * 0.85, nacelleLen, 16), engineMat);
      nacelle.position.set(side * absX, nacelleY, nacelleZ);
      group.add(nacelle);

      const pylonHeight = surf.y - (nacelleY + nacelleR);
      const pylon = makeMesh(new THREE.BoxGeometry(0.5, Math.max(0.3, pylonHeight), 2.2), skinMat);
      pylon.position.set(side * absX, surf.y - pylonHeight / 2, nacelleZ + nacelleLen * 0.3);
      group.add(pylon);
    }
  }

  // Single large swept vertical fin.
  const finZ = z(L * 0.9);
  const finGeo = buildWingPanel({
    rootChord: 9.2,
    tipChord: 3.4,
    span: 11.5,
    sweepAngle: THREE.MathUtils.degToRad(45),
    dihedral: 0,
    thickness: 0.5,
    side: 1,
  });
  finGeo.rotateZ(Math.PI / 2);
  const fin = makeMesh(finGeo, skinMat);
  fin.position.set(0, 2.0, finZ);
  group.add(fin);

  // Low-mounted swept horizontal stabilizers.
  const stabZ = z(L * 0.87);
  for (const side of [1, -1] as const) {
    const stabGeo = buildWingPanel({
      rootChord: 7.0,
      tipChord: 2.5,
      span: 10.5,
      sweepAngle: THREE.MathUtils.degToRad(38),
      dihedral: 0,
      thickness: 0.28,
      side,
    });
    const stab = makeMesh(stabGeo, skinMat);
    stab.position.set(side * BODY_R * 0.3, 0.6, stabZ);
    group.add(stab);
  }

  // Nose gear + two main gear legs (real aircraft has four main legs; simplified to two).
  const noseGear = buildGearLeg({ strutLength: 3.3, wheelRadius: 0.55 });
  noseGear.pivot.position.set(0, -1.0, z(L * 0.12));
  group.add(noseGear.pivot);
  parts.gearLegs.push(noseGear);

  for (const side of [1, -1] as const) {
    const mainGear = buildGearLeg({ strutLength: 4.3, wheelRadius: 0.65 });
    mainGear.pivot.position.set(side * wingRootX * 0.85, -BODY_R * 0.85, wingZ + 2.5);
    group.add(mainGear.pivot);
    parts.gearLegs.push(mainGear);
  }

  // Livery: fuselage-side logo roundels forward, tail flash on the fin.
  for (const side of [1, -1] as const) {
    attachDecal(group, livery.roundel, new THREE.Vector3(side * BODY_R * 0.98, 0.6, z(L * 0.18)), 3.6, 3.6, side * Math.PI / 2);
  }
  attachDecal(group, livery.tailFlash, new THREE.Vector3(0.03, 2.0 + 11.5 * 0.42, finZ), 6.5, 8.5, Math.PI / 2);

  return {
    group,
    parts,
    cockpitOffset: new THREE.Vector3(0, BODY_R * 0.55, z(L * 0.05)),
    config,
  };
};
