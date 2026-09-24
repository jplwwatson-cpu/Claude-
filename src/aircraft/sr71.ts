import * as THREE from "three";
import type { AircraftBuilder } from "./shared/aircraftTypes";
import { buildFuselage, buildWingPanel, buildCylinderZ, makeMesh } from "./shared/geometryHelpers";
import { createFuselageMaterial, createCanopyMaterial, createEngineMetalMaterial } from "./shared/pbrMaterials";
import { createLivery, attachDecal } from "./shared/liveries";
import {
  emptyAnimatedParts,
  buildGearLeg,
  buildControlSurface,
  buildAfterburnerNozzle,
  type AnimatedParts,
} from "./shared/animatedParts";

const L = 32.7; // real SR-71 length
const CG_FRACTION = 0.44;
const BODY_R = 0.85;
const HALF_SPAN = 8.45; // sqrt(aspectRatio * wingArea) / 2, matches the real ~16.9m span

const noseOffset = L * CG_FRACTION;
/** Converts "distance from nose" (0..L) to local Z (negative = forward/nose, positive = aft/tail). */
const z = (s: number) => s - noseOffset;

/** Flat, teardrop-shaped chine hugging one side of the fuselage; mirrored for the other side. */
function buildChineGeometry(): THREE.BufferGeometry {
  const pts: Array<[number, number]> = [
    [BODY_R * 0.85, 2.3],
    [BODY_R * 2.35, 6.5],
    [BODY_R * 3.6, 13.7],
    [BODY_R * 2.55, 19.0],
    [BODY_R * 0.8, 21.6],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], z(pts[0][1]));
  for (const [x, s] of pts.slice(1)) shape.lineTo(x, z(s));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.06, 0);
  geo.computeVertexNormals();
  return geo;
}

