// "El Caballito" by Rafael Zamarripa, the boy riding a seahorse on the Puerto Vallarta Malecón.
// Built in 3D from the real photo: the cut-out statue is inflated from its silhouette into a
// closed, two-sided volume (front shell plus a mirrored back shell meeting at the outline), lit
// so its shading changes as it turns. Every detail (the boy, the ribs, the patina) comes from
// the photo. It flies in on a diagonal when shown, then turns a full circle on its own;
// visitors do not drag it. It stands on the Malecón's tall dark stone pedestal.
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "./vendor/addons/environments/RoomEnvironment.js";

// Drop a real 3D scan of the statue here (for example from Polycam) and it is used instead.
const REAL_MODEL_URL = "models/caballito.glb";
const PHOTO_URL = "img/caballito.webp";
const DEPTH_URL = "img/caballito-depth.png";
const HEIGHT = 4.6;          // world units, statue + pedestal
const RELIEF = 0.42;         // half-thickness of the thickest part; the real seahorse is flat-sided
// Where each part sits in the source photo, in pixels: [left, top, right, bottom].
const SRC = { statue: [152, 94, 418, 546], axis: 248 };
// The Malecón pedestal, in the same pixel units: a tall, slightly tapered dark stone drum.
const PED = { top: 112, bottom: 136, height: 250 };
const ENTER = 1.8;           // seconds for the entrance flight

// Rough dark stone: speckled noise painted once on a canvas.
function stoneTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#3b3d3f";
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 9000; i++) {
    const v = 40 + Math.random() * 50;
    g.fillStyle = `rgba(${v},${v + 2},${v + 4},${0.25 + Math.random() * 0.5})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// One shell of the statue: a dense plane pushed out along z by the depth map.
function shell(width, height, depth, dw, dh, sign) {
  const sx = 260, sy = Math.round(260 * height / width);
  const geo = new THREE.PlaneGeometry(width, height, sx, sy);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    const x = Math.min(dw - 1, Math.round(u * (dw - 1))), y = Math.min(dh - 1, Math.round((1 - v) * (dh - 1)));
    const d = depth[(y * dw + x) * 4] / 255;
    pos.setZ(i, sign * Math.max(0, d - 0.06) * RELIEF);
  }
  if (sign < 0) {
    // Flip the winding so the back shell faces outward.
    const idx = geo.index.array;
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  }
  geo.computeVertexNormals();
  return geo;
}

export function createScene(canvas, { reduceMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff3e6, 0x2a4690, 0.9));
  const key = new THREE.DirectionalLight(0xffe0c2, 1.8);
  key.position.set(3, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd2ff, 1.2);
  rim.position.set(-4, 3, -5);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Soft contact shadow under the pedestal.
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(12,16,33,0.4)");
    grad.addColorStop(1, "rgba(12,16,33,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -HEIGHT / 2 + 0.01;
  const shadowMat = shadow.material;
  scene.add(shadow);

  let scanned = false;
  let enterAt = 0;
  const tex = new THREE.TextureLoader();
  Promise.all([tex.loadAsync(PHOTO_URL), loadImage(DEPTH_URL)]).then(([photo, depthImg]) => {
    if (scanned) return;
    photo.colorSpace = THREE.SRGBColorSpace;
    photo.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const c = document.createElement("canvas");
    c.width = depthImg.width; c.height = depthImg.height;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(depthImg, 0, 0);
    const depth = g.getImageData(0, 0, c.width, c.height).data;
    const [sl, st, sr, sb] = SRC.statue;
    const px = HEIGHT / (sb - st + PED.height);                   // world units per source pixel
    const axis = SRC.axis;                                        // the pedestal's center is the turning axis
    const width = (sr - sl) * px, height = (sb - st) * px;
    // Photo colors stay true (emissive) while the lights add shape as it turns.
    const mat = new THREE.MeshStandardMaterial({
      map: photo, emissive: 0xffffff, emissiveMap: photo, emissiveIntensity: 0.55,
      roughness: 0.55, metalness: 0.1, alphaTest: 0.5,
    });
    const body = new THREE.Group();
    body.add(new THREE.Mesh(shell(width, height, depth, c.width, c.height, 1), mat));
    body.add(new THREE.Mesh(shell(width, height, depth, c.width, c.height, -1), mat));
    body.position.set(((sl + sr) / 2 - axis) * px, HEIGHT / 2 - height / 2, 0);
    pivot.add(body);

    // The pedestal is a real tapered drum of rough dark stone, as on the Malecón.
    const bh = PED.height * px;
    const sideMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.95, metalness: 0 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 0.9 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(PED.top * px, PED.bottom * px, bh, 96, 1, false), [sideMat, capMat, capMat]);
    base.position.y = -HEIGHT / 2 + bh / 2;
    pivot.add(base);
    enterAt = clock.getElapsedTime();     // fly in once the statue is ready to be seen
  }).catch(() => { /* photo missing: the card shows its gradient only */ });

  new GLTFLoader().loadAsync(REAL_MODEL_URL).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.scale.setScalar(HEIGHT / box.getSize(new THREE.Vector3()).y);
    box.setFromObject(model);
    const ctr = box.getCenter(new THREE.Vector3());
    model.position.set(-ctr.x, -HEIGHT / 2 - box.min.y, -ctr.z);
    scanned = true;
    pivot.clear();
    pivot.add(model);
  }).catch(() => { /* no scan yet */ });

  const clock = new THREE.Clock();
  let raf = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((HEIGHT * 1.12) / k, (HEIGHT * 0.85) / camera.aspect / k);
    camera.position.set(0, 0.6, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Entrance: it flies in from the lower right on a diagonal, spinning, and lands on its pedestal.
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  function frame() {
    const t = clock.getElapsedTime();
    if (reduceMotion) {
      pivot.rotation.set(0, -0.35, 0);
    } else {
      const p = Math.min(1, (t - enterAt) / ENTER), e = easeOut(p), r = 1 - e;
      pivot.position.set(3.4 * r, -3.2 * r + Math.sin(t * 1.1) * 0.03 * e, 0);
      pivot.scale.setScalar(0.25 + 0.75 * e);
      pivot.rotation.set(0, -0.35 + t * 0.4 - r * Math.PI * 3, -0.55 * r);
      shadowMat.opacity = e;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() { if (!raf) { resize(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    enter() { enterAt = clock.getElapsedTime(); },
  };
}
