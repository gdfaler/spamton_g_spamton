// Keyboard input manager. Exposes edge-triggered (justPressed/justReleased)
// and level-triggered (isDown) queries, plus held-duration tracking needed
// later for the C-hold-to-skip-intro indicator and the Z-hold Big Shot
// charge. `update()` must be called once per FIXED logic step (not per
// render frame) so "just pressed" edges line up with 60Hz game logic
// regardless of display refresh rate.

export type GameKey =
  | 'up' | 'down' | 'left' | 'right'
  | 'confirm'   // Z / Enter
  | 'cancel'    // X
  | 'menu'      // C
  | 'shift';    // reserved, no-op by design (see SPEC §4)

const KEY_MAP: Record<string, GameKey> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Enter: 'confirm',
  KeyX: 'cancel',
  KeyC: 'menu',
  ShiftLeft: 'shift', ShiftRight: 'shift'
};

interface KeyState {
  down: boolean;
  pressedThisStep: boolean;
  releasedThisStep: boolean;
  heldSeconds: number;
}

function freshState(): KeyState {
  return { down: false, pressedThisStep: false, releasedThisStep: false, heldSeconds: 0 };
}

export class InputManager {
  private state = new Map<GameKey, KeyState>();
  private pendingDown = new Set<GameKey>();
  private pendingUp = new Set<GameKey>();

  constructor() {
    (Object.keys(KEY_MAP) as (keyof typeof KEY_MAP)[]).forEach((code) => {
      const key = KEY_MAP[code];
      if (key && !this.state.has(key)) this.state.set(key, freshState());
    });

    window.addEventListener('keydown', (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      // Prevent arrow keys / space from scrolling the page.
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      if (!e.repeat) this.pendingDown.add(key);
    });
    window.addEventListener('keyup', (e) => {
      const key = KEY_MAP[e.code];
      if (!key) return;
      this.pendingUp.add(key);
    });
  }

  /** Call once per fixed 60Hz logic step, BEFORE reading input this step. */
  update(dt: number): void {
    for (const [key, s] of this.state) {
      s.pressedThisStep = false;
      s.releasedThisStep = false;

      if (this.pendingDown.has(key) && !s.down) {
        s.down = true;
        s.pressedThisStep = true;
        s.heldSeconds = 0;
      }
      if (this.pendingUp.has(key) && s.down) {
        s.down = false;
        s.releasedThisStep = true;
      }
      if (s.down) s.heldSeconds += dt;
    }
    this.pendingDown.clear();
    this.pendingUp.clear();
  }

  isDown(key: GameKey): boolean {
    return this.state.get(key)?.down ?? false;
  }

  justPressed(key: GameKey): boolean {
    return this.state.get(key)?.pressedThisStep ?? false;
  }

  justReleased(key: GameKey): boolean {
    return this.state.get(key)?.releasedThisStep ?? false;
  }

  /** Seconds the key has been continuously held (0 if not down). */
  heldSeconds(key: GameKey): number {
    return this.state.get(key)?.heldSeconds ?? 0;
  }
}
