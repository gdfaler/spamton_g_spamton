// Drives a sequence of DialoguePages: per-character typewriter reveal,
// Z/Enter advances (or instantly completes the current page if it's still
// typing), X instantly reveals the current page WITHOUT advancing further
// (SPEC.md §7). Reusable — Stage 3 uses it for the intro, later stages
// reuse it for battle flavor text (Check/Snap/taunts/etc).
import type { DialoguePage } from './dialogueData';
import type { AudioHandle } from './assets';
import { DIALOGUE_CONFIG } from '../config/dialogue';

export class DialogueRunner {
  private pages: DialoguePage[] = [];
  private pageIndex = 0;
  private charIndex = 0;
  private charTimer = 0;
  private pageComplete = false;
  private active = false;
  private onDone: (() => void) | null = null;

  start(pages: DialoguePage[], onDone?: () => void): void {
    this.pages = pages;
    this.pageIndex = 0;
    this.onDone = onDone ?? null;
    this.active = pages.length > 0;
    this.loadPage();
  }

  private loadPage(): void {
    this.charIndex = 0;
    this.charTimer = 0;
    this.pageComplete = this.currentFullText().length === 0;
  }

  private currentFullText(): string {
    return this.pages[this.pageIndex]?.text ?? '';
  }

  update(dt: number, blip?: AudioHandle | null): void {
    if (!this.active || this.pageComplete) return;
    const full = this.currentFullText();
    const interval = 1 / DIALOGUE_CONFIG.charsPerSecond;
    this.charTimer += dt;
    while (this.charTimer >= interval && this.charIndex < full.length) {
      this.charTimer -= interval;
      this.charIndex++;
      const ch = full[this.charIndex - 1];
      if (blip && ch !== ' ' && ch !== '\n' && this.charIndex % DIALOGUE_CONFIG.blipEveryNChars === 0) {
        blip.play();
      }
    }
    if (this.charIndex >= full.length) this.pageComplete = true;
  }

  /** Z/Enter: complete current page if still typing, else move to the next
   * page (or finish the whole sequence). */
  advance(): void {
    if (!this.active) return;
    if (!this.pageComplete) {
      this.charIndex = this.currentFullText().length;
      this.pageComplete = true;
      return;
    }
    this.pageIndex++;
    if (this.pageIndex >= this.pages.length) {
      this.active = false;
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
      return;
    }
    this.loadPage();
  }

  /** X: instantly reveal the current page's full text. Never advances. */
  revealInstantly(): void {
    if (!this.active || this.pageComplete) return;
    this.charIndex = this.currentFullText().length;
    this.pageComplete = true;
  }

  isActive(): boolean {
    return this.active;
  }

  isPageComplete(): boolean {
    return this.pageComplete;
  }

  currentSpeaker(): DialoguePage['speaker'] | null {
    return this.pages[this.pageIndex]?.speaker ?? null;
  }

  currentDisplayText(): string {
    return this.currentFullText().substring(0, this.charIndex);
  }
}
