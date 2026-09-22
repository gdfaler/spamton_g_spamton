// Placeholder Attack implementation used only by the Stage-2 EnemyAttack
// debug state, to prove the Attack contract (init/update/draw/isFinished)
// works end-to-end before any real bullet pattern exists. Delete once real
// attacks land in Stage 6, or keep as a template for new ones.
import type { Attack, AttackContext, AttackId } from './types';
import { ATTACK_CONFIG } from '../config/attacks';

export class StubAttack implements Attack {
  readonly id: AttackId;
  private elapsed = 0;
  private duration = 0;
  private turnNumber = 0;

  constructor(id: AttackId) {
    this.id = id;
  }

  init(ctx: AttackContext): void {
    this.elapsed = 0;
    this.duration = ATTACK_CONFIG[this.id].durationSeconds;
    this.turnNumber = ctx.turnNumber;
  }

  update(dt: number): void {
    this.elapsed += dt;
  }

  draw(g: CanvasRenderingContext2D): void {
    const cfg = ATTACK_CONFIG[this.id];
    const boxX = (640 - cfg.boxWidth) / 2;
    const boxY = 260;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.strokeRect(boxX, boxY, cfg.boxWidth, cfg.boxHeight);

    g.fillStyle = '#ffe14d';
    g.font = '16px monospace';
    g.textAlign = 'center';
    g.fillText(`[STUB ATTACK] ${this.id}`, 320, boxY - 30);
    g.fillText(`turn ${this.turnNumber} — ${this.elapsed.toFixed(1)}s / ${this.duration}s`, 320, boxY - 10);
    g.textAlign = 'left';
  }

  isFinished(): boolean {
    return this.elapsed >= this.duration;
  }
}
