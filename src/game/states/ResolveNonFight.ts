import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { clampMercy, clampTp } from '../context';
import type { DialoguePage } from '../../core/dialogueData';
import { DialogueRunner } from '../../core/dialogueRunner';
import { PortraitCache } from '../portraits';
import { drawDialogueBox } from '../dialogueUi';
import { drawTpBar } from '../battleUi';
import { PARTY_CONFIG, PARTY_ORDER, DEFEND_CONFIG, MERCY_CONFIG, PACIFY_CONFIG, SPAMTON_NEO_CONFIG } from '../../config/party';
import { SUSIE_MAGIC, RALSEI_MAGIC } from '../../config/magic';
import { ResolveFightState } from './ResolveFight';
import { VictoryState } from './Victory';

function findSpell(spellId: string) {
  return [...SUSIE_MAGIC, ...RALSEI_MAGIC].find((s) => s.id === spellId) ?? null;
}

/**
 * Resolves everyone's ITEM/ACT/MAGIC/DEFEND/SPARE choices (Kris -> Susie ->
 * Ralsei order), BEFORE FIGHT (SPEC.md Stage 4 turn order), narrating each
 * with the shared DialogueRunner. FIGHT itself is untouched here — it's
 * ResolveFightState's job, reading the same battle.actions.
 */
export class ResolveNonFightState implements GameState<GameContext> {
  readonly name = 'ResolveNonFight';
  private readonly runner = new DialogueRunner();
  private readonly portraits = new PortraitCache();
  private nextState: GameState<GameContext> = new ResolveFightState();

  enter(ctx: GameContext): void {
    const pages = this.applyEffectsAndCollectNarration(ctx);

    if (ctx.battle.spamtonHp <= 0) {
      const endingPages = ctx.dialogueData?.endings.victory_fight ?? [];
      this.runner.start([...pages, ...endingPages], () => ctx.goto(new VictoryState('fight')));
      return;
    }
    if (ctx.battle.mercyPercent >= 100) {
      const endingPages = ctx.dialogueData?.wires.all_cut_ending ?? [];
      this.runner.start([...pages, ...endingPages], () => ctx.goto(new VictoryState('wires')));
      return;
    }

    this.nextState = new ResolveFightState();
    if (pages.length === 0) {
      ctx.goto(this.nextState);
      return;
    }
    this.runner.start(pages, () => ctx.goto(this.nextState));
  }

  private applyEffectsAndCollectNarration(ctx: GameContext): DialoguePage[] {
    const b = ctx.battle;
    const data = ctx.dialogueData;
    const pages: DialoguePage[] = [];

    for (const id of PARTY_ORDER) {
      const action = b.actions[id];
      if (!action) continue;
      const name = PARTY_CONFIG[id].displayName;

      switch (action.type) {
        case 'defend': {
          b.defendedThisRound[id] = true;
          b.tp = clampTp(b.tp + DEFEND_CONFIG.tpGain);
          pages.push({ speaker: 'system', text: `* ${name} защищается! (+${DEFEND_CONFIG.tpGain} TP)` });
          break;
        }
        case 'item': {
          pages.push({ speaker: 'system', text: '* Инвентарь пуст — предметы появятся на отдельном этапе.' });
          break;
        }
        case 'spare': {
          pages.push(...(data?.battle.spare_fail ?? []));
          break;
        }
        case 'act': {
          if (action.option === 'check') {
            pages.push({ speaker: 'system', text: data?.battle.check_neo ?? '* ???' });
          } else if (action.option === 'snap') {
            b.mercyPercent = clampMercy(b.mercyPercent + MERCY_CONFIG.gainPerSnap);
            b.manualSnapCount += 1;
            pages.push(...(data?.battle.act_snap ?? []));
          } else if (action.option === 'snapAll') {
            b.mercyPercent = clampMercy(b.mercyPercent + MERCY_CONFIG.gainPerSnapAll);
            pages.push(...(data?.battle.snap_all ?? []));
          }
          break;
        }
        case 'magic': {
          const spell = findSpell(action.spellId);
          if (!spell) break;
          b.tp = clampTp(b.tp - spell.tpCost);
          if (spell.kind === 'damage') {
            b.spamtonHp = Math.max(0, b.spamtonHp - spell.power);
            pages.push({ speaker: 'system', text: `* ${name} casts ${spell.displayName}! SPAMTON NEO took ${spell.power} damage!` });
          } else if (spell.kind === 'heal') {
            for (const memberId of PARTY_ORDER) {
              const member = b.party[memberId];
              member.hp = Math.min(PARTY_CONFIG[memberId].maxHp, member.hp + spell.power);
              if (member.isDown && member.hp > 0) member.isDown = false;
            }
            pages.push({ speaker: 'system', text: `* ${name} casts ${spell.displayName}! Party healed ${spell.power} HP.` });
          } else if (spell.kind === 'support') {
            b.pacifyDamageReductionPercent = PACIFY_CONFIG.damageReductionPercent;
            pages.push({ speaker: 'system', text: `* ${name} casts ${spell.displayName}!` });
          } else if (spell.kind === 'mercy') {
            b.mercyPercent = clampMercy(b.mercyPercent + MERCY_CONFIG.gainPerXAction);
            const flavor = spell.id === 's_action' ? data?.battle.act_s_action : data?.battle.act_r_action;
            pages.push(...(flavor ?? []));
          }
          break;
        }
        case 'fight':
        case 'skippedDown':
        case 'skippedBySnapAll':
          break;
      }

      if (SPAMTON_NEO_CONFIG.maxHp > 0 && b.spamtonHp <= 0) break;
      if (b.mercyPercent >= 100) break;
    }

    return pages;
  }

  update(ctx: GameContext, dt: number): void {
    if (ctx.input.justPressed('confirm')) this.runner.advance();
    if (ctx.input.justPressed('cancel')) this.runner.revealInstantly();
    this.runner.update(dt, ctx.sfxBlip);
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);
    drawTpBar(g, ctx);
    // Party panel is intentionally hidden here — it would overlap the
    // bottom dialogue box (see dialogueUi.ts's fixed BOX_Y/BOX_H); it's
    // shown again as soon as we leave this brief narration phase.

    const speaker = this.runner.currentSpeaker() ?? 'system';
    drawDialogueBox(g, {
      speaker,
      text: this.runner.currentDisplayText(),
      pageComplete: this.runner.isPageComplete(),
      portrait: speaker === 'system' ? null : this.portraits.get(ctx.assets, speaker)
    });
  }
}
