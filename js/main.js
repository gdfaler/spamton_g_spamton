// Main state machine + fixed-timestep (60Hz) game loop wiring all the
// other modules (audio, dialogue, heart, patterns, boss, ui) together.
(function () {
  const Util = SG.Util;
  const UI = SG.UI;
  const P = SG.Patterns;
  const D = SG.Dialogue;

  const CANVAS_W = 960, CANVAS_H = 640;
  const BASE_BOX = { x: 280, y: 285, w: 400, h: 180 };
  const PARTY_MAX_HP = 300;
  const ACT_OPTIONS = ['CHECK', 'FLATTER', 'HAGGLE', 'UNPLUG'];
  const FLATTER_LINES = [
    'You tell SPAMTON his SALES PITCH is incredible.\nSPAMTON: heh... HEH... flattery gets you NOWHERE!\n(...but he seems pleased.)',
    "You compliment his HAT.\nSPAMTON: This old thing? It's practically a CROWN."
  ];
  const HAGGLE_LINES = [
    "You try to haggle for your life.\nSPAMTON: Everything's ALREADY on sale, kid! Final offer!",
    'You offer him literally anything.\nSPAMTON: [ERROR] ... I only accept SOULS as payment.'
  ];
  const UNPLUG_LINES = [
    "You look around for a plug to pull.\nThere isn't one. Not anymore.",
    'You search for an OFF switch.\nSPAMTON NEO was never plugged in to begin with.'
  ];
  const ITEMS_DEFAULT = () => ([
    { name: 'BANDAGE', desc: 'Heals 30 HP', heal: 30, qty: 2 },
    { name: 'ENERGY DRINK', desc: 'Heals 60 HP', heal: 60, qty: 1 }
  ]);

  const Game = {
    canvas: null, ctx: null,
    state: 'BOOT',
    t: 0,
    keysDown: {},
    boss: null,
    heart: null,
    bullets: [],
    box: { ...BASE_BOX },
    partyHP: PARTY_MAX_HP,
    partyMaxHP: PARTY_MAX_HP,
    items: ITEMS_DEFAULT(),
    menuIndex: 0,
    actIndex: 0,
    itemIndex: 0,
    turnTimer: 0,
    turnDuration: 0,
    turnUpdaters: [],
    turnPhase: 0,
    fight: { pos: 0, dir: 1, speed: 700, barW: 560, targetX: 0, targetW: 90 },
    hitFlash: 0,
    shake: 0,
    lastDamage: null,
    rects: {},
    showFps: false,
    fpsSmooth: 60,
    invincibleFlag: false,
    endingReason: null,

    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = CANVAS_W;
      this.canvas.height = CANVAS_H;
      this.bindInput();
      this.boss = new SG.Boss();
      this.heart = new SG.Heart(this.box);
      requestAnimationFrame(this.loop.bind(this));
    },

    // ---------------------------------------------------------------- input
    bindInput() {
      window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
        SG.Audio.unlock();
        if (!this.keysDown[k]) this.onKeyPress(k);
        this.keysDown[k] = true;
      });
      window.addEventListener('keyup', (e) => {
        this.keysDown[e.key.toLowerCase()] = false;
      });
      this.canvas.addEventListener('mousedown', (e) => {
        SG.Audio.unlock();
        const p = this.toCanvasCoords(e);
        this.onClick(p.x, p.y);
      });
      this.canvas.addEventListener('mousemove', (e) => {
        const p = this.toCanvasCoords(e);
        this.mouse = p;
      });
      this.canvas.addEventListener('touchstart', (e) => {
        SG.Audio.unlock();
        const t = e.touches[0];
        const p = this.toCanvasCoords(t);
        this.onClick(p.x, p.y);
        this._touchDrag = true;
        e.preventDefault();
      }, { passive: false });
      this.canvas.addEventListener('touchmove', (e) => {
        if (this.state === 'BULLET_PHASE' && this._touchDrag) {
          const t = e.touches[0];
          const p = this.toCanvasCoords(t);
          this.heart.x = Util.clamp(p.x, this.box.x + this.heart.r, this.box.x + this.box.w - this.heart.r);
          this.heart.y = Util.clamp(p.y, this.box.y + this.heart.r, this.box.y + this.box.h - this.heart.r);
        }
        e.preventDefault();
      }, { passive: false });
      this.canvas.addEventListener('touchend', () => { this._touchDrag = false; });
    },

    toCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = CANVAS_W / rect.width;
      const sy = CANVAS_H / rect.height;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    },

    pointInRect(x, y, r) {
      return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    },

    onClick(x, y) {
      if (this.pointInRect(x, y, this.rects.skip)) { D.skipAll(); return; }
      if (D.isActive()) { D.advance(); return; }
      if (this.state === 'BOOT') {
        if (this.pointInRect(x, y, this.rects.start)) this.startIntro();
        return;
      }
      if (this.state === 'MENU') {
        (this.rects.menu || []).forEach((r, i) => {
          if (r.enabled && this.pointInRect(x, y, r)) this.selectMenu(i);
        });
        return;
      }
      if (this.state === 'ACT_MENU') {
        (this.rects.list || []).forEach((r, i) => {
          if (this.pointInRect(x, y, r)) this.selectAct(i);
        });
        return;
      }
      if (this.state === 'ITEM_MENU') {
        (this.rects.list || []).forEach((r, i) => {
          if (this.pointInRect(x, y, r)) this.selectItem(i);
        });
        return;
      }
      if (this.state === 'FIGHT_AIM') { this.resolveFightHit(); return; }
      if (this.state === 'GAME_OVER') {
        if (this.pointInRect(x, y, this.rects.retry)) this.retryBattle();
        return;
      }
      if (this.state === 'VICTORY') {
        if (this.pointInRect(x, y, this.rects.again)) this.restartToTitle();
        return;
      }
    },

    onKeyPress(k) {
      if (k === 'f') { this.showFps = !this.showFps; return; }
      if (D.isActive()) {
        if (k === 'escape') { D.skipAll(); return; }
        if (['z', 'enter', ' ', 'x'].includes(k)) { D.advance(); return; }
        return;
      }
      switch (this.state) {
        case 'BOOT':
          if (['z', 'enter', ' '].includes(k)) this.startIntro();
          break;
        case 'MENU':
          if (k === 'arrowleft' || k === 'a') { this.menuIndex = (this.menuIndex + 3) % 4; SG.Audio.SFX.move(); }
          if (k === 'arrowright' || k === 'd') { this.menuIndex = (this.menuIndex + 1) % 4; SG.Audio.SFX.move(); }
          if (['z', 'enter', ' '].includes(k)) this.selectMenu(this.menuIndex);
          break;
        case 'ACT_MENU':
          if (k === 'arrowup' || k === 'w') { this.actIndex = (this.actIndex + ACT_OPTIONS.length - 1) % ACT_OPTIONS.length; SG.Audio.SFX.move(); }
          if (k === 'arrowdown' || k === 's') { this.actIndex = (this.actIndex + 1) % ACT_OPTIONS.length; SG.Audio.SFX.move(); }
          if (['z', 'enter', ' '].includes(k)) this.selectAct(this.actIndex);
          if (k === 'x' || k === 'escape') this.backToMenu();
          break;
        case 'ITEM_MENU':
          if (k === 'arrowup' || k === 'w') { this.itemIndex = (this.itemIndex + this.items.length - 1) % Math.max(1, this.items.length); SG.Audio.SFX.move(); }
          if (k === 'arrowdown' || k === 's') { this.itemIndex = (this.itemIndex + 1) % Math.max(1, this.items.length); SG.Audio.SFX.move(); }
          if (['z', 'enter', ' '].includes(k)) this.selectItem(this.itemIndex);
          if (k === 'x' || k === 'escape') this.backToMenu();
          break;
        case 'FIGHT_AIM':
          if (['z', 'enter', ' '].includes(k)) this.resolveFightHit();
          break;
        case 'GAME_OVER':
          if (['z', 'enter', ' '].includes(k)) this.retryBattle();
          break;
        case 'VICTORY':
          if (['z', 'enter', ' '].includes(k)) this.restartToTitle();
          break;
      }
    },

    // -------------------------------------------------------------- states
    startIntro() {
      this.state = 'INTRO';
      SG.Audio.startMusic();
      D.start(D.INTRO_PAGES, () => this.enterMenu());
    },

    enterMenu() {
      this.state = 'MENU';
      this.menuIndex = 0;
      this.bullets = [];
    },

    selectMenu(i) {
      const label = ['FIGHT', 'ACT', 'ITEM', 'MERCY'][i];
      SG.Audio.SFX.confirm();
      if (label === 'FIGHT') return this.startFight();
      if (label === 'ACT') { this.state = 'ACT_MENU'; this.actIndex = 0; return; }
      if (label === 'ITEM') { this.state = 'ITEM_MENU'; this.itemIndex = 0; return; }
      if (label === 'MERCY') {
        if (!this.boss.spareable) { SG.Audio.SFX.cancel(); return; }
        return this.startSpare();
      }
    },

    backToMenu() {
      SG.Audio.SFX.cancel();
      this.state = 'MENU';
    },

    startFight() {
      this.state = 'FIGHT_AIM';
      this.fight.pos = 0;
      this.fight.dir = 1;
      this.fight.targetX = Util.rand(40, this.fight.barW - this.fight.targetW - 40);
    },

    resolveFightHit() {
      const f = this.fight;
      const center = f.targetX + f.targetW / 2;
      const dist = Math.abs(f.pos - center);
      let dmg, tier;
      if (dist < 8) { dmg = Util.rand(300, 340); tier = 'PERFECT!'; }
      else if (dist < 25) { dmg = Util.rand(180, 240); tier = 'GREAT HIT!'; }
      else if (dist < 45) { dmg = Util.rand(100, 150); tier = 'HIT!'; }
      else { dmg = Util.rand(20, 45); tier = '...'; }
      dmg = Math.round(dmg);
      SG.Audio.SFX.hit();
      this.hitFlash = 0.25;
      this.shake = 6;
      this.boss.takeDamage(dmg);
      const pages = [{ speaker: 'FIGHT', text: `${tier}\n* SPAMTON NEO took ${dmg} damage!` }];
      if (this.boss.defeated) {
        this.state = 'DIALOGUE_LOCK';
        SG.Audio.stopMusic();
        D.start(pages.concat(D.DEFEAT_SEQUENCE), () => this.toVictory('defeated'));
      } else {
        this.state = 'DIALOGUE_LOCK';
        pages.push({ speaker: this.boss.name, text: this.boss.randomHurtLine() });
        D.start(pages, () => this.startBulletPhase());
      }
    },

    selectAct(i) {
      SG.Audio.SFX.confirm();
      const label = ACT_OPTIONS[i];
      let pages;
      if (label === 'CHECK') pages = [{ speaker: 'CHECK', text: D.CHECK_TEXT }];
      else if (label === 'FLATTER') pages = [{ speaker: 'ACT', text: Util.pick(FLATTER_LINES) }];
      else if (label === 'HAGGLE') pages = [{ speaker: 'ACT', text: Util.pick(HAGGLE_LINES) }];
      else pages = [{ speaker: 'ACT', text: Util.pick(UNPLUG_LINES) }];
      this.state = 'DIALOGUE_LOCK';
      D.start(pages, () => this.startBulletPhase());
    },

    selectItem(i) {
      const item = this.items[i];
      if (!item || item.qty <= 0) { SG.Audio.SFX.cancel(); return; }
      SG.Audio.SFX.confirm();
      item.qty--;
      this.partyHP = Util.clamp(this.partyHP + item.heal, 0, this.partyMaxHP);
      SG.Audio.SFX.heal();
      const pages = [{ speaker: 'ITEM', text: `You used the ${item.name}!\nRestored ${item.heal} HP.` }];
      this.state = 'DIALOGUE_LOCK';
      D.start(pages, () => this.startBulletPhase());
    },

    startSpare() {
      SG.Audio.SFX.spare();
      this.state = 'DIALOGUE_LOCK';
      D.start(D.SPARE_SEQUENCE, () => this.toVictory('spared'));
    },

    toVictory(reason) {
      this.endingReason = reason;
      this.state = 'VICTORY';
      SG.Audio.stopMusic();
    },

    startBulletPhase() {
      const turn = this.boss.buildTurn();
      this.turnDuration = turn.duration;
      this.turnUpdaters = turn.updaters;
      this.turnPhase = turn.phase;
      this.turnTimer = 0;
      this.bullets = [];
      this.box = this.computeBox(this.turnPhase, 0);
      this.heart.reset(this.box);
      this.state = 'BULLET_PHASE';
    },

    computeBox(phase, t) {
      const b = BASE_BOX;
      if (phase === 0) return { ...b };
      if (phase === 1) return { x: b.x + 10, y: b.y + 5, w: b.w - 20, h: b.h - 10 };
      if (phase === 2) return { x: b.x + 40, y: b.y + 15, w: b.w - 80, h: b.h - 30 };
      const factor = 0.85 + 0.15 * Math.sin(t * 2);
      const w = b.w * factor - 60, h = b.h * factor - 15;
      return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h };
    },

    endBulletPhase() {
      this.boss.turnCount++;
      if (this.boss.turnCount % 2 === 0) {
        this.state = 'DIALOGUE_LOCK';
        D.start([{ speaker: this.boss.name, text: this.boss.randomTaunt() }], () => this.enterMenu());
      } else {
        this.enterMenu();
      }
    },

    damagePlayer(dmg) {
      this.partyHP = Math.max(0, this.partyHP - dmg);
      this.shake = 8;
      SG.Audio.SFX.damage();
      if (this.partyHP <= 0) {
        this.state = 'DIALOGUE_LOCK';
        SG.Audio.stopMusic();
        D.start(D.GAME_OVER_LINES.map(t => ({ speaker: this.boss.name, text: t })), () => { this.state = 'GAME_OVER'; });
      }
    },

    retryBattle() {
      this.boss = new SG.Boss();
      this.partyHP = this.partyMaxHP;
      this.items = ITEMS_DEFAULT();
      this.bullets = [];
      SG.Audio.startMusic();
      this.enterMenu();
    },

    restartToTitle() {
      this.boss = new SG.Boss();
      this.partyHP = this.partyMaxHP;
      this.items = ITEMS_DEFAULT();
      this.bullets = [];
      this.state = 'BOOT';
    },

    // -------------------------------------------------------------- update
    update(dt) {
      this.t += dt;
      D.update(dt * 1000);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);

      if (this.state === 'FIGHT_AIM') {
        const f = this.fight;
        f.pos += f.dir * f.speed * dt;
        if (f.pos < 0) { f.pos = 0; f.dir = 1; }
        if (f.pos > f.barW) { f.pos = f.barW; f.dir = -1; }
      }

      if (this.state === 'BULLET_PHASE') {
        this.turnTimer += dt;
        this.box = this.computeBox(this.turnPhase, this.turnTimer);
        this.turnUpdaters.forEach(p => p.update(dt, this.turnTimer, this.box, (b) => this.bullets.push(b), this.heart));
        this.heart.update(dt, this.keysDown, this.box);
        for (const b of this.bullets) {
          if (b.dead) continue;
          b.update(dt, this.box);
          if (!this.heart.isInvincible() && P.collideBullet(b, this.heart)) {
            this.heart.hit(b.dmg, (d) => this.damagePlayer(d));
          }
        }
        this.bullets = this.bullets.filter(b => !b.dead);
        if (this.turnTimer >= this.turnDuration && this.state === 'BULLET_PHASE') {
          this.endBulletPhase();
        }
      }
    },

    // -------------------------------------------------------------- render
    render() {
      const ctx = this.ctx;
      UI.drawBackground(ctx, CANVAS_W, CANVAS_H, this.t);
      this.rects = {};

      if (this.state === 'BOOT') {
        this.renderTitle();
        return;
      }

      ctx.save();
      if (this.shake > 0) ctx.translate(Util.rand(-this.shake, this.shake), Util.rand(-this.shake, this.shake));

      const glitchy = this.state === 'BULLET_PHASE' && this.turnPhase >= 2;
      UI.drawBoss(ctx, this.boss, CANVAS_W / 2, 175, this.t, this.hitFlash, glitchy);
      UI.drawBossHPBar(ctx, this.boss, 40, 60, 300, 20);
      UI.drawPartyBar(ctx, 40, CANVAS_H - 128, 190, 20, this.partyHP, this.partyMaxHP, 'KRIS', this.heart.isInvincible());

      if (this.state === 'MENU') {
        const enabled = { MERCY: this.boss.spareable };
        this.rects.menu = UI.drawMenu(ctx, 40, CANVAS_H - 90, CANVAS_W - 80, 46, ['FIGHT', 'ACT', 'ITEM', 'MERCY'], this.menuIndex, enabled);
      } else if (this.state === 'ACT_MENU') {
        this.rects.list = UI.drawList(ctx, 60, 295, 300, 36, ACT_OPTIONS, this.actIndex);
        UI.drawCenteredTitle(ctx, CANVAS_W, 275, '* ACT', 18, '#ffe14d');
      } else if (this.state === 'ITEM_MENU') {
        const labels = this.items.map(it => it.qty > 0 ? `${it.name} x${it.qty}` : `${it.name} (none)`);
        if (labels.length === 0) labels.push('(no items)');
        this.rects.list = UI.drawList(ctx, 60, 295, 320, 36, labels, this.itemIndex);
        UI.drawCenteredTitle(ctx, CANVAS_W, 275, '* ITEM', 18, '#ffe14d');
      } else if (this.state === 'FIGHT_AIM') {
        UI.drawFightBar(ctx, (CANVAS_W - this.fight.barW) / 2, 400, this.fight.barW, 34, this.fight.pos, this.fight.targetX, this.fight.targetW);
        UI.drawCenteredTitle(ctx, CANVAS_W, 380, 'PRESS Z / SPACE TO ATTACK', 16, '#fff');
      } else if (this.state === 'BULLET_PHASE') {
        UI.drawBattleBox(ctx, this.box, this.turnPhase >= 2 ? 2 : 0);
        this.bullets.forEach(b => UI.drawBullet(ctx, b));
        UI.drawHeart(ctx, this.heart);
      } else if (this.state === 'GAME_OVER') {
        UI.drawCenteredTitle(ctx, CANVAS_W, 300, 'GAME OVER', 48, '#ff3355');
        UI.drawCenteredTitle(ctx, CANVAS_W, 340, 'click / press Z to retry', 16, '#fff');
        this.rects.retry = { x: CANVAS_W / 2 - 90, y: 370, w: 180, h: 44 };
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(this.rects.retry.x, this.rects.retry.y, this.rects.retry.w, this.rects.retry.h);
        UI.drawCenteredTitle(ctx, CANVAS_W, this.rects.retry.y + 29, 'RETRY', 20, '#fff');
      } else if (this.state === 'VICTORY') {
        UI.drawCenteredTitle(ctx, CANVAS_W, 290, this.endingReason === 'spared' ? 'YOU SPARED SPAMTON NEO' : 'SPAMTON NEO WAS DEFEATED', 26, '#ffe14d');
        UI.drawCenteredTitle(ctx, CANVAS_W, 330, 'VICTORY!', 42, '#5bffb0');
        UI.drawCenteredTitle(ctx, CANVAS_W, 380, 'click / press Z to play again', 16, '#fff');
        this.rects.again = { x: CANVAS_W / 2 - 110, y: 400, w: 220, h: 44 };
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(this.rects.again.x, this.rects.again.y, this.rects.again.w, this.rects.again.h);
        UI.drawCenteredTitle(ctx, CANVAS_W, this.rects.again.y + 29, 'PLAY AGAIN', 20, '#fff');
      }

      ctx.restore();

      if (D.isActive() || this.state === 'DIALOGUE_LOCK') {
        const d = D.getDisplay();
        UI.drawDialogueBox(ctx, CANVAS_W, CANVAS_H, d.speaker, d.text, d.complete, d.hasMore, this.state === 'INTRO');
      }
      if (this.state === 'INTRO') {
        this.rects.skip = UI.drawSkipButton(ctx, CANVAS_W, CANVAS_H, this.pointInRect((this.mouse || {}).x, (this.mouse || {}).y, { x: CANVAS_W - 174, y: 24, w: 150, h: 40 }));
      }

      if (this.showFps) {
        ctx.save();
        ctx.fillStyle = '#5bffb0';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`FPS: ${this.fpsSmooth.toFixed(0)}`, 8, 16);
        ctx.restore();
      }
    },

    renderTitle() {
      const ctx = this.ctx;
      UI.drawCenteredTitle(ctx, CANVAS_W, 200, '★ SPAMTON NEO ★', 44, '#ffe14d');
      UI.drawCenteredTitle(ctx, CANVAS_W, 250, 'a fan-made boss battle clone', 16, '#aaa');
      UI.drawCenteredTitle(ctx, CANVAS_W, 400, 'ARROWS/WASD move · Z/ENTER/SPACE confirm · X/ESC cancel', 14, '#fff');
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      const r = { x: CANVAS_W / 2 - 100, y: 440, w: 200, h: 54 };
      this.rects.start = r;
      UI.roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe14d';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('START', CANVAS_W / 2, r.y + 35);
      ctx.textAlign = 'left';
      ctx.restore();
    },

    // ------------------------------------------------------------ main loop
    loop(now) {
      requestAnimationFrame(this.loop.bind(this));
      if (!this._last) this._last = now;
      let dt = now - this._last;
      this._last = now;
      if (dt > 250) dt = 250;
      const instFps = 1000 / Math.max(dt, 1);
      this.fpsSmooth += (instFps - this.fpsSmooth) * 0.1;

      this._acc = (this._acc || 0) + dt;
      const STEP = 1000 / 60;
      let steps = 0;
      while (this._acc >= STEP && steps < 5) {
        this.update(STEP / 1000);
        this._acc -= STEP;
        steps++;
      }
      this.render();
    }
  };

  window.SG.Game = Game;
  window.addEventListener('DOMContentLoaded', () => Game.init());
})();
