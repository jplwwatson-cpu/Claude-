export function startLoop(update: (dt: number, elapsedSeconds: number) => void): () => void {
  let lastTime = performance.now();
  let elapsed = 0;
  let running = true;

  function frame(now: number): void {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    elapsed += dt;
    update(dt, elapsed);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return () => {
    running = false;
  };
}
