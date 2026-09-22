// Fixed-timestep accumulator loop. Game logic always advances in 1/60s
// slices regardless of display refresh rate (60/120/144Hz all behave the
// same), while rendering runs once per requestAnimationFrame call. This is
// the standard "decouple simulation from render" pattern.

export const FIXED_DT = 1 / 60;
const MAX_FRAME_TIME = 0.25; // clamp huge gaps (tab switch, breakpoint, etc.)
const MAX_STEPS_PER_FRAME = 5; // avoid a spiral of death if we fall behind

export interface LoopCallbacks {
  update(dt: number): void;
  /** `alpha` in [0,1) is how far we are between the last and next fixed
   * step — useful later for interpolated rendering; stage-2 states can
   * ignore it. */
  render(alpha: number): void;
}

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafHandle = 0;
  private running = false;

  constructor(private readonly callbacks: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafHandle);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    this.rafHandle = requestAnimationFrame(this.tick);

    let frameTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    this.accumulator += frameTime;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      this.callbacks.update(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps++;
    }

    this.callbacks.render(this.accumulator / FIXED_DT);
  };
}