export const buildSr71: AircraftBuilder = (config, envMap) => {
  const group = new THREE.Group();
  const parts: AnimatedParts = emptyAnimatedParts();
  const livery = createLivery(config);

  const skinMat = createFuselageMaterial({ color: 0x121316, map: undefined, envMap, metalness: 0.55, roughness: 0.35 });

  // Slender chined core body — long sharp nose, gentle taper to a narrow tailcone.
  const profile: Array<[number, number]> = [
    [z(0), 0.03],
    [z(L * 0.06), 0.18],
    [z(L * 0.14), 0.42],
    [z(L * 0.28), 0.68],
    [z(L * 0.46), BODY_R],
    [z(L * 0.66), BODY_R * 0.94],
    [z(L * 0.84), 0.55],
    [z(L * 0.95), 0.3],
    [z(L), 0.13],
  ];
  const fuselage = makeMesh(buildFuselage(profile, 16), skinMat);
  group.add(fuselage);

  // Chines: forward 2/3 of the body, blending into the wing root.
  const chineR = buildChineGeometry();
  const chineL = chineR.clone();
  chineL.scale(-1, 1, 1);
  group.add(makeMesh(chineR, skinMat), makeMesh(chineL, skinMat));

  // Minimal bubble canopy, well forward.
  const canopy = makeMesh(new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), createCanopyMaterial(envMap));
  canopy.scale.set(0.8, 0.85, 1.8);
  canopy.position.set(0, 0.5, z(L * 0.13));
  group.add(canopy);

  // Delta-ish wing further aft, blended from the chine trailing region.
  const wingRootX = BODY_R * 0.9;
  const wingSpanPanel = HALF_SPAN - wingRootX;
  const wingZ = z(L * 0.6);
  const wingRootChord = 14.0;
  const wingTipChord = 5.4;
  const sweepDeg = 58;
  for (const side of [1, -1] as const) {
    const wingGeo = buildWingPanel({
      rootChord: wingRootChord,
      tipChord: wingTipChord,
      span: wingSpanPanel,
      sweepAngle: THREE.MathUtils.degToRad(sweepDeg),
      dihedral: THREE.MathUtils.degToRad(-1),
      thickness: 0.2,
      side,
    });
    const wing = makeMesh(wingGeo, skinMat);
    wing.position.set(side * wingRootX, 0, wingZ);
    group.add(wing);

    const aileron = buildControlSurface({
      width: wingSpanPanel * 0.45,
      chord: wingTipChord * 0.5,
      thickness: 0.08,
      material: skinMat,
      axis: "x",
      kind: "aileron",
      sign: side,
      deployedAngle: THREE.MathUtils.degToRad(14),
    });
    aileron.pivot.position.set(side * (wingRootX + wingSpanPanel * 0.72), 0, wingZ + wingRootChord * 0.32);
    group.add(aileron.pivot);
    parts.surfaces.push(aileron);
  }

  // Engine nacelles at mid-span on the wing, with inlet spikes and exhaust nozzles.
  const engineMat = createEngineMetalMaterial(envMap);
  const nacelleR = 0.78;
  const nacelleLen = 7.2;
  const nacelleX = wingRootX + wingSpanPanel * 0.42;
  const nacelleZ = wingZ + wingSpanPanel * 0.42 * Math.tan(THREE.MathUtils.degToRad(sweepDeg)) * 0.35;
  for (const side of [1, -1] as const) {
    const nacelle = makeMesh(buildCylinderZ(nacelleR, nacelleR * 0.92, nacelleLen, 16), engineMat);
    nacelle.position.set(side * nacelleX, -0.1, nacelleZ);
    group.add(nacelle);

    const spikeGeo = new THREE.ConeGeometry(nacelleR * 0.38, 1.5, 12);
    spikeGeo.rotateX(-Math.PI / 2);
    const spike = makeMesh(spikeGeo, engineMat);
    spike.position.set(side * nacelleX, -0.1, nacelleZ - nacelleLen / 2 - 0.6);
    group.add(spike);

    const ab = buildAfterburnerNozzle(nacelleR * 0.85);
    ab.flame.position.set(side * nacelleX, -0.1, nacelleZ + nacelleLen / 2 + nacelleR * 1.8);
    ab.glowLight.position.set(side * nacelleX, -0.1, nacelleZ + nacelleLen / 2 + nacelleR * 2.4);
    group.add(ab.flame, ab.glowLight);
    parts.afterburners.push(ab);

    // Twin outward-canted fins mounted atop the nacelles.
    const finGeo = buildWingPanel({
      rootChord: 4.2,
      tipChord: 1.6,
      span: 3.0,
      sweepAngle: THREE.MathUtils.degToRad(42),
      dihedral: 0,
      thickness: 0.14,
      side: 1,
    });
    finGeo.rotateZ(Math.PI / 2);
    const fin = makeMesh(finGeo, skinMat);
    fin.position.set(side * nacelleX, nacelleR + 0.3, nacelleZ - 0.5);
    fin.rotation.z = -side * THREE.MathUtils.degToRad(18);
    group.add(fin);

    if (side === 1) {
      attachDecal(
        group,
        livery.tailFlash,
        new THREE.Vector3(side * nacelleX + side * 0.08, nacelleR + 1.6, nacelleZ - 0.5),
        1.7,
        2.3,
        Math.PI / 2 - side * THREE.MathUtils.degToRad(18),
      );
    }
  }

  // Tricycle gear tucked under the fuselage/chine area.
  const noseGear = buildGearLeg({ strutLength: 1.2, wheelRadius: 0.26 });
  noseGear.pivot.position.set(0, -0.38, z(L * 0.13));
  group.add(noseGear.pivot);
  parts.gearLegs.push(noseGear);

  for (const side of [1, -1] as const) {
    const mainGear = buildGearLeg({ strutLength: 1.7, wheelRadius: 0.38 });
    mainGear.pivot.position.set(side * wingRootX * 1.1, -0.8, wingZ - 1.5);
    group.add(mainGear.pivot);
    parts.gearLegs.push(mainGear);
  }

  return {
    group,
    parts,
    cockpitOffset: new THREE.Vector3(0, 0.75, z(L * 0.13)),
    config,
  };
};
