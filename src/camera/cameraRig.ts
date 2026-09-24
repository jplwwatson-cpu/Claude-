import * as THREE from "three";
import type { FlightTelemetry } from "../physics/flightModel";

export type CameraMode = "chase" | "cockpit" | "orbit" | "flyby";
export const CAMERA_MODES: CameraMode[] = ["chase", "cockpit", "orbit", "flyby"];

const _desiredPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _shake = new THREE.Vector3();
const _flybyFixed = new THREE.Vector3();
const _flybyLook = new THREE.Vector3();

export class CameraRig {
  mode: CameraMode = "chase";
  orbitYaw = Math.PI;
  orbitPitch = 0.25;
  orbitDistance = 22;
  private smoothedPos = new THREE.Vector3();
  private smoothedFov = 60;
  private initialized = false;
  private flybyAnchor: THREE.Vector3 | null = null;
  private timeAccum = 0;
  private aircraftScale = 1;

  constructor() {
    this.setupOrbitControls();
  }

  cycle(): void {
    const idx = CAMERA_MODES.indexOf(this.mode);
    this.mode = CAMERA_MODES[(idx + 1) % CAMERA_MODES.length];
    this.flybyAnchor = null;
  }

  /**
   * Scales chase/orbit/flyby distances to the aircraft's size (1 = fighter-scale).
   * Without this, a 70m airliner or a 52m flying wing puts the default
   * fighter-tuned camera almost inside the model.
   */
  setAircraftScale(scale: number): void {
    this.aircraftScale = scale;
    this.orbitDistance = 22 * scale;
    this.flybyAnchor = null;
  }

  private setupOrbitControls(): void {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    window.addEventListener("pointerdown", (e) => {
      if (this.mode !== "orbit") return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener("pointerup", () => (dragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!dragging || this.mode !== "orbit") return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.orbitYaw -= dx * 0.006;
      this.orbitPitch = THREE.MathUtils.clamp(this.orbitPitch - dy * 0.006, -0.9, 1.2);
    });
    window.addEventListener("wheel", (e) => {
      if (this.mode !== "orbit") return;
      this.orbitDistance = THREE.MathUtils.clamp(this.orbitDistance + e.deltaY * 0.02, 8, 80);
    });
  }

  update(
    camera: THREE.PerspectiveCamera,
    aircraft: THREE.Object3D,
    telemetry: FlightTelemetry,
    dt: number,
    cockpitOffset: THREE.Vector3,
  ): void {
    this.timeAccum += dt;
    const speedT = THREE.MathUtils.clamp(telemetry.airspeed / 260, 0, 1);
    const targetFov = THREE.MathUtils.lerp(55, 82, speedT * speedT);
    this.smoothedFov = THREE.MathUtils.lerp(this.smoothedFov, targetFov, 1 - Math.exp(-dt * 3));

    // High-speed / low-altitude camera shake, more aggressive near transonic buffet.
    const nearSonic = Math.abs(telemetry.mach - 1) < 0.12 ? 1 : 0;
    const groundShake = telemetry.altitudeAGL < 40 ? (1 - telemetry.altitudeAGL / 40) : 0;
    const shakeMag = speedT * 0.05 + nearSonic * 0.12 + groundShake * 0.06;
    _shake.set(
      (Math.sin(this.timeAccum * 47.0) + Math.sin(this.timeAccum * 71.3)) * shakeMag,
      (Math.sin(this.timeAccum * 53.0) + Math.cos(this.timeAccum * 63.1)) * shakeMag,
      0,
    );

    if (this.mode === "chase") {
      const back = THREE.MathUtils.lerp(13, 20, speedT) * this.aircraftScale;
      _offset.set(0, 4.2 * this.aircraftScale, back).applyQuaternion(aircraft.quaternion);
      _desiredPos.copy(aircraft.position).add(_offset).add(_shake);
      if (!this.initialized) {
        this.smoothedPos.copy(_desiredPos);
        this.initialized = true;
      }
      this.smoothedPos.lerp(_desiredPos, 1 - Math.exp(-dt * 5.5));
      camera.position.copy(this.smoothedPos);
      _lookTarget.copy(aircraft.position).addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(aircraft.quaternion), 8);
      camera.lookAt(_lookTarget);
    } else if (this.mode === "cockpit") {
      _offset.copy(cockpitOffset).applyQuaternion(aircraft.quaternion);
      camera.position.copy(aircraft.position).add(_offset).add(_shake.clone().multiplyScalar(0.3));
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(aircraft.quaternion);
      _lookTarget.copy(camera.position).add(forward);
      camera.up.set(0, 1, 0).applyQuaternion(aircraft.quaternion);
      camera.lookAt(_lookTarget);
    } else if (this.mode === "orbit") {
      camera.up.set(0, 1, 0);
      _offset.set(
        Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch),
        Math.sin(this.orbitPitch),
        Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch),
      ).multiplyScalar(this.orbitDistance);
      _desiredPos.copy(aircraft.position).add(_offset);
      this.smoothedPos.lerp(_desiredPos, 1 - Math.exp(-dt * 8));
      camera.position.copy(this.smoothedPos);
      camera.lookAt(aircraft.position);
    } else if (this.mode === "flyby") {
      if (!this.flybyAnchor) {
        const lateral = new THREE.Vector3(1, 0, 0).applyQuaternion(aircraft.quaternion).multiplyScalar(35 * this.aircraftScale);
        _flybyFixed.copy(aircraft.position).add(lateral);
        _flybyFixed.y = Math.max(aircraft.position.y - 6 * this.aircraftScale, 2);
        this.flybyAnchor = _flybyFixed.clone();
      }
      camera.up.set(0, 1, 0);
      camera.position.copy(this.flybyAnchor);
      _flybyLook.copy(aircraft.position);
      camera.lookAt(_flybyLook);
      if (aircraft.position.distanceTo(this.flybyAnchor) > 260 * this.aircraftScale) this.flybyAnchor = null;
    }

    camera.fov = this.smoothedFov;
    camera.updateProjectionMatrix();
  }
}
