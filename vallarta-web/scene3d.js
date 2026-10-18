// A stylized, procedurally modeled take on "El Caballito", the bronze boy riding a seahorse on the
// Puerto Vallarta Malecón. Built from primitives so the site ships no model files.
import * as THREE from "./vendor/three.module.min.js";
import { OrbitControls } from "./vendor/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "./vendor/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";

// Drop a real scan of the statue at this path (for example from Polycam or RealityScan) and it
// replaces the hand-built model below automatically.
const REAL_MODEL_URL = "models/caballito.glb";

const UP = new THREE.Vector3(0, 1, 0);

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

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(5.4, 3.1, 5.0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0.1, 1.75, 0);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 1.2;
  // Let vertical swipes keep scrolling the page on phones; horizontal drags rotate the statue.
  canvas.style.touchAction = "pan-y";

  // Sunset light over the bay.
  scene.add(new THREE.HemisphereLight(0xffe4cc, 0x1a3a9a, 0.9));
  const sun = new THREE.DirectionalLight(0xffb27a, 2.6);
  sun.position.set(5, 7, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -2;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9db9ff, 1.4);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const bronze = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, metalness: 0.9, roughness: 0.32 });
  const bronzeDark = new THREE.MeshStandardMaterial({ color: 0x7a5230, metalness: 0.88, roughness: 0.38 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x6d7079, metalness: 0, roughness: 0.92, flatShading: true });

  const statue = new THREE.Group();
  scene.add(statue);
  const add = (geo, mat, setup) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (setup) setup(m);
    statue.add(m);
    return m;
  };

  /* ---------- Seahorse body: a tapered tube from neck to curled tail ---------- */
  const spine = new THREE.CatmullRomCurve3([
    [0.32, 2.78], [0.06, 2.38], [0.16, 1.92], [0.46, 1.46], [0.42, 0.98],
    [0.12, 0.62], [-0.26, 0.48], [-0.52, 0.62], [-0.58, 0.88], [-0.4, 1.02], [-0.22, 0.92], [-0.26, 0.76],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, "centripetal");
  const radiusAt = (t) => {
    if (t < 0.12) return THREE.MathUtils.lerp(0.24, 0.3, t / 0.12);
    if (t < 0.38) return THREE.MathUtils.lerp(0.3, 0.42, (t - 0.12) / 0.26);
    if (t < 0.55) return THREE.MathUtils.lerp(0.42, 0.24, (t - 0.38) / 0.17);
    return THREE.MathUtils.lerp(0.24, 0.05, (t - 0.55) / 0.45);
  };
  const SEG = 160, RAD = 24, BASE = 1;
  const tube = new THREE.TubeGeometry(spine, SEG, BASE, RAD, false);
  const pos = tube.attributes.position, center = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    spine.getPointAt(t, center);
    const r = radiusAt(t) / BASE;
    // Flatten slightly sideways so the body reads as a seahorse and not a pipe.
    for (let j = 0; j <= RAD; j++) {
      const k = i * (RAD + 1) + j;
      v.fromBufferAttribute(pos, k).sub(center).multiplyScalar(r);
      v.z *= 0.82;
      pos.setXYZ(k, center.x + v.x, center.y + v.y, center.z + v.z);
    }
  }
  tube.computeVertexNormals();
  add(tube, bronze);
  add(new THREE.SphereGeometry(0.05, 12, 12), bronze, (m) => m.position.copy(spine.getPointAt(1)));

  // Segment rings along the body, the seahorse's armored plates.
  const tangent = new THREE.Vector3();
  for (let i = 1; i < 18; i++) {
    const t = 0.08 + i * 0.045;
    const r = radiusAt(t);
    const ring = add(new THREE.TorusGeometry(r * 0.98, Math.max(0.012, r * 0.07), 8, 32), bronzeDark);
    ring.position.copy(spine.getPointAt(t));
    spine.getTangentAt(t, tangent);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    ring.scale.set(1, 0.82, 1);
  }

  // Mane of spines down the back of the neck.
  for (let i = 0; i < 9; i++) {
    const t = 0.02 + i * 0.045;
    spine.getTangentAt(t, tangent);
    const back = new THREE.Vector3(-tangent.y, tangent.x, 0);
    if (back.x > 0) back.negate();
    const p = spine.getPointAt(t).addScaledVector(back, radiusAt(t) * 0.92);
    add(new THREE.ConeGeometry(0.05, 0.26 - i * 0.012, 8), bronzeDark, (m) => {
      m.position.copy(p);
      m.quaternion.setFromUnitVectors(UP, back);
    });
  }

  // Dorsal fin: a ribbed fan on the back.
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.absarc(0, 0, 0.42, Math.PI * 0.5, Math.PI * 1.5, false);
  fin.lineTo(0, 0);
  add(new THREE.ShapeGeometry(fin, 24), new THREE.MeshStandardMaterial({ color: 0x8a5d33, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide }), (m) => {
    m.position.set(-0.3, 1.5, 0);
    m.rotation.z = -0.25;
  });

  /* ---------- Head ---------- */
  add(new THREE.SphereGeometry(1, 32, 24), bronze, (m) => { m.position.set(0.28, 3.0, 0); m.scale.set(0.4, 0.32, 0.27); m.rotation.z = -0.35; });
  add(new THREE.CylinderGeometry(0.075, 0.12, 0.72, 20), bronze, (m) => { m.position.set(0.82, 2.84, 0); m.rotation.z = Math.PI / 2 + 0.32; });
  add(new THREE.CylinderGeometry(0.1, 0.08, 0.08, 20), bronze, (m) => { m.position.set(1.17, 2.72, 0); m.rotation.z = Math.PI / 2 + 0.32; });
  for (const z of [-0.2, 0.2]) add(new THREE.SphereGeometry(0.06, 16, 12), bronzeDark, (m) => m.position.set(0.42, 3.06, z));
  // Coronet on top of the head.
  for (let i = 0; i < 4; i++) {
    add(new THREE.ConeGeometry(0.045, 0.22, 8), bronzeDark, (m) => {
      m.position.set(0.12 + i * 0.07, 3.26 - i * 0.02, (i - 1.5) * 0.06);
      m.rotation.z = 0.2 - i * 0.12;
    });
  }

  /* ---------- The boy rider: a naked, smiling child with a charro sombrero hanging on his back ---------- */
  const limb = (a, b, r, mat = bronzeDark) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    return add(new THREE.CapsuleGeometry(r, Math.max(0.01, len - r * 2), 6, 12), mat, (m) => {
      m.position.copy(a).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
    });
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const hip = V(-0.3, 2.28, 0);
  const neck = V(-0.36, 2.86, 0);
  limb(hip, neck, 0.17);                                          // torso
  add(new THREE.SphereGeometry(0.2, 28, 20), bronzeDark, (m) => m.position.set(-0.33, 3.15, 0)); // child-sized head
  add(new THREE.SphereGeometry(0.205, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), bronze, (m) => m.position.set(-0.35, 3.18, 0)); // hair
  add(new THREE.TorusGeometry(0.13, 0.012, 6, 24), bronze, (m) => { m.position.set(-0.36, 2.92, 0); m.rotation.x = Math.PI / 2; }); // hat string
  // Charro sombrero: wide brim with rolled edge and a tall crown, hanging behind the shoulders.
  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.025, 48), bronze);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 10, 48), bronze);
  edge.rotation.x = Math.PI / 2;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.34, 32), bronze);
  crown.position.y = 0.18;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.018, 8, 32), bronzeDark);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.04;
  for (const m of [brim, edge, crown, band]) { m.castShadow = true; hat.add(m); }
  hat.position.set(-0.6, 2.62, 0);
  hat.rotation.z = Math.PI / 2 + 0.25;
  statue.add(hat);
  for (const z of [-0.1, 0.1]) limb(V(-0.42, 2.9, z), V(-0.58, 2.66, z * 1.6), 0.01, bronze);
  for (const s of [-1, 1]) {
    const knee = V(-0.02, 2.12, 0.36 * s), foot = V(-0.06, 1.68, 0.4 * s);
    limb(V(-0.28, 2.26, 0.12 * s), knee, 0.08);                   // thigh
    limb(knee, foot, 0.07);                                       // shin
  }
  const shR = V(-0.36, 2.8, 0.17), shL = V(-0.36, 2.8, -0.17);
  limb(shR, V(-0.32, 3.18, 0.36), 0.06); limb(V(-0.32, 3.18, 0.36), V(-0.16, 3.56, 0.4), 0.055); // arm raised, waving
  limb(shL, V(-0.06, 2.72, -0.3), 0.06); limb(V(-0.06, 2.72, -0.3), V(0.12, 2.92, -0.2), 0.055); // arm holding the head

  /* ---------- Rock base and the bay ---------- */
  const rockGeo = new THREE.IcosahedronGeometry(1.2, 2);
  const rp = rockGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    v.fromBufferAttribute(rp, i);
    const n = 1 + 0.12 * Math.sin(v.x * 4.1 + v.z * 2.3) + 0.08 * Math.sin(v.y * 6.7 + v.x * 3.1);
    v.multiplyScalar(n);
    rp.setXYZ(i, v.x * 1.25, v.y * 0.5, v.z * 1.05);
  }
  rockGeo.computeVertexNormals();
  add(rockGeo, stone, (m) => m.position.set(-0.05, 0.05, 0));

  const waterGeo = new THREE.RingGeometry(0.01, 7, 128, 28);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x2a62ff, metalness: 0.1, roughness: 0.18, transparent: true, opacity: 0.88 }));
  water.receiveShadow = true;
  water.position.y = 0.12;
  scene.add(water);
  const wp = waterGeo.attributes.position;
  const base = Float32Array.from(wp.array);
  const foam = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
  foam.rotation.x = Math.PI / 2;
  foam.scale.set(1.15, 0.95, 1);
  foam.position.y = 0.16;
  scene.add(foam);

  statue.position.y = 0;

  // Swap in a real scan when one is present.
  new GLTFLoader().loadAsync(REAL_MODEL_URL).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = 3.7 / size.y;
    model.scale.setScalar(s);
    box.setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, 0.12 - box.min.y, -c.z);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    statue.clear();
    statue.add(model);
  }).catch(() => { /* no scan yet: keep the hand-built model */ });

  /* ---------- Interaction: tap to make it jump ---------- */
  let jumpV = 0, jumpY = 0, spinBoost = 0, down = null;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener("pointerup", (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved < 6 && performance.now() - down.t < 400 && jumpY === 0) { jumpV = 4.2; spinBoost = 8; }
    down = null;
  });

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock();
  let raf = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back on narrow canvases so the statue always fits.
    camera.position.setLength(camera.aspect < 0.9 ? 9.4 : 7.6);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduceMotion) {
      for (let i = 0; i < wp.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        const d = Math.hypot(x, z);
        wp.setY(i, Math.sin(d * 2.2 - t * 1.6) * 0.05 * Math.min(1, d / 1.5) + Math.sin(x * 0.9 + t * 0.7) * 0.03);
      }
      wp.needsUpdate = true;
      waterGeo.computeVertexNormals();
      foam.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);
      foam.scale.y = 0.95;
    }
    if (jumpV !== 0 || jumpY > 0) {
      jumpV -= 12 * dt;
      jumpY = Math.max(0, jumpY + jumpV * dt);
      if (jumpY === 0) jumpV = 0;
    }
    statue.position.y = jumpY + (reduceMotion ? 0 : Math.sin(t * 1.3) * 0.03);
    statue.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.015;
    spinBoost *= 0.95;
    controls.autoRotateSpeed = (reduceMotion ? 0 : 1.2) + spinBoost;
    controls.autoRotate = !reduceMotion || spinBoost > 0.1;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() { if (!raf) { resize(); clock.getDelta(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}
