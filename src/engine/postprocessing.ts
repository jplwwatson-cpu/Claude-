import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

// The Sky object (three/examples/jsm/objects/Sky.js) is a raw custom
// ShaderMaterial that writes its physically-based radiance straight to
// gl_FragColor, bypassing renderer.toneMapping/toneMappingExposure entirely
// (that chunk is only auto-injected into Three's built-in material shaders).
// Its horizon/sun glow can be many times brighter than 1.0 in linear HDR, so
// without an explicit tonemap it blows out bloom and clips to solid white.
// This pass compresses the whole buffer (sky included) before anything
// downstream reads it as "brightness".
const PreTonemapShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, exposure: { value: 1.0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float exposure;
    varying vec2 vUv;
    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb * exposure;
      color = color / (color + vec3(1.0));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// Cinematic grade: filmic vignette, subtle warm color grade, and a speed-reactive
// radial ("zoom") blur that stands in for full per-pixel motion blur — cheap
// enough to hold 60fps while still selling high-speed motion.
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    vignetteStrength: { value: 0.38 },
    speedBlur: { value: 0.0 },
    saturation: { value: 1.08 },
    warmth: { value: 0.04 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float vignetteStrength;
    uniform float speedBlur;
    uniform float saturation;
    uniform float warmth;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 toCenter = vUv - center;

      vec4 color = vec4(0.0);
      if (speedBlur > 0.001) {
        const int SAMPLES = 10;
        float total = 0.0;
        for (int i = 0; i < SAMPLES; i++) {
          float t = float(i) / float(SAMPLES - 1);
          float w = 1.0 - t * 0.5;
          vec2 uv = vUv - toCenter * (t * speedBlur * 0.06);
          color += texture2D(tDiffuse, uv) * w;
          total += w;
        }
        color /= total;
      } else {
        color = texture2D(tDiffuse, vUv);
      }

      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, saturation);
      color.rgb += vec3(warmth, warmth * 0.4, -warmth * 0.6);

      float vig = 1.0 - smoothstep(0.35, 0.95, length(toCenter)) * vignetteStrength;
      color.rgb *= vig;

      gl_FragColor = color;
    }
  `,
};

export interface PostFX {
  composer: EffectComposer;
  cinematicPass: ShaderPass;
  bloomPass: UnrealBloomPass;
  setSpeedFactor: (t: number) => void;
  resize: (w: number, h: number) => void;
}

export function createPostFX(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): PostFX {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const preTonemapPass = new ShaderPass(PreTonemapShader);
  preTonemapPass.uniforms["exposure"].value = 1.6;
  composer.addPass(preTonemapPass);

  const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssao.kernelRadius = 6;
  ssao.minDistance = 0.002;
  ssao.maxDistance = 0.12;
  ssao.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ssao);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35, // strength
    0.45, // radius
    0.94, // threshold
  );
  composer.addPass(bloomPass);

  const cinematicPass = new ShaderPass(CinematicShader);
  composer.addPass(cinematicPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms["resolution"].value.set(
    1 / (window.innerWidth * pixelRatio),
    1 / (window.innerHeight * pixelRatio),
  );
  composer.addPass(fxaaPass);

  function resize(w: number, h: number): void {
    composer.setSize(w, h);
    ssao.setSize(w, h);
    const pr = renderer.getPixelRatio();
    fxaaPass.material.uniforms["resolution"].value.set(1 / (w * pr), 1 / (h * pr));
  }

  function setSpeedFactor(t: number): void {
    cinematicPass.uniforms["speedBlur"].value = THREE.MathUtils.clamp(t, 0, 1);
  }

  return { composer, cinematicPass, bloomPass, setSpeedFactor, resize };
}
