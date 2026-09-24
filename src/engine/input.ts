// Local input only: keyboard + the browser's native Gamepad API. No network involved.

export interface FlightInputState {
  pitch: number; // -1..1
  roll: number; // -1..1
  yaw: number; // -1..1
  throttleDelta: number; // per-second rate applied by the caller
  afterburner: boolean;
  flapsToggle: boolean;
  gearToggle: boolean;
  speedbrake: boolean;
  vtolToggle: boolean;
  wingSweepToggle: boolean;
  cameraCycle: boolean;
  pauseToggle: boolean;
}

const KEYS_DOWN = new Set<string>();

export function initInput(): void {
  window.addEventListener("keydown", (e) => {
    KEYS_DOWN.add(e.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => KEYS_DOWN.delete(e.code));
  window.addEventListener("blur", () => KEYS_DOWN.clear());
}

function edge(prevRef: { v: boolean }, down: boolean): boolean {
  const fired = down && !prevRef.v;
  prevRef.v = down;
  return fired;
}

const flapsRef = { v: false };
const gearRef = { v: false };
const vtolRef = { v: false };
const sweepRef = { v: false };
const camRef = { v: false };
const pauseRef = { v: false };

export function pollInput(): FlightInputState {
  const gp = navigator.getGamepads?.()[0] ?? null;

  let pitch = 0;
  let roll = 0;
  let yaw = 0;

  if (KEYS_DOWN.has("KeyS") || KEYS_DOWN.has("ArrowDown")) pitch -= 1;
  if (KEYS_DOWN.has("KeyW") || KEYS_DOWN.has("ArrowUp")) pitch += 1;
  if (KEYS_DOWN.has("KeyA") || KEYS_DOWN.has("ArrowLeft")) roll -= 1;
  if (KEYS_DOWN.has("KeyD") || KEYS_DOWN.has("ArrowRight")) roll += 1;
  if (KEYS_DOWN.has("KeyQ")) yaw -= 1;
  if (KEYS_DOWN.has("KeyE")) yaw += 1;

  if (gp) {
    const ax = gp.axes;
    if (Math.abs(ax[0] ?? 0) > 0.12) roll = THREE_clamp(ax[0]);
    if (Math.abs(ax[1] ?? 0) > 0.12) pitch = THREE_clamp(-ax[1]);
    if (Math.abs(ax[2] ?? 0) > 0.15) yaw = THREE_clamp(ax[2]);
  }

  let throttleDelta = 0;
  if (KEYS_DOWN.has("ShiftLeft") || KEYS_DOWN.has("ShiftRight")) throttleDelta += 0.6;
  if (KEYS_DOWN.has("ControlLeft") || KEYS_DOWN.has("ControlRight")) throttleDelta -= 0.6;
  if (gp) {
    const rt = gp.buttons[7]?.value ?? 0;
    const lt = gp.buttons[6]?.value ?? 0;
    throttleDelta += rt * 0.8 - lt * 0.8;
  }

  const afterburner = KEYS_DOWN.has("Space") || (gp?.buttons[0]?.pressed ?? false);

  return {
    pitch: clamp(pitch, -1, 1),
    roll: clamp(roll, -1, 1),
    yaw: clamp(yaw, -1, 1),
    throttleDelta,
    afterburner,
    flapsToggle: edge(flapsRef, KEYS_DOWN.has("KeyF")),
    gearToggle: edge(gearRef, KEYS_DOWN.has("KeyG")),
    speedbrake: KEYS_DOWN.has("KeyB"),
    vtolToggle: edge(vtolRef, KEYS_DOWN.has("KeyV")),
    wingSweepToggle: edge(sweepRef, KEYS_DOWN.has("KeyN")),
    cameraCycle: edge(camRef, KEYS_DOWN.has("KeyC")),
    pauseToggle: edge(pauseRef, KEYS_DOWN.has("Escape")),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function THREE_clamp(v: number): number {
  return clamp(v, -1, 1);
}
