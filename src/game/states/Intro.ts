import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { DialogueRunner } from '../../core/dialogueRunner';
import type { DialoguePage } from '../../core/dialogueData';
import { DIALOGUE_CONFIG } from '../../config/dialogue';
import { PortraitCache } from '../portraits';
import { drawDialogueBox } from '../dialogueUi';
import { PartyMenuState } from './PartyMenu';

/**
 * Real intro: PhoneCallGag + NeoDeclaration from dialogue.json, played
 * through the shared DialogueRunner (typewriter + Z-advance/X-reveal, per
 * SPEC.md §7). Holding C for DIALOGUE_CONFIG.skipHoldSeconds skips
 * straight to PartyMenu, with a fill-bar indicator — independent of the
 * "Начать сразу с боя" start-menu option, which bypasses Intro entirely.
 */
export class IntroState implements GameState<GameContext> {
  readonly name = 'Intro';
  private readonly runner = new DialogueRunner();
  private readonly portraits = new PortraitCache();

  enter(ctx: GameContext): void {
    const data = ctx.dialogueData;
    const pages: DialoguePage[] = data
      ? [...data.intro.phone_call, ...data.intro.neo_declaration]
      : [{ speaker: 'system', text: '(no dialogue data)' }];
    this.runner.start(pages, () => ctx.goto(new PartyMenuState()));
  }

  update(ctx: GameContext, dt: number): void {
    const heldSeconds = ctx.input.heldSeconds('menu');
    if (heldSeconds >= DIALOGUE_CONFIG.skipHoldSeconds) {
      ctx.goto(new PartyMenuState());
      return;
    }

    if (ctx.input.justPressed('confirm')) this.runner.advance();
    if (ctx.input.justPressed('cancel')) this.runner.revealInstantly();

    this.runner.update(dt, ctx.sfxBlip);
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#5bffb0';
    g.font = '12px monospace';
    g.textAlign = 'center';
    g.fillText(`FPS: ${ctx.fps.toFixed(0)}  |  state: ${ctx.currentStateName()}`, 320, 24);
    g.textAlign = 'left';

    const speaker = this.runner.currentSpeaker() ?? 'system';
    const heldSeconds = ctx.input.heldSeconds('menu');
    drawDialogueBox(g, {
      speaker,
      text: this.runner.currentDisplayText(),
      pageComplete: this.runner.isPageComplete(),
      portrait: speaker === 'system' ? null : this.portraits.get(ctx.assets, speaker),
      skipHoldProgress: heldSeconds / DIALOGUE_CONFIG.skipHoldSeconds
    });
  }
}
