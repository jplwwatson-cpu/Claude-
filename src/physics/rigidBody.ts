import * as THREE from "three";

// Body axes convention (matches the aircraft models, nose along local -Z):
//   local +X = right, local +Y = up, local -Z = forward
// angularVelocity is expressed in the body frame: x = pitch rate, y = yaw rate, z = roll rate.

export class RigidBodyState {
  position = new THREE.Vector3(0, 500, 0);
  velocity = new THREE.Vector3(0, 0, -50); // world-space m/s
  quaternion = new THREE.Quaternion();
  angularVelocity = new THREE.Vector3(0, 0, 0); // body-space rad/s
  mass = 10000; // kg, updated per-aircraft (empty + remaining fuel)

  forward(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(0, 0, -1).applyQuaternion(this.quaternion);
  }
  up(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(0, 1, 0).applyQuaternion(this.quaternion);
  }
  right(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(1, 0, 0).applyQuaternion(this.quaternion);
  }
}

const _accel = new THREE.Vector3();
const _halfStep = new THREE.Quaternion();

/** Integrates linear motion (world space) and angular motion (body-space omega) by dt seconds. */
export function integrateRigidBody(
  state: RigidBodyState,
  forceWorld: THREE.Vector3,
  dt: number,
): void {
  // Linear: F = ma, semi-implicit Euler (update velocity first, then position) —
  // stable for real-time stepping and gives the plane real momentum/mass feel.
  _accel.copy(forceWorld).divideScalar(state.mass);
  state.velocity.addScaledVector(_accel, dt);
  state.position.addScaledVector(state.velocity, dt);

  // Angular: q' = q * exp(0.5 * dt * omega), first-order approximation, then renormalize.
  const w = state.angularVelocity;
  if (w.lengthSq() > 1e-10) {
    _halfStep.set(w.x * dt * 0.5, w.y * dt * 0.5, w.z * dt * 0.5, 1);
    state.quaternion.multiply(_halfStep).normalize();
  }
}
