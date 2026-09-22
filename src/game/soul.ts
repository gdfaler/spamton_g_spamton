// Yellow soul: movement + hitbox/graze geometry only (Stage 4 scope).
// Shooting/Big Shot is Stage 5 — this class exists now so TP/graze can be
// proven end-to-end against StubAttack's test bullets ahead of real
// attacks.
import { SOUL_CONFIG } from '../config/soul';
import type { InputManager } from '../core/input';

export interface BattleBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Soul {
  x: number;
  y: number;
  invincibleSeconds = 0;
  grazeFlashSeconds = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get hitboxRadius(): number {
    return SOUL_CONFIG.hitboxRadius;
  }

  get grazeRadius(): number {
    return SOUL_CONFIG.hitboxRadius + SOUL_CONFIG.grazeExtraRadius;
  }

  isInvincible(): boolean {
    return this.invincibleSeconds > 0;
  }

  update(dt: number, input: InputManager, box: BattleBox): void {
    let dx = 0;
    let dy = 0;
    if (input.isDown('left')) dx -= 1;
    if (input.isDown('right')) dx += 1;
    if (input.isDown('up')) dy -= 1;
    if (input.isDown('down')) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    this.x += dx * SOUL_CONFIG.moveSpeed * dt;
    this.y += dy * SOUL_CONFIG.moveSpeed * dt;
    this.x = Math.min(Math.max(this.x, box.x + this.hitboxRadius), box.x + box.w - this.hitboxRadius);
    this.y = Math.min(Math.max(this.y, box.y + this.hitboxRadius), box.y + box.h - this.hitboxRadius);

    if (this.invincibleSeconds > 0) this.invincibleSeconds -= dt;
    if (this.grazeFlashSeconds > 0) this.grazeFlashSeconds -= dt;
  }

  registerHit(): void {
    this.invincibleSeconds = SOUL_CONFIG.invincibleSecondsAfterHit;
  }

  registerGraze(): void {
    this.grazeFlashSeconds = SOUL_CONFIG.grazeFlashSeconds;
  }

  draw(g: CanvasRenderingContext2D): void {
    const blinking = this.isInvincible() && Math.floor(this.invincibleSeconds * 20) % 2 === 0;
    if (blinking) return;

    if (this.grazeFlashSeconds > 0) {
      g.save();
      g.strokeStyle = '#5bffea';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(this.x, this.y, this.grazeRadius, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }

    g.save();
    g.translate(this.x, this.y);
    g.fillStyle = '#ffe14d';
    const s = this.hitboxRadius * 1.6;
    g.beginPath();
    g.moveTo(0, s * 0.35);
    g.bezierCurveTo(s, -s * 0.4, s * 0.5, -s, 0, -s * 0.25);
    g.bezierCurveTo(-s * 0.5, -s, -s, -s * 0.4, 0, s * 0.35);
    g.fill();
    g.restore();
  }
}
