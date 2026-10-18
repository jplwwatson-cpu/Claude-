// "El Caballito" by Rafael Zamarripa, the boy riding a seahorse on the Puerto Vallarta Malecón.
// Modeled procedurally from reference photos: verdigris bronze, a deeply ribbed upright body,
// a spiral tail curling forward, the boy on its back waving with his sombrero hanging behind him,
// all on a round stone pedestal. It turns slowly on its own; visitors do not drag it.
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";

// Drop a real scan of the statue at this path (for example from Polycam or RealityScan) and it
// replaces the hand-built model below automatically.
const REAL_MODEL_URL = "models/caballito.glb";
const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

export function createScene(canvas, { reduceMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 1.45, 0);

  // Late-afternoon light over the bay.
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x26407f, 1.0));
  const sun = new THREE.DirectionalLight(0xffc49a, 2.4);
  sun.position.set(4, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 5, bottom: -2.5 });
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xa8c4ff, 1.3);
  rim.position.set(-5, 4, -4);
  scene.add(rim);

  // Verdigris patina; ridge peaks get a lighter, worn tone through vertex colors.
  const patina = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.55, roughness: 0.5 });
  const patinaSolid = new THREE.MeshStandardMaterial({ color: 0x3f8c79, metalness: 0.55, roughness: 0.5 });
  const patinaLight = new THREE.MeshStandardMaterial({ color: 0x5aa891, metalness: 0.5, roughness: 0.45 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a8378, metalness: 0, roughness: 0.95 });
  const deep = new THREE.Color(0x2f7766), worn = new THREE.Color(0x8fd0b8);

  const pivot = new THREE.Group();       // turns around the vertical axis
  const statue = new THREE.Group();      // the bronze, offset so it turns around its own center
  statue.position.x = 0.12;
  pivot.add(statue);
  scene.add(pivot);
  const add = (geo, mat, setup, parent = statue) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (setup) setup(m);
    parent.add(m);
    return m;
  };

  /* ---------- Seahorse body: a ribbed tube from the neck down to the spiral tail ---------- */
  // Centerline and half-thickness traced from the reference photo (seahorse faces +X, height ~3.6).
  const path = [
    [-0.09, 3.07, 0.24], [-0.18, 2.8, 0.27], [0.05, 2.38, 0.42], [0.17, 1.92, 0.48], [0.21, 1.46, 0.32],
    [0.16, 0.99, 0.22], [0.14, 0.53, 0.15], [0.18, 0.16, 0.12], [0.37, 0.01, 0.1], [0.69, 0.07, 0.09],
    [0.84, 0.37, 0.08], [0.74, 0.61, 0.07], [0.53, 0.61, 0.06], [0.45, 0.44, 0.05], [0.55, 0.33, 0.03],
  ];
  const curve = new THREE.CatmullRomCurve3(path.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "centripetal");
  const radii = path.map((p) => p[2]);
  const radiusAt = (t) => {
    const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f));
    const k = f - i, s = k * k * (3 - 2 * k);
    return radii[i] + (radii[i + 1] - radii[i]) * s;
  };

  const SEG = 420, RAD = 36, DEPTH = 0.72, PERIOD = 0.115;
  const verts = [], colors = [], idx = [];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), prev = new THREE.Vector3();
  let arc = 0;
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    curve.getPoint(t, P);
    if (i > 0) arc += P.distanceTo(prev);
    prev.copy(P);
    curve.getTangent(t, T);
    N.crossVectors(Z, T).normalize();            // in-plane normal; +X (belly) on the way down
    const ridge = Math.pow(Math.abs(Math.cos((Math.PI * arc) / PERIOD)), 3);
    const r = radiusAt(t);
    for (let j = 0; j <= RAD; j++) {
      const a = (j / RAD) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      const back = Math.max(0, -c);              // ribs stand out most along the back
      const rr = r * (0.9 + ridge * (0.1 + back * 0.16));
      verts.push(P.x + N.x * c * rr, P.y + N.y * c * rr, s * rr * DEPTH);
      const col = deep.clone().lerp(worn, ridge * 0.55 + back * 0.1);
      colors.push(col.r, col.g, col.b);
    }
  }
  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < RAD; j++) {
      const a = i * (RAD + 1) + j, b = a + RAD + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  body.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  body.setIndex(idx);
  body.computeVertexNormals();
  add(body, patina);
  add(new THREE.SphereGeometry(0.035, 12, 10), patinaLight, (m) => m.position.copy(curve.getPoint(1)));


  /* ---------- Head, crown and the long trumpet snout ---------- */
  add(new THREE.SphereGeometry(1, 36, 28), patinaSolid, (m) => { m.position.set(0.06, 3.28, 0); m.scale.set(0.27, 0.21, 0.17); m.rotation.z = 0.15; });
  add(new THREE.SphereGeometry(1, 24, 18), patinaSolid, (m) => { m.position.set(-0.08, 3.12, 0); m.scale.set(0.2, 0.17, 0.16); });
  add(new THREE.CylinderGeometry(0.055, 0.085, 0.36, 20), patinaSolid, (m) => { m.position.set(0.44, 3.19, 0); m.rotation.z = Math.PI / 2 + 0.12; });
  add(new THREE.CylinderGeometry(0.1, 0.06, 0.07, 20), patinaLight, (m) => { m.position.set(0.64, 3.16, 0); m.rotation.z = Math.PI / 2 + 0.12; });
  for (const z of [-0.13, 0.13]) {
    add(new THREE.TorusGeometry(0.05, 0.014, 8, 20), patinaLight, (m) => m.position.set(0.12, 3.33, z));
    add(new THREE.SphereGeometry(0.03, 12, 10), patinaSolid, (m) => m.position.set(0.12, 3.33, z));
  }
  [[-0.24, 3.47, 0.14, 0.4], [-0.13, 3.53, 0.17, 0.15], [-0.01, 3.5, 0.13, -0.1], [0.1, 3.44, 0.1, -0.35], [-0.32, 3.33, 0.12, 0.8]].forEach(([x, y, h, rz]) => {
    add(new THREE.ConeGeometry(0.035, h, 8), patinaLight, (m) => { m.position.set(x, y, 0); m.rotation.z = rz; });
  });

  /* ---------- The boy: on the seahorse's back, one arm waving, sombrero behind him ---------- */
  const skin = patinaSolid;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const limb = (a, b, r) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    return add(new THREE.CapsuleGeometry(r, Math.max(0.01, len - r * 2), 6, 14), skin, (m) => {
      m.position.copy(a).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
    });
  };
  const hip = V(-0.34, 2.06, 0.02), shoulder = V(-0.66, 2.5, 0.06);
  limb(hip, shoulder, 0.1);                                                    // torso, leaning out from the back
  add(new THREE.SphereGeometry(0.115, 24, 18), skin, (m) => m.position.set(-0.74, 2.68, 0.06));   // head
  add(new THREE.SphereGeometry(0.118, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.45), patinaLight, (m) => {
    m.position.set(-0.75, 2.7, 0.06); m.rotation.z = 0.5;                      // short hair
  });
  limb(V(-0.7, 2.52, 0.12), V(-0.95, 2.76, 0.16), 0.034);                      // waving arm, upper
  limb(V(-0.95, 2.76, 0.16), V(-1.12, 3.06, 0.16), 0.03);                      // waving arm, forearm
  add(new THREE.SphereGeometry(0.045, 14, 10), skin, (m) => { m.position.set(-1.14, 3.11, 0.16); m.scale.set(0.7, 1.2, 0.5); }); // open hand
  limb(V(-0.62, 2.48, -0.06), V(-0.4, 2.55, -0.2), 0.032);                     // other arm, holding on
  limb(V(-0.4, 2.55, -0.2), V(-0.2, 2.62, -0.18), 0.028);
  for (const s of [1, -1]) {
    const knee = V(-0.08, 1.7, 0.3 * s), foot = V(0.22, 1.12, 0.24 * s);
    limb(V(-0.32, 2.02, 0.08 * s), knee, 0.05);                               // thigh across the flank
    limb(knee, foot, 0.04);                                                   // shin down along the body
    add(new THREE.SphereGeometry(0.04, 12, 10), skin, (m) => { m.position.copy(foot).add(V(0.04, -0.02, 0)); m.scale.set(1.6, 0.7, 0.8); });
  }
  // Sombrero hanging on his back, between him and the seahorse.
  const hat = new THREE.Group();
  hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.018, 40), patinaSolid));
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 40), patinaLight);
  edge.rotation.x = Math.PI / 2;
  hat.add(edge);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 24), patinaSolid);
  crown.position.y = -0.07;
  hat.add(crown);
  hat.traverse((o) => { o.castShadow = true; });
  hat.position.set(-0.47, 2.38, -0.06);
  hat.rotation.set(Math.PI / 2 - 0.25, 0, -0.5);
  statue.add(hat);

  /* ---------- Round stone pedestal, as on the Malecón ---------- */
  const ped = new THREE.Group();
  add(new THREE.CylinderGeometry(0.6, 0.64, 0.75, 48), stone, (m) => { m.position.y = -0.4; }, ped);
  add(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 48), new THREE.MeshStandardMaterial({ color: 0x9c968b, roughness: 0.8 }), (m) => { m.position.y = -0.02; }, ped);
  ped.position.x = 0.3;
  statue.add(ped);

  // Sea around the base.
  const waterGeo = new THREE.RingGeometry(0.01, 8, 128, 24);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x2f9fa0, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.85 }));
  water.receiveShadow = true;
  water.position.y = -0.72;
  scene.add(water);
  const wp = waterGeo.attributes.position;
  const base = Float32Array.from(wp.array);

  // Swap in a real scan when one is present.
  new GLTFLoader().loadAsync(REAL_MODEL_URL).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.scale.setScalar(4.4 / box.getSize(new THREE.Vector3()).y);
    box.setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -0.78 - box.min.y, -c.z);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    statue.clear();
    statue.position.x = 0;
    statue.add(model);
  }).catch(() => { /* no scan yet: keep the hand-built model */ });

  /* ---------- Loop: a slow, steady turn ---------- */
  const clock = new THREE.Clock();
  let raf = 0;
  pivot.rotation.y = -0.5;                       // a three-quarter view to start
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = camera.aspect < 0.9 ? 10.5 : 8.6;
    camera.position.set(0, 2.0, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduceMotion) {
      pivot.rotation.y += dt * 0.45;
      for (let i = 0; i < wp.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        const d = Math.hypot(x, z);
        wp.setY(i, Math.sin(d * 2 - t * 1.4) * 0.05 + Math.sin(x * 0.8 + t * 0.6) * 0.03);
      }
      wp.needsUpdate = true;
      waterGeo.computeVertexNormals();
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() { if (!raf) { resize(); clock.getDelta(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}
