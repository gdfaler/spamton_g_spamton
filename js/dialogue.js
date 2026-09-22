// Dialogue system: typewriter text boxes with a portrait, fully skippable.
// All text here is original fan-written flavor text in the character's
// stylistic voice (ALL CAPS glitchy salesman patter) rather than a verbatim
// transcription of any copyrighted script.
SG.Dialogue = (function () {
  const Util = SG.Util;

  const INTRO_PAGES = [
    { speaker: 'SPAMTON', text: 'heHEHE... you actually showed up, [BIG SHOT].' },
    { speaker: 'SPAMTON', text: "WELCOME to my one-of-a-kind SHOWCASE!\nEverything here's ABSOLUTELY free of charge!" },
    { speaker: 'SPAMTON', text: "You know what I always wanted?\nTO BE A REAL BOY! ...or a real SOMEBODY, anyway." },
    { speaker: 'SPAMTON', text: "But that's fine! That's FINE!\nI got a NEW DEAL for ya instead." },
    { speaker: 'SPAMTON', text: '[ERROR] ... [ERROR] ...\nfeeling a little... UPGRADED, actually.' },
    { speaker: 'SPAMTON', text: "THEY'RE ALL GONNA KNOW THE NAME...\n★ S P A M T O N ★" },
    { speaker: 'SPAMTON NEO', text: 'BIG SHOT MODE: ENGAGED.\nHOPE YOU BROUGHT YOUR WALLET, KID!' }
  ];

  const CHECK_TEXT =
    '* SPAMTON NEO - ATK 80 DEF 80\n* His wires are the only thing keeping him up.\n* He is having the time of his life.';

  const TAUNTS = [
    "SPAMTON: Step RIGHT up, don'tcha wanna buy somethin'?!",
    'SPAMTON: [ERROR] ... FREE SHIPPING on that attack, kid!',
    'SPAMTON: heHEHE! Big shot, big shot, BIG SHOT!',
    'SPAMTON: You call that a HAGGLE?! I invented haggling!',
    'SPAMTON: Everyone loves a good SALE on their own DOWNFALL!',
    "SPAMTON: I'm gonna be a REAL BOY after this, just you wait!",
    'SPAMTON: [BUY NOW] ... [BUY NOW] ... [BUY NOW] ...',
    'SPAMTON: Ratings! Reviews! Five stars, baby!'
  ];

  const HURT_LINES = [
    'SPAMTON: h-heh... that ALL you got, kid?',
    'SPAMTON: NOTHING personnel, just BUSINESS!',
    'SPAMTON: [ERROR] ... rebooting CHARISMA.exe...',
    'SPAMTON: You think THAT hurts?! I FEEL AMAZING!'
  ];

  const LOW_HP_LINES = [
    'SPAMTON NEO: N-no no no... this ISN\'T how the deal goes...',
    'SPAMTON NEO: I was supposed to be the BIG SHOT here!',
    'SPAMTON NEO: [SYSTEM FAILURE] ... [SYSTEM FAILURE] ...'
  ];

  const SPARE_SEQUENCE = [
    { speaker: 'SPAMTON NEO', text: '...\nheh. hehehe...' },
    { speaker: 'SPAMTON NEO', text: "Guess I'm... not much of a SALESMAN after all." },
    { speaker: 'SPAMTON', text: "Thanks for stoppin' by my showcase, [BIG SHOT].\nCome back anytime. No refunds, though." }
  ];

  const DEFEAT_SEQUENCE = [
    { speaker: 'SPAMTON NEO', text: "h-HEY, wait—! This wasn't part of the DEAL—!" },
    { speaker: 'SPAMTON NEO', text: '[CONNECTION LOST]\n[CONNECTION LOST]\n[CONNECTION...' },
    { speaker: 'SPAMTON', text: "...\nheh. Guess the show's over, kid." }
  ];

  const GAME_OVER_LINES = [
    'SPAMTON NEO: heHEHEHEHE!!',
    'SPAMTON NEO: Looks like the DEAL fell through, kid...'
  ];

  let onComplete = null;
  let pages = [];
  let pageIndex = 0;
  let charIndex = 0;
  let charTimer = 0;
  const CHAR_INTERVAL = 1000 / 42; // ~42 chars/sec typewriter speed
  let active = false;
  let currentSpeaker = '';
  let currentDisplay = '';
  let currentFull = '';
  let pageComplete = false;
  let fastForward = false;

  function start(pageList, cb) {
    pages = pageList;
    pageIndex = 0;
    charIndex = 0;
    charTimer = 0;
    active = true;
    pageComplete = false;
    onComplete = cb || null;
    loadPage();
  }

  function loadPage() {
    const p = pages[pageIndex];
    currentSpeaker = p.speaker;
    currentFull = p.text;
    currentDisplay = '';
    charIndex = 0;
    pageComplete = false;
  }

  function completeCurrentPage() {
    currentDisplay = currentFull;
    charIndex = currentFull.length;
    pageComplete = true;
  }

  function advance() {
    if (!active) return;
    if (!pageComplete) {
      completeCurrentPage();
      SG.Audio.SFX.confirm();
      return;
    }
    pageIndex++;
    if (pageIndex >= pages.length) {
      active = false;
      const cb = onComplete;
      onComplete = null;
      if (cb) cb();
      return;
    }
    loadPage();
    SG.Audio.SFX.confirm();
  }

  function skipAll() {
    if (!active) return;
    active = false;
    const cb = onComplete;
    onComplete = null;
    if (cb) cb();
  }

  function update(dtMs) {
    if (!active || pageComplete) return;
    charTimer += dtMs;
    while (charTimer >= CHAR_INTERVAL && charIndex < currentFull.length) {
      charTimer -= CHAR_INTERVAL;
      charIndex++;
      const ch = currentFull[charIndex - 1];
      if (ch !== ' ' && ch !== '\n' && charIndex % 2 === 0) {
        SG.Audio.SFX.blip();
      }
    }
    currentDisplay = currentFull.substring(0, charIndex);
    if (charIndex >= currentFull.length) pageComplete = true;
  }

  function isActive() { return active; }
  function getDisplay() { return { speaker: currentSpeaker, text: currentDisplay, complete: pageComplete, hasMore: pageIndex < pages.length - 1 }; }

  function single(speaker, text, cb) {
    start([{ speaker, text }], cb);
  }

  return {
    INTRO_PAGES, CHECK_TEXT, TAUNTS, HURT_LINES, LOW_HP_LINES,
    SPARE_SEQUENCE, DEFEAT_SEQUENCE, GAME_OVER_LINES,
    start, single, advance, skipAll, update, isActive, getDisplay
  };
})();
