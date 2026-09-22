import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { Util } from '../../core/random';
import { PARTY_CONFIG, PARTY_ORDER, type PartyMemberId } from '../../config/party';
import { FIGHT_CONFIG } from '../../config/fight';
import { FIGHT_TIMING_CONFIG as T } from '../../config/fightTiming';
import { drawTpBar, drawPartyPanel } from '../battleUi';
import { PortraitCache } from '../portraits';
import { DialogueRunner } from '../../core/dialogueRunner';
import { drawDialogueBox } from '../dialogueUi';
import { EnemyAttackState } from './EnemyAttack';
import { VictoryState } from './Victory';

type Tier = 'perfect' | 'great' | 'ok' | 'miss';

interface FightBar {
  id: PartyMemberId;
  pos: number;
  dir: 1 | -1;
  speed: number;
  startDelay: number;
  elapsed: number;
  targetX: number;
  resolved: boolean;
  tier: Tier | null;
  damage: number;
}

function tierFor(distance: number): Tier {
  if (distance <= T.perfectWindowPx) return 'perfect';
  if (distance <= T.greatWindowPx) return 'great';
  if (distance <= T.okWindowPx) return 'ok';
  return 'miss';
}

/**
 * Every FIGHT-chosen character's timing bar moves AT THE SAME TIME, each
 * with its own randomized speed/start-delay (SPEC.md Stage 4). A single
 * Z press resolves whichever unresolved+started bar is currently nearest
 * its own target line — the player just has to time it, not pick a lane.
 */
export class ResolveFightState implements GameState<GameContext> {
  readonly name = 'ResolveFight';
  private bars: FightBar[] = [];
  private resultHoldSeconds = 0;
  private readonly portraits = new PortraitCache();
  private readonly runner = new DialogueRunner();
  private endingPlaying = false;

  enter(ctx: GameContext): void {
    const fighters = PARTY_ORDER.filter((id) => ctx.battle.actions[id]?.type === 'fight');
    if (fighters.length === 0) {
      ctx.goto(new EnemyAttackState());
      return;
    }
    this.bars = fighters.map((id) => ({
      id,
      pos: 0,
      dir: 1,
      speed: Util.rand(T.speedPxPerSecMin, T.speedPxPerSecMax),
      startDelay: Util.rand(T.startDelaySecMin, T.startDelaySecMax),
      elapsed: 0,
      targetX: Util.rand(30, T.barWidth - T.targetZoneWidthPx - 30),
      resolved: false,
      tier: null,
      damage: 0
    }));
    this.resultHoldSeconds = 0;
  }

  private allResolved(): boolean {
    return this.bars.every((b) => b.resolved);
  }

  private resolveNearestBar(ctx: GameContext): void {
    let best: FightBar | null = null;
    let bestDist = Infinity;
    for (const bar of this.bars) {
      if (bar.resolved || bar.elapsed < bar.startDelay) continue;
      const center = bar.targetX + T.targetZoneWidthPx / 2;
      const dist = Math.abs(bar.pos - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = bar;
      }
    }
    if (!best) return;

    const tier = tierFor(bestDist);
    const base = Util.rand(T.baseDamageMin, T.baseDamageMax);
    const weapon = FIGHT_CONFIG[best.id].damageMultiplier;
    const damage = Math.round(base * weapon * T.tierMultiplier[tier]);
    best.resolved = true;
    best.tier = tier;
    best.damage = damage;
    ctx.battle.spamtonHp = Math.max(0, ctx.battle.spamtonHp - damage);
  }

  update(ctx: GameContext, dt: number): void {
    if (this.endingPlaying) {
      if (ctx.input.justPressed('confirm')) this.runner.advance();
      if (ctx.input.justPressed('cancel')) this.runner.revealInstantly();
      this.runner.update(dt, ctx.sfxBlip);
      return;
    }

    for (const bar of this.bars) {
      if (bar.resolved) continue;
      bar.elapsed += dt;
      if (bar.elapsed < bar.startDelay) continue;
      bar.pos += bar.dir * bar.speed * dt;
      if (bar.pos < 0) {
        bar.pos = 0;
        bar.dir = 1;
      } else if (bar.pos > T.barWidth) {
        bar.pos = T.barWidth;
        bar.dir = -1;
      }
    }

    if (ctx.input.justPressed('confirm')) this.resolveNearestBar(ctx);

    if (this.allResolved()) {
      this.resultHoldSeconds += dt;
      if (this.resultHoldSeconds >= 0.9) {
        if (ctx.battle.spamtonHp <= 0) {
          this.endingPlaying = true;
          const pages = ctx.dialogueData?.endings.victory_fight ?? [];
          this.runner.start(pages, () => ctx.goto(new VictoryState('fight')));
        } else {
          ctx.goto(new EnemyAttackState());
        }
      }
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);
    drawTpBar(g, ctx);
    drawPartyPanel(g, ctx, this.portraits, null);

    g.fillStyle = '#ffe14d';
    g.font = 'bold 15px monospace';
    g.fillText('FIGHT!', 90, 60);

    this.bars.forEach((bar, i) => {
      const x = 90;
      const y = 90 + i * 66;
      g.fillStyle = '#ffffff';
      g.font = '13px monospace';
      g.fillText(`${PARTY_CONFIG[bar.id].displayName} (${FIGHT_CONFIG[bar.id].weaponName})`, x, y - 6);

      g.fillStyle = '#111111';
      g.fillRect(x, y, T.barWidth, T.barHeight);
      g.fillStyle = '#ffe14d';
      g.fillRect(x + bar.targetX, y, T.targetZoneWidthPx, T.barHeight);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 2;
      g.strokeRect(x, y, T.barWidth, T.barHeight);

      if (!bar.resolved) {
        g.fillStyle = '#ffffff';
        g.fillRect(x + bar.pos - 2, y - 4, 4, T.barHeight + 8);
      } else {
        const label = bar.tier === 'perfect' ? 'CRIT!' : bar.tier?.toUpperCase();
        g.fillStyle = bar.tier === 'perfect' ? '#ff5b5b' : '#5bffb0';
        g.font = 'bold 13px monospace';
        g.fillText(`${label}  -${bar.damage}`, x + T.barWidth - 130, y + T.barHeight + 14);
      }
    });

    if (this.endingPlaying) {
      const speaker = this.runner.currentSpeaker() ?? 'system';
      drawDialogueBox(g, {
        speaker,
        text: this.runner.currentDisplayText(),
        pageComplete: this.runner.isPageComplete(),
        portrait: speaker === 'system' ? null : this.portraits.get(ctx.assets, speaker)
      });
    } else {
      g.fillStyle = '#5bffb0';
      g.font = '12px monospace';
      g.fillText('Z — ударить по ближайшей к линии полоске', 90, 350);
    }
  }
}
