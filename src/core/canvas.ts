// Fixed internal resolution, integer CSS scaling, no blur — per SPEC tech
// requirements. The canvas backing store always stays 640x480; only the
// CSS box size changes, so drawing code never has to think about scale.

export const INTERNAL_WIDTH = 640;
export const INTERNAL_HEIGHT = 480;

export class GameCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = INTERNAL_WIDTH;
    this.canvas.height = INTERNAL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context is not available in this browser.');
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Recomputes the largest integer scale that fits the viewport, then
   * applies it as the canvas's CSS size (the backing resolution never
   * changes, so `image-rendering: pixelated` stays crisp at any scale). */
  resize(): void {
    const availW = window.innerWidth;
    const availH = window.innerHeight;
    const scale = Math.max(
      1,
      Math.floor(Math.min(availW / INTERNAL_WIDTH, availH / INTERNAL_HEIGHT))
    );
    this.canvas.style.width = `${INTERNAL_WIDTH * scale}px`;
    this.canvas.style.height = `${INTERNAL_HEIGHT * scale}px`;
  }
}
