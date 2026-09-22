import type { SpriteHandle } from '../core/assets';
import type { SpeakerId } from '../core/dialogueData';

const SPEAKER_LABELS: Record<SpeakerId, string> = {
  kris: 'KRIS',
  susie: 'SUSIE',
  ralsei: 'RALSEI',
  spamton: 'SPAMTON',
  system: ''
};

function wrapText(g: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (line && g.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

export interface DialogueBoxOptions {
  speaker: SpeakerId;
  text: string;
  pageComplete: boolean;
  portrait: SpriteHandle | null;
  /** [0,1] fill for the "hold C to skip" indicator; omit/0 to hide. */
  skipHoldProgress?: number;
}

const BOX_X = 24;
const BOX_Y = 336;
const BOX_W = 592;
const BOX_H = 128;

export function drawDialogueBox(g: CanvasRenderingContext2D, opts: DialogueBoxOptions): void {
  g.save();
  g.fillStyle = '#000000';
  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  g.fillRect(BOX_X, BOX_Y, BOX_W, BOX_H);
  g.strokeRect(BOX_X, BOX_Y, BOX_W, BOX_H);

  const hasPortrait = opts.speaker !== 'system' && opts.portrait;
  const textX = BOX_X + (hasPortrait ? 20 + 64 + 16 : 20);
  const textMaxWidth = BOX_W - (textX - BOX_X) - 20;

  if (hasPortrait && opts.portrait) {
    g.drawImage(opts.portrait.source, BOX_X + 20, BOX_Y + 16, 64, 64);
  }

  const label = SPEAKER_LABELS[opts.speaker];
  let textTop = BOX_Y + 20;
  if (label) {
    g.fillStyle = '#ffe14d';
    g.font = 'bold 15px monospace';
    g.fillText(label, textX, textTop);
    textTop += 24;
  }

  g.fillStyle = '#ffffff';
  g.font = '15px monospace';
  const lines = wrapText(g, opts.text, textMaxWidth);
  lines.forEach((line, i) => g.fillText(line, textX, textTop + i * 20));

  if (opts.pageComplete) {
    const pulse = Math.sin(performance.now() / 180) * 3;
    g.fillStyle = '#ffffff';
    g.beginPath();
    const ax = BOX_X + BOX_W - 24;
    const ay = BOX_Y + BOX_H - 18 + pulse * 0.3;
    g.moveTo(ax, ay);
    g.lineTo(ax + 12, ay);
    g.lineTo(ax + 6, ay + 8);
    g.closePath();
    g.fill();
  }

  if (opts.skipHoldProgress && opts.skipHoldProgress > 0) {
    const barW = 160;
    const barX = BOX_X + BOX_W / 2 - barW / 2;
    const barY = BOX_Y - 22;
    g.fillStyle = '#222222';
    g.fillRect(barX, barY, barW, 10);
    g.fillStyle = '#5bffb0';
    g.fillRect(barX, barY, barW * Math.min(1, opts.skipHoldProgress), 10);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    g.strokeRect(barX, barY, barW, 10);
    g.fillStyle = '#ffffff';
    g.font = '11px monospace';
    g.textAlign = 'center';
    g.fillText('удержите C — пропустить', barX + barW / 2, barY - 6);
    g.textAlign = 'left';
  }

  g.restore();
}
