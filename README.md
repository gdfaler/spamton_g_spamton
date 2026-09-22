# SPAMTON NEO — Boss Battle Clone

A fan-made, fully playable clone of the SPAMTON NEO boss battle from
*Deltarune Chapter 2*, built as a self-contained static web page (plain
HTML/CSS/JS, no build step, no external dependencies).

## Play

Open `index.html` in a browser (or serve the folder with any static file
server, e.g. `python3 -m http.server`).

- **Arrow keys / WASD** — move the soul
- **Z / Enter / Space** — confirm, attack, advance dialogue
- **X / Escape** — cancel / back out of a submenu
- **F** — toggle the FPS counter
- The intro dialogue can be skipped at any time with the **SKIP INTRO**
  button in the top-right corner, or `Escape`.
- Mouse/touch works for every menu and the FIGHT timing bar; touch also
  supports drag-to-move during the bullet-hell phases.

## How it works

- `js/utils.js` — small math/collision helpers
- `js/audio.js` — a tiny WebAudio synth (no audio files; all sound and
  the battle theme are generated procedurally at runtime)
- `js/dialogue.js` — the typewriter dialogue box + skip logic
- `js/heart.js` — the player-controlled SOUL
- `js/patterns.js` — bullet types and the four attack patterns
- `js/boss.js` — boss HP/phase/spare-state logic
- `js/ui.js` — all canvas drawing helpers, including the boss's
  procedurally-drawn puppet design
- `js/main.js` — the state machine and a fixed-timestep (60Hz) game loop

The boss art is an original geometric design (not an extracted game
sprite), and all dialogue is original fan-written flavor text in the
character's stylistic voice rather than a copy of the game's script —
this keeps the project a transformative fan tribute rather than a
reproduction of copyrighted assets.

Game loop: `requestAnimationFrame` drives rendering, while game logic
(movement, bullets, collisions) runs on a fixed 60Hz accumulator step so
behavior is consistent across displays regardless of refresh rate.
