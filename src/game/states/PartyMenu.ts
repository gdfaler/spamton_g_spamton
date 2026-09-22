import type { GameState } from '../../core/stateMachine';
import type { GameContext, ActionChoice } from '../context';
import { PARTY_CONFIG, PARTY_ORDER, type PartyMemberId, DOWN_CONFIG } from '../../config/party';
import { SUSIE_MAGIC, RALSEI_MAGIC } from '../../config/magic';
import { ENEMIES } from '../../config/enemies';
import { isSnapAllUnlocked } from '../mercyRules';
import { PortraitCache } from '../portraits';
import { drawPartyPanel, drawTpBar, drawEnemyTargetList, drawActionList } from '../battleUi';
import { ResolveNonFightState } from './ResolveNonFight';

type Phase = 'chooseAction' | 'actSubmenu' | 'magicSubmenu' | 'fightTarget';

const ACT_ITEMS = ['CHECK', 'SNAP', 'SNAP ALL'] as const;

function actionMenuLabels(id: PartyMemberId): string[] {
  const middle = id === 'kris' ? 'ACT' : 'MAGIC';
  return ['FIGHT', middle, 'ITEM', 'DEFEND', 'SPARE'];
}

function magicListFor(id: PartyMemberId) {
  return id === 'susie' ? SUSIE_MAGIC : RALSEI_MAGIC;
}

/**
 * Real per-character battle menu (Stage 4). Kris -> Susie -> Ralsei choose
 * one action each; X backs out of a submenu, or — from the top-level menu
 * — undoes the PREVIOUS character's choice and returns to them (SPEC.md
 * Stage 4: "X в меню — назад, в т.ч. отмена выбора предыдущего
 * персонажа"). DOWN party members are skipped automatically in both
 * directions and regain HP at the start of this state (start of a new
 * round), per SPEC.md's DOWN-state rules.
 */
export class PartyMenuState implements GameState<GameContext> {
  readonly name = 'PartyMenu';
  private readonly portraits = new PortraitCache();
  private phase: Phase = 'chooseAction';
  private characterIndex = 0;
  private cursor = 0;

  enter(ctx: GameContext): void {
    const b = ctx.battle;
    for (const id of PARTY_ORDER) b.actions[id] = null;
    b.defendedThisRound = {};
    b.pacifyDamageReductionPercent = 0;

    for (const id of PARTY_ORDER) {
      const member = b.party[id];
      if (member.isDown) {
        member.hp += DOWN_CONFIG.hpRegenPerRound;
        if (member.hp > 0) {
          member.isDown = false;
        } else {
          b.actions[id] = { type: 'skippedDown' };
        }
      }
    }

    const first = this.findActingIndex(ctx, 0, 1);
    if (first === null) {
      // Defensive: shouldn't happen (GameOver would have fired already).
      ctx.goto(new ResolveNonFightState());
      return;
    }
    this.characterIndex = first;
    this.phase = 'chooseAction';
    this.cursor = 0;
  }

  private findActingIndex(ctx: GameContext, from: number, step: 1 | -1): number | null {
    let i = from;
    while (i >= 0 && i < PARTY_ORDER.length) {
      const id = PARTY_ORDER[i]!;
      if (!ctx.battle.party[id].isDown) return i;
      i += step;
    }
    return null;
  }

  private currentId(): PartyMemberId {
    return PARTY_ORDER[this.characterIndex]!;
  }

  private setAction(ctx: GameContext, action: ActionChoice): void {
    ctx.battle.actions[this.currentId()] = action;
  }

  private advance(ctx: GameContext): void {
    const next = this.findActingIndex(ctx, this.characterIndex + 1, 1);
    if (next === null) {
      ctx.goto(new ResolveNonFightState());
      return;
    }
    this.characterIndex = next;
    this.phase = 'chooseAction';
    this.cursor = 0;
  }

  private goBackACharacter(ctx: GameContext): void {
    const prev = this.findActingIndex(ctx, this.characterIndex - 1, -1);
    if (prev === null) return; // already at the first acting character
    ctx.battle.actions[PARTY_ORDER[prev]!] = null;
    this.characterIndex = prev;
    this.phase = 'chooseAction';
    this.cursor = 0;
  }

