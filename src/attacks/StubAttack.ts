// Placeholder Attack implementation used by the Stage-2+ EnemyAttack debug
// state, to prove the Attack contract (init/update/draw/isFinished) and,
// since Stage 4, the spawnBullet()/soul/graze/TP pipeline end-to-end
// before any real bullet-hell pattern exists. Delete once real attacks
// land in Stage 6, or keep as a template for new ones.
import type { Attack, AttackContext, AttackId } from './types';
import { ATTACK_CONFIG, computeAttackBoxRect } from '../config/attacks';

/** Test-only bullet damage/speed — real attacks define their own per
 * their own config in Stage 6, this exists purely to exercise
 * graze/hit/DOWN end-to-end now. */
const TEST_BULLET = {
  spawnIntervalSeconds: 0.7,
  speedPxPerSec: 90,
  radius: 6,
  damage: 14
};

export class StubAttack implements Attack {
  readonly id: AttackId;
  private elapsed = 0;
  private duration = 0;
  private turnNumber = 0;
  private spawnTimer = 0;
  private spawnBullet: AttackContext['spawnBullet'] = () => {};

  constructor(id: AttackId) {
    this.id = id;
  }

  init(ctx: AttackContext): void {
    this.elapsed = 0;
    this.spawnTimer = 0;
    this.duration = ATTACK_CONFIG[this.id].durationSeconds;
    this.turnNumber = ctx.turnNumber;
    this.spawnBullet = ctx.spawnBullet;
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.spawnTimer += dt;
    if (this.spawnTimer >= TEST_BULLET.spawnIntervalSeconds && this.elapsed < this.duration - 1) {
      this.spawnTimer = 0;
      const box = computeAttackBoxRect(this.id);
      const x = box.x + Math.random() * box.w;
      this.spawnBullet({
        x,
        y: box.y - 10,
        vx: 0,
        vy: TEST_BULLET.speedPxPerSec,
        radius: TEST_BULLET.radius,
        damage: TEST_BULLET.damage
      });
    }
  }

  draw(g: CanvasRenderingContext2D): void {
    const box = computeAttackBoxRect(this.id);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.strokeRect(box.x, box.y, box.w, box.h);

    g.fillStyle = '#ffe14d';
    g.font = '14px monospace';
    g.textAlign = 'center';
    g.fillText(`[STUB ATTACK] ${this.id}`, 320, box.y - 22);
    g.fillText(`turn ${this.turnNumber} — ${this.elapsed.toFixed(1)}s / ${this.duration}s`, 320, box.y - 6);
    g.textAlign = 'left';
  }

  isFinished(): boolean {
    return this.elapsed >= this.duration;
  }
}
