// Shared rendering helper for Stage-2 stub states. Every placeholder
// screen looks the same (name, FPS, hint) so it's obvious at a glance
// which part of the SPEC.md §1 flow you're looking at. Real per-state UI
// replaces these draw() calls in later stages — this file goes away once
// nothing calls it anymore.
import type { GameContext } from './context';

export function drawStubScreen(
  g: CanvasRenderingContext2D,
  ctx: GameContext,
  title: string,
  lines: string[]
): void {
  g.fillStyle = '#0a0a12';
  g.fillRect(0, 0, 640, 480);

  g.fillStyle = '#ffe14d';
  g.font = 'bold 22px monospace';
  g.textAlign = 'center';
  g.fillText(title, 320, 60);

  g.fillStyle = '#ffffff';
  g.font = '15px monospace';
  lines.forEach((line, i) => g.fillText(line, 320, 110 + i * 22));

  g.fillStyle = '#5bffb0';
  g.font = '12px monospace';
  const devHint = import.meta.env.DEV ? '  |  [DEV] F1: Victory  F2: GameOver' : '';
  g.fillText(`FPS: ${ctx.fps.toFixed(0)}  |  state: ${ctx.currentStateName()}${devHint}`, 320, 460);
  g.textAlign = 'left';
}
