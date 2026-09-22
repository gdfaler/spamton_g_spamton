import { Game } from './game/Game';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('#game canvas element not found');
}

const game = new Game(canvas);
game.start();

// Dev/test-only escape hatch, stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Game }).__game = game;
}
