// Player-controlled SOUL ("heart"). Moves inside the current battle box,
// takes damage from bullets with a brief invincibility window afterward.
SG.Heart = function (box) {
  const Util = SG.Util;
  this.x = box.x + box.w / 2;
  this.y = box.y + box.h / 2;
  this.r = 7;
  this.speed = 220; // px/sec, normal soul speed
  this.speedSlow = 95; // held-shift focus speed
  this.invincible = 0;
  this.flash = 0;
  this.color = '#ff3355';
  this.alive = true;

  this.reset = (box) => {
    this.x = box.x + box.w / 2;
    this.y = box.y + box.h / 2 + box.h * 0.3;
    this.invincible = 1.2;
  };

  this.update = (dt, keys, box) => {
    const slow = keys['shift'];
    const spd = slow ? this.speedSlow : this.speed;
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    this.x += dx * spd * dt;
    this.y += dy * spd * dt;
    this.x = Util.clamp(this.x, box.x + this.r, box.x + box.w - this.r);
    this.y = Util.clamp(this.y, box.y + this.r, box.y + box.h - this.r);

    if (this.invincible > 0) {
      this.invincible -= dt;
      this.flash += dt;
    }
  };

  this.hit = (dmg, dealDamage) => {
    if (this.invincible > 0) return false;
    this.invincible = 1.1;
    this.flash = 0;
    dealDamage(dmg);
    return true;
  };

  this.isInvincible = () => this.invincible > 0;
};
