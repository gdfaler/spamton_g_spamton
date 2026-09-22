// Dev-only debug shortcuts (F1: force Victory, F2: force GameOver), so
// screens can be reviewed without playing the real battle logic. Wired
// globally in Game.ts rather than per-state, and gated on
// `import.meta.env.DEV` (Vite's build-time flag: true for `npm run dev`,
// statically false — and dead-code-eliminated — in `npm run build`).
export class DevHotkeys {
  private wantsVictory = false;
  private wantsGameOver = false;

  constructor() {
    if (!import.meta.env.DEV) return;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F1') {
        e.preventDefault();
        this.wantsVictory = true;
      } else if (e.code === 'F2') {
        e.preventDefault();
        this.wantsGameOver = true;
      }
    });
  }

  consumeVictoryRequest(): boolean {
    const v = this.wantsVictory;
    this.wantsVictory = false;
    return v;
  }

  consumeGameOverRequest(): boolean {
    const v = this.wantsGameOver;
    this.wantsGameOver = false;
    return v;
  }
}