  update(ctx: GameContext): void {
    const id = this.currentId();
    const up = ctx.input.justPressed('up');
    const down = ctx.input.justPressed('down');
    const confirm = ctx.input.justPressed('confirm');
    const cancel = ctx.input.justPressed('cancel');

    if (this.phase === 'chooseAction') {
      const labels = actionMenuLabels(id);
      if (up) this.cursor = (this.cursor + labels.length - 1) % labels.length;
      if (down) this.cursor = (this.cursor + 1) % labels.length;
      if (cancel) this.goBackACharacter(ctx);
      if (confirm) {
        const choice = labels[this.cursor];
        if (choice === 'FIGHT') {
          this.phase = 'fightTarget';
          this.cursor = 0;
        } else if (choice === 'ACT') {
          this.phase = 'actSubmenu';
          this.cursor = 0;
        } else if (choice === 'MAGIC') {
          this.phase = 'magicSubmenu';
          this.cursor = 0;
        } else if (choice === 'ITEM') {
          this.setAction(ctx, { type: 'item' });
          this.advance(ctx);
        } else if (choice === 'DEFEND') {
          this.setAction(ctx, { type: 'defend' });
          this.advance(ctx);
        } else if (choice === 'SPARE') {
          this.setAction(ctx, { type: 'spare' });
          this.advance(ctx);
        }
      }
      return;
    }

    if (this.phase === 'actSubmenu') {
      if (up) this.cursor = (this.cursor + ACT_ITEMS.length - 1) % ACT_ITEMS.length;
      if (down) this.cursor = (this.cursor + 1) % ACT_ITEMS.length;
      if (cancel) this.phase = 'chooseAction';
      if (confirm) {
        const choice = ACT_ITEMS[this.cursor];
        if (choice === 'SNAP ALL' && !isSnapAllUnlocked(ctx.battle)) return;
        if (choice === 'CHECK') this.setAction(ctx, { type: 'act', option: 'check', targetId: 'spamton_neo' });
        if (choice === 'SNAP') this.setAction(ctx, { type: 'act', option: 'snap', targetId: 'spamton_neo' });
        if (choice === 'SNAP ALL') {
          this.setAction(ctx, { type: 'act', option: 'snapAll', targetId: 'spamton_neo' });
          this.applySnapAllPartyTurnCost(ctx);
          ctx.goto(new ResolveNonFightState());
          return;
        }
        this.advance(ctx);
      }
      return;
    }

    if (this.phase === 'magicSubmenu') {
      const spells = magicListFor(id);
      if (up) this.cursor = (this.cursor + spells.length - 1) % spells.length;
      if (down) this.cursor = (this.cursor + 1) % spells.length;
      if (cancel) this.phase = 'chooseAction';
      if (confirm) {
        const spell = spells[this.cursor]!;
        if (ctx.battle.tp < spell.tpCost) return;
        this.setAction(ctx, { type: 'magic', spellId: spell.id });
        this.advance(ctx);
      }
      return;
    }

    if (this.phase === 'fightTarget') {
      if (up) this.cursor = (this.cursor + ENEMIES.length - 1) % ENEMIES.length;
      if (down) this.cursor = (this.cursor + 1) % ENEMIES.length;
      if (cancel) this.phase = 'chooseAction';
      if (confirm) {
        const target = ENEMIES[this.cursor]!;
        this.setAction(ctx, { type: 'fight', targetId: target.id });
        this.advance(ctx);
      }
    }
  }

  private applySnapAllPartyTurnCost(ctx: GameContext): void {
    if (!isSnapAllUnlocked(ctx.battle)) return; // shouldn't be reachable, defensive
    for (const other of PARTY_ORDER) {
      if (other === this.currentId()) continue;
      if (ctx.battle.actions[other] === null) {
        ctx.battle.actions[other] = { type: 'skippedBySnapAll' };
      }
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);

    const id = this.currentId();
    drawTpBar(g, ctx);
    drawPartyPanel(g, ctx, this.portraits, id);

    g.fillStyle = '#ffe14d';
    g.font = 'bold 15px monospace';
    g.fillText(`ХОД ${ctx.battle.turnNumber} — ${PARTY_CONFIG[id].displayName}`, 90, 60);

    if (this.phase === 'chooseAction') {
      const labels = actionMenuLabels(id).map((label) => ({ label }));
      drawActionList(g, 90, 90, 300, 34, labels, this.cursor);
    } else if (this.phase === 'actSubmenu') {
      const items = ACT_ITEMS.map((label) => ({
        label,
        disabled: label === 'SNAP ALL' && !isSnapAllUnlocked(ctx.battle),
        hint: label === 'SNAP ALL' && !isSnapAllUnlocked(ctx.battle) ? 'ещё не разблокировано' : undefined
      }));
      drawActionList(g, 90, 90, 300, 34, items, this.cursor);
    } else if (this.phase === 'magicSubmenu') {
      const spells = magicListFor(id);
      const items = spells.map((s) => ({
        label: `${s.displayName} (${s.tpCost} TP)`,
        disabled: ctx.battle.tp < s.tpCost
      }));
      drawActionList(g, 90, 90, 320, 34, items, this.cursor);
    } else if (this.phase === 'fightTarget') {
      drawEnemyTargetList(g, ctx, this.cursor);
    }

    g.fillStyle = '#5bffb0';
    g.font = '11px monospace';
    g.textAlign = 'right';
    g.fillText(`FPS: ${ctx.fps.toFixed(0)} | ${ctx.currentStateName()}`, 630, 16);
    g.textAlign = 'left';
  }
}
