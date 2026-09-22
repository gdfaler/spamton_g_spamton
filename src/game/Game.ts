import { GameCanvas } from '../core/canvas';
import { InputManager } from '../core/input';
import { AssetManager } from '../core/assets';
import { GameLoop } from '../core/loop';
import { StateMachine, type GameState } from '../core/stateMachine';
import { type GameContext, createInitialBattleData } from './context';
import { BootState } from './states/Boot';

export class Game {
  private readonly canvas: GameCanvas;
  private readonly loop: GameLoop;
  private readonly machine: StateMachine<GameContext>;
  private readonly ctx: GameContext;
  private lastRenderTime = performance.now();
  private fpsSmoothed = 60;

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = new GameCanvas(canvasEl);

    const input = new InputManager();
    const assets = new AssetManager();

    // `machine` is assigned right after `ctx` below; `goto` is only ever
    // called from state update()s, which happen after start(), so this
    // forward reference is safe.
    let machine!: StateMachine<GameContext>;

    this.ctx = {
      input,
      assets,
      battle: createInitialBattleData(),
      fps: 60,
      goto: (state: GameState<GameContext>) => machine.transition(state),
      currentStateName: () => machine.currentName
    };

    machine = new StateMachine<GameContext>(this.ctx);
    this.machine = machine;

    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha)
    });
  }

  start(): void {
    this.machine.transition(new BootState());
    this.loop.start();
  }

  private update(dt: number): void {
    this.ctx.input.update(dt);
    this.machine.update(dt);
  }

  private render(_alpha: number): void {
    const now = performance.now();
    const instFps = 1000 / Math.max(1, now - this.lastRenderTime);
    this.lastRenderTime = now;
    this.fpsSmoothed += (instFps - this.fpsSmoothed) * 0.1;
    this.ctx.fps = this.fpsSmoothed;

    this.machine.render(this.canvas.ctx);
  }
}
