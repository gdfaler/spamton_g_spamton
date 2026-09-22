// Persistent battle UI: party panel (bottom), vertical TP bar (left), and
// the enemy target-select list (Deltarune-style HP%/MERCY% bars). Drawn
// from multiple states, so it lives here rather than inside any one of
// them.
import type { GameContext } from './context';
import { PARTY_CONFIG, PARTY_ORDER, type PartyMemberId, TP_CONFIG } from '../config/party';
import { SPAMTON_NEO_CONFIG } from '../config/party';
import { ENEMIES } from '../config/enemies';
import type { PortraitCache } from './portraits';

const PANEL_Y = 392;
const PANEL_H = 78;
const PANEL_SLOT_W = 202;
const PANEL_RAISE = 12;

export function drawPartyPanel(
  g: CanvasRenderingContext2D,
  ctx: GameContext,
  portraits: PortraitCache,
  activeId: PartyMemberId | null
): void {
  PARTY_ORDER.forEach((id, i) => {
    const cfg = PARTY_CONFIG[id];
    const state = ctx.battle.party[id];
    const isActive = id === activeId;
    const x = 16 + i * PANEL_SLOT_W;
    const y = PANEL_Y - (isActive ? PANEL_RAISE : 0);

    g.save();
    g.fillStyle = state.isDown ? '#1a0a0a' : '#0a0a12';
    g.strokeStyle = isActive ? '#ffe14d' : '#555555';
    g.lineWidth = isActive ? 3 : 2;
    g.fillRect(x, y, PANEL_SLOT_W - 10, PANEL_H);
    g.strokeRect(x, y, PANEL_SLOT_W - 10, PANEL_H);

    const portrait = portraits.get(ctx.assets, id);
    g.globalAlpha = state.isDown ? 0.4 : 1;
    g.drawImage(portrait.source, x + 8, y + 8, 40, 40);
    g.globalAlpha = 1;

    g.fillStyle = isActive ? '#ffe14d' : '#ffffff';
    g.font = 'bold 13px monospace';
    g.fillText(cfg.displayName, x + 56, y + 20);

    if (state.isDown) {
      g.fillStyle = '#ff5b5b';
      g.font = 'bold 12px monospace';
      g.fillText('DOWN', x + 56, y + 38);
    } else {
      g.fillStyle = '#ffffff';
      g.font = '12px monospace';
      g.fillText(`HP ${Math.max(0, state.hp)}/${cfg.maxHp}`, x + 56, y + 38);
    }

    // HP bar
    const barX = x + 56;
    const barY = y + 46;
    const barW = PANEL_SLOT_W - 10 - 64;
    const ratio = Math.max(0, state.hp) / cfg.maxHp;
    g.fillStyle = '#3a0000';
    g.fillRect(barX, barY, barW, 8);
    g.fillStyle = ratio > 0.3 ? '#5bffb0' : '#ff3355';
    g.fillRect(barX, barY, barW * Math.min(1, ratio), 8);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    g.strokeRect(barX, barY, barW, 8);

    g.restore();
  });
}

const TP_BAR_X = 10;
const TP_BAR_Y = 50;
const TP_BAR_W = 20;
const TP_BAR_H = 260;

export function drawTpBar(g: CanvasRenderingContext2D, ctx: GameContext): void {
  g.save();
  g.fillStyle = '#ffffff';
  g.font = 'bold 12px monospace';
  g.textAlign = 'center';
  g.fillText('TP', TP_BAR_X + TP_BAR_W / 2, TP_BAR_Y - 8);

  g.fillStyle = '#001a12';
  g.fillRect(TP_BAR_X, TP_BAR_Y, TP_BAR_W, TP_BAR_H);
  const ratio = ctx.battle.tp / TP_CONFIG.max;
  const fillH = TP_BAR_H * ratio;
  g.fillStyle = '#5bffb0';
  g.fillRect(TP_BAR_X, TP_BAR_Y + TP_BAR_H - fillH, TP_BAR_W, fillH);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 2;
  g.strokeRect(TP_BAR_X, TP_BAR_Y, TP_BAR_W, TP_BAR_H);

  g.fillStyle = '#ffffff';
  g.font = '11px monospace';
  g.fillText(`${Math.round(ratio * 100)}%`, TP_BAR_X + TP_BAR_W / 2, TP_BAR_Y + TP_BAR_H + 16);
  g.textAlign = 'left';
  g.restore();
}

