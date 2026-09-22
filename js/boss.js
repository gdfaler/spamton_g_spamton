// SPAMTON NEO boss state: HP, phase selection, taunts and spare condition.
SG.Boss = function () {
  const P = SG.Patterns;

  this.name = 'SPAMTON NEO';
  this.maxHP = 2600;
  this.hp = this.maxHP;
  this.atk = 80;
  this.def = 80;
  this.turnCount = 0;
  this.spareable = false;
  this.defeated = false;

  this.patterns = {
    strings: new P.StringsPattern(),
    cursor: new P.CursorPattern(),
    glitch: new P.GlitchSwarmPattern(),
    spiral: new P.SpiralPattern()
  };

  this.hpRatio = () => Math.max(0, this.hp / this.maxHP);

  this.phaseIndex = () => {
    const r = this.hpRatio();
    if (r > 0.72) return 0;
    if (r > 0.45) return 1;
    if (r > 0.18) return 2;
    return 3;
  };

  this.phaseName = () => {
    return ['STRINGS', 'CURSORS', 'GLITCH SWARM', 'FINAL STAND'][this.phaseIndex()];
  };

  this.takeDamage = (dmg) => {
    this.hp = Math.max(0, this.hp - dmg);
    this.turnCount++;
    if (this.hp <= 0) {
      this.defeated = true;
    } else if (this.hpRatio() <= 0.12) {
      this.spareable = true;
    }
    return this.hp;
  };

  this.randomTaunt = () => SG.Util.pick(SG.Dialogue.TAUNTS);
  this.randomHurtLine = () => SG.Util.pick(SG.Dialogue.HURT_LINES);

  // Runs one boss "turn" (bullet-hell phase). Calls spawn(bullet) to add
  // bullets to the active battle, for `duration` seconds.
  this.buildTurn = () => {
    const phase = this.phaseIndex();
    const duration = [6.5, 7.5, 8.5, 10.5][phase];
    Object.values(this.patterns).forEach(p => p.reset());
    const updaters = [];
    if (phase === 0) {
      updaters.push(this.patterns.strings);
    } else if (phase === 1) {
      updaters.push(this.patterns.strings);
      updaters.push(this.patterns.cursor);
    } else if (phase === 2) {
      updaters.push(this.patterns.glitch);
      updaters.push(this.patterns.cursor);
    } else {
      updaters.push(this.patterns.spiral);
      updaters.push(this.patterns.cursor);
      updaters.push(this.patterns.glitch);
    }
    return { duration, updaters, phase };
  };
};
