import * as THREE from "three";

/**
 * Builds a fuselage-like solid of revolution from a radius profile.
 * `z` in each point is used directly as the local Z coordinate — callers are
 * responsible for putting the nose at negative Z (forward) and the tail at
 * positive Z (aft), matching the aircraft's local -Z-forward convention.
 */
export function buildFuselage(
  points: Array<[z: number, radius: number]>,
  radialSegments = 16,
): THREE.BufferGeometry {
  const lathePoints = points.map(([z, r]) => new THREE.Vector2(Math.max(0.001, r), z));
  const geo = new THREE.LatheGeometry(lathePoints, radialSegments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * A tapered swept wing panel extruded from root chord to tip.
 * Local Z follows the aircraft convention (positive Z = aft/tail), so a
 * positive sweepAngle shifts the tip toward +Z (a normal backward sweep).
 */
export function buildWingPanel(opts: {
  rootChord: number;
  tipChord: number;
  span: number;
  sweepAngle: number; // rad, leading-edge sweep
  dihedral: number; // rad
  thickness: number;
  side: 1 | -1; // 1 = right wing (+X), -1 = left wing
}): THREE.BufferGeometry {
  const { rootChord, tipChord, span, sweepAngle, dihedral, thickness, side } = opts;
  const sweepOffset = span * Math.tan(sweepAngle);

  // Quad-based wing solid: root LE/TE and tip LE/TE, tip shifted aft by sweep and up by dihedral.
  const geo = new THREE.BufferGeometry();
  const rootLE = new THREE.Vector3(0, 0, -rootChord * 0.5);
  const rootTE = new THREE.Vector3(0, 0, rootChord * 0.5);
  const tipZOffset = sweepOffset;
  const tipLE = new THREE.Vector3(span, span * Math.tan(dihedral), tipZOffset - tipChord * 0.5);
  const tipTE = new THREE.Vector3(span, span * Math.tan(dihedral), tipZOffset + tipChord * 0.5);

  const top: THREE.Vector3[] = [rootLE, rootTE, tipTE, tipLE];
  const positions: number[] = [];
  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const thickOffset = new THREE.Vector3(0, thickness * 0.5, 0);
  const topPts = top.map((p) => p.clone().add(thickOffset));
  const botPts = top.map((p) => p.clone().sub(thickOffset));

  pushTri(topPts[0], topPts[1], topPts[2]);
  pushTri(topPts[0], topPts[2], topPts[3]);
  pushTri(botPts[2], botPts[1], botPts[0]);
  pushTri(botPts[3], botPts[2], botPts[0]);
  pushTri(topPts[1], botPts[1], botPts[2]);
  pushTri(topPts[1], botPts[2], topPts[2]);
  pushTri(topPts[3], topPts[2], botPts[2]);
  pushTri(topPts[3], botPts[2], botPts[3]);
  pushTri(topPts[0], topPts[3], botPts[3]);
  pushTri(topPts[0], botPts[3], botPts[0]);
  pushTri(topPts[1], topPts[0], botPts[0]);
  pushTri(topPts[1], botPts[0], botPts[1]);

  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  if (side === -1) geo.scale(-1, 1, 1);
  return geo;
}

export function buildCylinderZ(radiusStart: number, radiusEnd: number, length: number, segments = 12): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusEnd, radiusStart, length, segments, 1, false);
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function makeMesh(geo: THREE.BufferGeometry, material: THREE.Material, castShadow = true): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}
