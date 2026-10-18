// "El Caballito" by Rafael Zamarripa, the boy riding a seahorse on the Puerto Vallarta Malecón.
// The statue is the real photo, cut out and raised into a relief from a depth map, so every
// detail (the boy's face, the ribs, the patina) is exactly the statue's. It turns slowly back and
// forth on its own; visitors do not drag it. A full spin would show that the relief has no back,
// so the turn stays within about 35 degrees each way.
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "./vendor/addons/environments/RoomEnvironment.js";

// Drop a real 3D scan of the statue here (for example from Polycam) and it is used instead,
// turning a full 360 degrees.
const REAL_MODEL_URL = "models/caballito.glb";
const PHOTO_URL = "img/caballito.webp";
const DEPTH_URL = "img/caballito-depth.png";
const HEIGHT = 4.2;           // world units, statue + pedestal
const RELIEF = 0.75;          // how far the thickest part stands out from the plane
const SWAY = 0.6;             // radians each way

export function createScene(canvas, { reduceMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Soft contact shadow under the pedestal.
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(12,16,33,0.45)");
    grad.addColorStop(1, "rgba(12,16,33,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -HEIGHT / 2 + 0.01;
  scene.add(shadow);

  let fullSpin = false;
  const loader = new THREE.TextureLoader();
  Promise.all([loader.loadAsync(PHOTO_URL), loader.loadAsync(DEPTH_URL)]).then(([photo, depth]) => {
    photo.colorSpace = THREE.SRGBColorSpace;
    photo.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const aspect = photo.image.width / photo.image.height;
    const geo = new THREE.PlaneGeometry(HEIGHT * aspect, HEIGHT, 240, Math.round(240 / aspect));
    // The photo already carries its own light, so it is shown unlit: emissive photo, black diffuse.
    const mat = new THREE.MeshLambertMaterial({
      color: 0x000000, map: photo, emissive: 0xffffff, emissiveMap: photo,
      displacementMap: depth, displacementScale: RELIEF, alphaTest: 0.5, side: THREE.DoubleSide,
    });
    const relief = new THREE.Mesh(geo, mat);
    relief.position.z = -RELIEF * 0.35;     // turn around the middle of the relief, not its back plane
    if (!fullSpin) pivot.add(relief);
  }).catch(() => { /* photo missing: the card shows its gradient only */ });

  // A real scan replaces the relief and may turn all the way around.
  new GLTFLoader().loadAsync(REAL_MODEL_URL).then((gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.scale.setScalar(HEIGHT / box.getSize(new THREE.Vector3()).y);
    box.setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -HEIGHT / 2 - box.min.y, -c.z);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xfff1e0, 0x26407f, 1.0));
    const sun = new THREE.DirectionalLight(0xffc49a, 2.2);
    sun.position.set(4, 7, 5);
    scene.add(sun);
    fullSpin = true;
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
    // Fit the full height with some air; pull back further on narrow cards.
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((HEIGHT * 1.18) / k, (HEIGHT * 0.9) / camera.aspect / k);
    camera.position.set(0, 0.25, dist);
    camera.lookAt(0, 0.05, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function frame() {
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      pivot.rotation.y = fullSpin ? t * 0.45 : Math.sin(t * 0.55) * SWAY;
      pivot.position.y = Math.sin(t * 1.1) * 0.03;
    } else {
      pivot.rotation.y = fullSpin ? 0 : -0.25;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() { if (!raf) { resize(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}
