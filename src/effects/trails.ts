import * as THREE from "three";
import type { FlightTelemetry } from "../physics/flightModel";

const MAX_PARTICLES = 600;

function softDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface Particle {
  age: number;
  life: number;
  active: boolean;
}

/** Contrails from the wingtips at high altitude / high-G, plus a transonic vapor cone. */
export class TrailSystem {
  private points: THREE.Points;
  private positions: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  private particles: Particle[] = [];
  private cursor = 0;
  private emitAccumulator = 0;
  private vaporCone: THREE.Mesh;

  constructor(private scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.alphas = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) this.particles.push({ age: 0, life: 1, active: false });

    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute("alpha", new THREE.BufferAttribute(this.alphas, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { map: { value: softDotTexture() } },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(tex.rgb, tex.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    const vaporMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.vaporCone = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), vaporMat);
    scene.add(this.vaporCone);
  }

  private spawn(position: THREE.Vector3, size: number, life: number): void {
    const p = this.particles[this.cursor];
    p.active = true;
    p.age = 0;
    p.life = life;
    this.positions[this.cursor * 3] = position.x;
    this.positions[this.cursor * 3 + 1] = position.y;
    this.positions[this.cursor * 3 + 2] = position.z;
    this.sizes[this.cursor] = size;
    this.alphas[this.cursor] = 0.55;
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
  }

  update(dt: number, aircraft: THREE.Object3D, telemetry: FlightTelemetry, wingSpan: number): void {
    const shouldContrail = telemetry.altitude > 7500 || Math.abs(telemetry.gForce) > 5.5;
    if (shouldContrail && telemetry.airspeed > 40) {
      this.emitAccumulator += dt;
      const interval = 0.03;
      const rightWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(aircraft.quaternion);
      while (this.emitAccumulator > interval) {
        this.emitAccumulator -= interval;
        for (const side of [1, -1]) {
          const pos = aircraft.position
            .clone()
            .addScaledVector(rightWorld, side * wingSpan * 0.48)
            .addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(aircraft.quaternion), -wingSpan * 0.1);
          this.spawn(pos, 4 + Math.random() * 3, 4 + Math.random() * 2);
        }
      }
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.active = false;
        this.alphas[i] = 0;
        continue;
      }
      const t = p.age / p.life;
      this.alphas[i] = 0.5 * (1 - t);
      this.sizes[i] += dt * 3;
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;

    // Prandtl-Glauert vapor cone right around Mach 1.
    const machDelta = Math.abs(telemetry.mach - 1);
    const vaporT = Math.max(0, 1 - machDelta / 0.09);
    this.vaporCone.visible = vaporT > 0.01;
    if (this.vaporCone.visible) {
      this.vaporCone.position.copy(aircraft.position);
      const scale = wingSpan * (1.1 + vaporT * 0.4);
      this.vaporCone.scale.set(scale, scale * 0.55, scale * 1.6);
      this.vaporCone.quaternion.copy(aircraft.quaternion);
      (this.vaporCone.material as THREE.MeshBasicMaterial).opacity = vaporT * 0.35;
    }
  }
}
