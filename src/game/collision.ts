// Shared bullet-vs-soul collision: hit -> damage a random living party
// member (SPEC.md Stage 4: "Атака врага бьёт по случайному живому
// персонажу"); near-miss within the graze ring -> +TP, capped per bullet.
// Lives here (not per-attack) so every real attack in Stage 6 gets this
// for free by calling ctx.spawnBullet().
import type { GameContext } from './context';
import { clampTp } from './context';
import type { Soul } from './soul';
import type { SimpleBullet } from '../attacks/types';
import { GRAZE_CONFIG } from '../config/graze';
import { DEFEND_CONFIG } from '../config/party';
import { PARTY_ORDER } from '../config/party';
import type { PartyMemberId } from '../config/party';

export function livingMembers(ctx: GameContext): PartyMemberId[] {
  return PARTY_ORDER.filter((id) => !ctx.battle.party[id].isDown);
}

export function dealDamageToRandomLivingMember(ctx: GameContext, rawAmount: number): PartyMemberId | null {
  const alive = livingMembers(ctx);
  if (alive.length === 0) return null;
  const targetId = alive[Math.floor(Math.random() * alive.length)]!;

  let amount = rawAmount;
  if (ctx.battle.defendedThisRound[targetId]) {
    amount *= 1 - DEFEND_CONFIG.damageReductionPercent / 100;
  }
  if (ctx.battle.pacifyDamageReductionPercent > 0) {
    amount *= 1 - ctx.battle.pacifyDamageReductionPercent / 100;
  }
  amount = Math.max(0, Math.round(amount));

  const member = ctx.battle.party[targetId];
  member.hp -= amount;
  if (member.hp <= 0) member.isDown = true;

  return targetId;
}

/** Advances one bullet vs the soul for one fixed tick. Returns what
 * happened so the caller (EnemyAttackState) can drive shake/SFX later. */
export function resolveBulletVsSoul(
  bullet: SimpleBullet,
  soul: Soul,
  ctx: GameContext
): 'hit' | 'graze' | 'none' {
  const dx = bullet.x - soul.x;
  const dy = bullet.y - soul.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < bullet.radius + soul.hitboxRadius) {
    if (!soul.isInvincible()) {
      soul.registerHit();
      dealDamageToRandomLivingMember(ctx, bullet.damage);
    }
    return 'hit';
  }

  if (
    dist < bullet.radius + soul.grazeRadius &&
    bullet.grazeTicksUsed < GRAZE_CONFIG.maxGrazeTicksPerBullet
  ) {
    bullet.grazeTicksUsed++;
    ctx.battle.tp = clampTp(ctx.battle.tp + GRAZE_CONFIG.tpPerGrazeTick);
    soul.registerGraze();
    return 'graze';
  }

  return 'none';
}
