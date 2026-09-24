import * as THREE from "three";

function puffTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const d = Math.hypot(dx, dy);
      let a = Math.max(0, 1 - d);
      a = Math.pow(a, 1.6);
      const noise =
        0.75 +
        0.25 *
          (Math.sin(x * 0.35 + y * 0.21) * 0.5 +
            Math.sin(x * 0.11 - y * 0.29) * 0.3 +
            Math.sin((x + y) * 0.17) * 0.2);
      a *= Math.max(0, noise);
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.floor(THREE.MathUtils.clamp(a, 0, 1) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const VERTEX_SHADER = /* glsl */ `
  attribute float instanceScale;
  attribute vec3 instanceTint;
  varying vec2 vUv;
  varying vec3 vTint;
  void main() {
    vUv = uv;
    vTint = instanceTint;
    vec4 worldCenter = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 offset = (position.x * camRight + position.y * camUp) * instanceScale;
    vec4 mvPosition = viewMatrix * vec4(worldCenter.xyz + offset, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 sunDirection;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying vec2 vUv;
  varying vec3 vTint;
  void main() {
    vec4 tex = texture2D(map, vUv);
    if (tex.a < 0.02) discard;
    float sunFactor = clamp(sunDirection.y * 0.6 + 0.55, 0.15, 1.0);
    vec3 color = mix(vTint * 0.55, vec3(1.0), sunFactor);
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = smoothstep(fogNear, fogFar, depth);
    color = mix(color, fogColor, fogFactor * 0.9);
    gl_FragColor = vec4(color, tex.a);
  }
`;

export interface CloudField {
  mesh: THREE.InstancedMesh;
  update: (sunDirection: THREE.Vector3, fogColor: THREE.Color) => void;
}

export function createCloudField(scene: THREE.Scene, regionSize = 70000, count = 900): CloudField {
  const geo = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: puffTexture() },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      fogColor: { value: new THREE.Color(0xbfd6e8) },
      fogNear: { value: 3000 },
      fogFar: { value: 40000 },
    },
  });

  const mesh = new THREE.InstancedMesh(geo, material, count);
  const scales = new Float32Array(count);
  const tints = new Float32Array(count * 3);
  const dummy = new THREE.Object3D();

  const clusterCount = Math.floor(count / 22);
  let instanceIndex = 0;
  for (let c = 0; c < clusterCount && instanceIndex < count; c++) {
    const cx = (Math.random() - 0.5) * regionSize;
    const cz = (Math.random() - 0.5) * regionSize;
    const cy = 900 + Math.random() * 2600;
    const puffs = 14 + Math.floor(Math.random() * 12);
    const baseScale = 220 + Math.random() * 260;
    for (let p = 0; p < puffs && instanceIndex < count; p++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * baseScale * 1.6;
      dummy.position.set(
        cx + Math.cos(ang) * rad,
        cy + (Math.random() - 0.5) * baseScale * 0.35,
        cz + Math.sin(ang) * rad,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(instanceIndex, dummy.matrix);
      scales[instanceIndex] = baseScale * (0.6 + Math.random() * 0.7);
      const shade = 0.82 + Math.random() * 0.18;
      tints[instanceIndex * 3] = shade;
      tints[instanceIndex * 3 + 1] = shade;
      tints[instanceIndex * 3 + 2] = shade + 0.03;
      instanceIndex++;
    }
  }
  for (; instanceIndex < count; instanceIndex++) {
    dummy.position.set(0, -100000, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(instanceIndex, dummy.matrix);
  }

  geo.setAttribute("instanceScale", new THREE.InstancedBufferAttribute(scales, 1));
  geo.setAttribute("instanceTint", new THREE.InstancedBufferAttribute(tints, 3));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  scene.add(mesh);

  return {
    mesh,
    update(sunDirection: THREE.Vector3, fogColor: THREE.Color) {
      material.uniforms["sunDirection"].value.copy(sunDirection);
      material.uniforms["fogColor"].value.copy(fogColor);
    },
  };
}