export function drawEnemyTargetList(g: CanvasRenderingContext2D, ctx: GameContext, selectedIndex: number): void {
  const startY = 150;
  const rowH = 64;
  const x = 90;
  const w = 460;

  g.save();
  g.fillStyle = '#ffe14d';
  g.font = 'bold 14px monospace';
  g.fillText('* выберите цель', x, startY - 16);

  ENEMIES.forEach((enemy, i) => {
    const y = startY + i * rowH;
    const isSel = i === selectedIndex;
    g.fillStyle = isSel ? '#1a1a2e' : '#0a0a12';
    g.strokeStyle = isSel ? '#ffe14d' : '#555555';
    g.lineWidth = isSel ? 3 : 2;
    g.fillRect(x, y, w, rowH - 10);
    g.strokeRect(x, y, w, rowH - 10);

    g.fillStyle = isSel ? '#ffe14d' : '#ffffff';
    g.font = 'bold 15px monospace';
    g.fillText(enemy.displayName, x + 14, y + 20);

    const hpRatio = Math.max(0, ctx.battle.spamtonHp) / SPAMTON_NEO_CONFIG.maxHp;
    g.fillStyle = '#ffffff';
    g.font = '11px monospace';
    g.fillText('HP', x + 14, y + 38);
    g.fillStyle = '#3a0000';
    g.fillRect(x + 40, y + 30, 180, 10);
    g.fillStyle = '#ff5b5b';
    g.fillRect(x + 40, y + 30, 180 * hpRatio, 10);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    g.strokeRect(x + 40, y + 30, 180, 10);

    const mercyRatio = ctx.battle.mercyPercent / 100;
    g.fillStyle = '#ffffff';
    g.font = '11px monospace';
    g.fillText('MERCY', x + 240, y + 38);
    g.fillStyle = '#1a1a00';
    g.fillRect(x + 300, y + 30, 140, 10);
    g.fillStyle = '#ffe14d';
    g.fillRect(x + 300, y + 30, 140 * mercyRatio, 10);
    g.strokeStyle = '#ffffff';
    g.strokeRect(x + 300, y + 30, 140, 10);
  });
  g.restore();
}

export function drawActionList(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  itemHeight: number,
  items: { label: string; disabled?: boolean; hint?: string }[],
  selectedIndex: number
): void {
  items.forEach((item, i) => {
    const iy = y + i * (itemHeight + 8);
    const isSel = i === selectedIndex;
    g.save();
    g.fillStyle = isSel ? '#1a1a2e' : '#0a0a12';
    g.strokeStyle = isSel ? '#ffe14d' : item.disabled ? '#333333' : '#666666';
    g.lineWidth = isSel ? 3 : 2;
    g.fillRect(x, iy, width, itemHeight);
    g.strokeRect(x, iy, width, itemHeight);
    g.fillStyle = item.disabled ? '#555555' : isSel ? '#ffe14d' : '#ffffff';
    g.font = '15px monospace';
    g.fillText(item.label, x + 14, iy + itemHeight / 2 + 5);
    g.restore();
  });

  const hint = items[selectedIndex]?.hint;
  if (hint) {
    g.save();
    g.fillStyle = '#5bffb0';
    g.font = '12px monospace';
    g.fillText(hint, x, y + items.length * (itemHeight + 8) + 14);
    g.restore();
  }
}
