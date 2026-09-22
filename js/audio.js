// Small procedural WebAudio engine. Everything is synthesized at runtime,
// so the game has no external asset dependencies (no network needed).
SG.Audio = (function () {
  let ctx = null;
  let musicGain, sfxGain, masterGain;
  let musicTimer = null;
  let musicStep = 0;
  let enabled = true;
  let musicPattern = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }

  function tone(freq, dur, type, gainNode, vol, detune) {
    if (!enabled) return;
    ensureCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(gainNode);
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, vol, gainNode) {
    if (!enabled) return;
    ensureCtx();
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(gainNode);
    src.start();
  }

  const SFX = {
    blip() { tone(SG.Util.rand(280, 420), 0.045, 'square', sfxGain, 0.18); },
    confirm() { tone(520, 0.08, 'square', sfxGain, 0.25); tone(780, 0.08, 'square', sfxGain, 0.15); },
    cancel() { tone(220, 0.09, 'sawtooth', sfxGain, 0.2); },
    move() { tone(180, 0.03, 'square', sfxGain, 0.08); },
    hit() {
      noiseBurst(0.18, 0.5, sfxGain);
      tone(90, 0.2, 'sawtooth', sfxGain, 0.3);
    },
    heal() {
      tone(523, 0.1, 'sine', sfxGain, 0.2);
      setTimeout(() => tone(659, 0.1, 'sine', sfxGain, 0.2), 90);
      setTimeout(() => tone(784, 0.15, 'sine', sfxGain, 0.2), 180);
    },
    damage() {
      tone(150, 0.12, 'square', sfxGain, 0.3);
      tone(100, 0.18, 'square', sfxGain, 0.25);
    },
    bigHit() {
      noiseBurst(0.3, 0.6, sfxGain);
      tone(60, 0.35, 'sawtooth', sfxGain, 0.35);
    },
    spare() {
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => tone(f, 0.25, 'sine', sfxGain, 0.22), i * 110);
      });
    },
    glitch() {
      tone(SG.Util.rand(60, 900), 0.06, 'square', sfxGain, 0.15);
    }
  };

  // Original 8-bit style arpeggio loop (not a transcription of any existing
  // song) used as battle music so the page has no external audio files.
  function startMusic() {
    ensureCtx();
    stopMusic();
    const bpm = 148;
    const stepDur = 60 / bpm / 2;
    const bass = [110, 110, 130.8, 110, 146.8, 110, 130.8, 98];
    const lead = [
      440, 523, 587, 523, 659, 587, 523, 440,
      392, 440, 523, 440, 587, 523, 466, 392
    ];
    musicStep = 0;
    musicPattern = setInterval(() => {
      if (!enabled) return;
      const b = bass[musicStep % bass.length];
      tone(b, stepDur * 1.6, 'triangle', musicGain, 0.22);
      if (musicStep % 2 === 0) {
        const l = lead[(musicStep / 1) % lead.length | 0];
        tone(l, stepDur * 0.9, 'square', musicGain, 0.09);
      }
      musicStep++;
    }, stepDur * 1000);
  }

  function stopMusic() {
    if (musicPattern) {
      clearInterval(musicPattern);
      musicPattern = null;
    }
  }

  function setEnabled(v) {
    enabled = v;
    if (masterGain) masterGain.gain.value = v ? 0.55 : 0;
    if (!v) stopMusic();
  }

  function unlock() {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }

  return { SFX, startMusic, stopMusic, setEnabled, unlock };
})();
