import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { allPartyDown } from '../context';
import type { Attack } from '../../attacks/types';
import { attackForTurn } from '../../attacks/sequence';
import { StubAttack } from '../../attacks/StubAttack';
import { computeAttackBoxRect } from '../../config/attacks';
import { Soul } from '../soul';
import { resolveBulletVsSoul } from '../collision';
import { drawTpBar, drawPartyPanel } from '../battleUi';
import { PortraitCache } from '../portraits';
import { DialogueRunner } from '../../core/dialogueRunner';
import { drawDialogueBox } from '../dialogueUi';
import { PartyMenuState } from './PartyMenu';
import { GameOverState } from './GameOver';

/**
 * Wires the Attack contract (init/update/draw/isFinished) together with a
 * real Soul (movement + hitbox/graze) and the shared bullet/collision loop
 * (src/game/collision.ts), using StubAttack as the pattern until Stage 6.
 * A hit picks a random living party member (SPEC.md Stage 4) and can push
 * them into DOWN; three DOWN members ends the battle.
 */
export class EnemyAttackState implements GameState<GameContext> {
  readonly name = 'EnemyAttack';
  private attack: Attack | null = null;
  private readonly portraits = new PortraitCache();
  private readonly runner = new DialogueRunner();
  private gameOverPending = false;

  enter(ctx: GameContext): void {
    const id = attackForTurn(ctx.battle.turnNumber);
    const box = computeAttackBoxRect(id);
    ctx.soul = new Soul(box.x + box.w / 2, box.y + box.h * 0.75);
    ctx.bullets = [];

    this.attack = new StubAttack(id);
    this.attack.init({
      turnNumber: ctx.battle.turnNumber,
      spawnBullet: (b) => ctx.bullets.push({ ...b, grazeTicksUsed: 0, dead: false })
    });
    ctx.battle.currentAttack = this.attack;
  }

  exit(ctx: GameContext): void {
    ctx.battle.currentAttack = null;
    ctx.soul = null;
    ctx.bullets = [];
  }

  update(ctx: GameContext, dt: number): void {
    if (this.gameOverPending) {
      if (ctx.input.justPressed('confirm')) this.runner.advance();
      if (ctx.input.justPressed('cancel')) this.runner.revealInstantly();
      this.runner.update(dt, ctx.sfxBlip);
      return;
    }

    const soul = ctx.soul;
    if (!soul || !this.attack) return;

    const id = attackForTurn(ctx.battle.turnNumber);
    const box = computeAttackBoxRect(id);
    soul.update(dt, ctx.input, box);

    this.attack.update(dt);

    for (const bullet of ctx.bullets) {
      if (bullet.dead) continue;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      resolveBulletVsSoul(bullet, soul, ctx);
      if (bullet.y > 500 || bullet.y < -40 || bullet.x < -40 || bullet.x > 680) bullet.dead = true;
    }
    ctx.bullets = ctx.bullets.filter((b) => !b.dead);

    if (allPartyDown(ctx.battle)) {
      this.gameOverPending = true;
      const pages = ctx.dialogueData?.endings.game_over ?? [];
      this.runner.start(pages, () => ctx.goto(new GameOverState()));
      return;
    }

    if (this.attack.isFinished()) {
      ctx.battle.turnNumber += 1;
      ctx.goto(new PartyMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);
    drawTpBar(g, ctx);
    drawPartyPanel(g, ctx, this.portraits, null);

    this.attack?.draw(g);
    for (const bullet of ctx.bullets) {
      g.fillStyle = '#ff5b9c';
      g.beginPath();
      g.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      g.fill();
    }
    ctx.soul?.draw(g);

    g.fillStyle = '#5bffb0';
    g.font = '11px monospace';
    g.textAlign = 'right';
    g.fillText(`FPS: ${ctx.fps.toFixed(0)} | ${ctx.currentStateName()}`, 630, 16);
    g.textAlign = 'left';

    if (this.gameOverPending) {
      const speaker = this.runner.currentSpeaker() ?? 'system';
      drawDialogueBox(g, {
        speaker,
        text: this.runner.currentDisplayText(),
        pageComplete: this.runner.isPageComplete(),
        portrait: speaker === 'system' ? null : this.portraits.get(ctx.assets, speaker)
      });
    }
  }
}
