// Bullets + attack pattern generators for the Spamton NEO bullet-hell turns.
SG.Patterns = (function () {
  const Util = SG.Util;

  function makeCircleBullet(x, y, vx, vy, r, color, dmg, type) {
    return {
      shape: 'circle', x, y, vx, vy, r, color, dmg, type: type || 'dot',
      age: 0, dead: false, rot: 0,
      update(dt, box) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;
        this.rot += dt * 6;
        const pad = 40;
        if (this.x < box.x - pad || this.x > box.x + box.w + pad ||
          this.y < box.y - pad || this.y > box.y + box.h + pad) {
          this.dead = true;
        }
      }
    };
  }

  function makeRectBullet(x, y, w, h, vx, vy, color, dmg, type) {
    return {
      shape: 'rect', x, y, w, h, vx, vy, color, dmg, type: type || 'string',
      age: 0, dead: false,
      update(dt, box) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.age += dt;
        const pad = 60;
        if (this.x < box.x - this.w - pad || this.x > box.x + box.w + pad ||
          this.y < box.y - this.h - pad || this.y > box.y + box.h + pad) {
          this.dead = true;
        }
      }
    };
  }

  function collideBullet(b, heart) {
    if (b.shape === 'circle') {
      return Util.circleOverlap(b.x, b.y, b.r, heart.x, heart.y, heart.r);
    }
    return Util.circleRectOverlap(heart.x, heart.y, heart.r, b.x, b.y, b.w, b.h);
  }

  // --- Phase 1: Marionette Strings ------------------------------------
  // Vertical strings sweep down through the box with a moving safe gap.
  function StringsPattern() {
    this.timer = 0;
    this.wave = 0;
    this.reset = () => { this.timer = 0; this.wave = 0; };
    this.update = (dt, elapsed, box, spawn) => {
      this.timer += dt;
      const interval = 1.15;
      if (this.timer >= interval) {
        this.timer -= interval;
        this.wave++;
        const cols = 7;
        const colW = box.w / cols;
        const gapCount = 2;
        const gaps = new Set();
        while (gaps.size < gapCount) gaps.add(Util.randInt(0, cols - 1));
        for (let i = 0; i < cols; i++) {
          if (gaps.has(i)) continue;
          const x = box.x + i * colW + colW / 2 - 4;
          spawn(makeRectBullet(x, box.y - 30, 8, box.h + 60, 0, 165, '#ffe14d', 8, 'string'));
        }
      }
    };
  }

  // --- Phase 2: Cursor Barrage ------------------------------------------
  // Little "arrow cursor" bullets fly in aimed at the heart's position
  // at spawn time (not continuously homing - fair & dodgeable).
  function CursorPattern() {
    this.timer = 0;
    this.reset = () => { this.timer = 0; };
    this.update = (dt, elapsed, box, spawn, heart) => {
      this.timer += dt;
      const interval = 0.55;
      if (this.timer >= interval) {
        this.timer -= interval;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const edge = Util.randInt(0, 2); // 0 left,1 right,2 top
          let sx, sy;
          if (edge === 0) { sx = box.x - 20; sy = Util.rand(box.y, box.y + box.h); }
          else if (edge === 1) { sx = box.x + box.w + 20; sy = Util.rand(box.y, box.y + box.h); }
          else { sx = Util.rand(box.x, box.x + box.w); sy = box.y - 20; }
          const tx = heart.x + Util.rand(-30, 30);
          const ty = heart.y + Util.rand(-30, 30);
          const ang = Math.atan2(ty - sy, tx - sx);
          const spd = Util.rand(140, 190);
          spawn(makeCircleBullet(sx, sy, Math.cos(ang) * spd, Math.sin(ang) * spd, 8, '#4dd2ff', 9, 'cursor'));
        }
      }
    };
  }

  // --- Phase 3: Glitch Swarm ----------------------------------------------
  // Dense small bullets raining down, screen glitches, box jitters.
  function GlitchSwarmPattern() {
    this.timer = 0;
    this.reset = () => { this.timer = 0; };
    this.update = (dt, elapsed, box, spawn) => {
      this.timer += dt;
      const interval = 0.09;
      if (this.timer >= interval) {
        this.timer -= interval;
        const x = Util.rand(box.x + 5, box.x + box.w - 5);
        const speed = Util.rand(130, 260);
        const drift = Util.rand(-40, 40);
        const colors = ['#ff5bd1', '#5bffb0', '#ffe14d', '#ff3355'];
        spawn(makeCircleBullet(x, box.y - 10, drift, speed, 5, Util.pick(colors), 7, 'glitch'));
      }
    };
  }

  // --- Phase 4: Final Spiral ----------------------------------------------
  // Rotating spiral of bullets from the box center plus occasional cursor
  // waves layered on top for the climactic final phase.
  function SpiralPattern() {
    this.timer = 0;
    this.angle = 0;
    this.reset = () => { this.timer = 0; this.angle = 0; };
    this.update = (dt, elapsed, box, spawn) => {
      this.timer += dt;
      const interval = 0.045;
      if (this.timer >= interval) {
        this.timer -= interval;
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const arms = 3;
        for (let i = 0; i < arms; i++) {
          const a = this.angle + (Math.PI * 2 / arms) * i;
          const speed = 150;
          spawn(makeCircleBullet(cx, cy, Math.cos(a) * speed, Math.sin(a) * speed, 6, '#ffab4d', 8, 'spiral'));
        }
        this.angle += 0.28;
      }
    };
  }

  return {
    makeCircleBullet, makeRectBullet, collideBullet,
    StringsPattern, CursorPattern, GlitchSwarmPattern, SpiralPattern
  };
})();
