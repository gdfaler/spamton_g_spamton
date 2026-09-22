// Asset loader with a hard requirement from ASSETS.md: a missing file must
// never throw or stall the game. Sprites fall back to a labeled colored
// placeholder rectangle (drawn as an offscreen canvas, so callers still get
// something `drawImage`-able); audio falls back to a silent no-op handle.

export interface SpriteHandle {
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly isPlaceholder: boolean;
  /** Always safe to draw, whether the real image loaded or not. */
  readonly source: CanvasImageSource;
}

export interface AudioHandle {
  readonly path: string;
  readonly isPlaceholder: boolean;
  play(): void;
  stop(): void;
}

/** Deterministic-per-path color so repeated placeholders are visually
 * distinguishable without needing real art yet. */
function colorForPath(path: string): string {
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 31 + path.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 55%, 35%)`;
}

function buildPlaceholderSprite(path: string, width: number, height: number): CanvasImageSource {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d')!;
  ctx.fillStyle = colorForPath(path);
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  const label = path.split('/').pop() ?? path;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(8, Math.floor(Math.min(width, height) / 6))}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Wrap the label onto a couple of lines so it fits small placeholders.
  const words = label.split(/(?=[._-])/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line + w;
    if (ctx.measureText(test).width > width - 6 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineHeight = Math.max(9, Math.floor(Math.min(width, height) / 5));
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, width / 2, startY + i * lineHeight));

  return off;
}

const DEFAULT_PLACEHOLDER_SIZE = 48;

export class AssetManager {
  private sprites = new Map<string, SpriteHandle>();
  private audios = new Map<string, AudioHandle>();

  /** Resolves once the image is loaded OR has definitively failed (in which
   * case it resolves with a placeholder handle — never rejects). */
  loadSprite(path: string, fallbackWidth = DEFAULT_PLACEHOLDER_SIZE, fallbackHeight = DEFAULT_PLACEHOLDER_SIZE): Promise<SpriteHandle> {
    const cached = this.sprites.get(path);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const handle: SpriteHandle = {
          path,
          width: img.naturalWidth,
          height: img.naturalHeight,
          isPlaceholder: false,
          source: img
        };
        this.sprites.set(path, handle);
        resolve(handle);
      };
      img.onerror = () => {
        console.warn(`[assets] missing sprite, using placeholder: ${path}`);
        const handle: SpriteHandle = {
          path,
          width: fallbackWidth,
          height: fallbackHeight,
          isPlaceholder: true,
          source: buildPlaceholderSprite(path, fallbackWidth, fallbackHeight)
        };
        this.sprites.set(path, handle);
        resolve(handle);
      };
      img.src = path;
    });
  }

  /** Synchronous placeholder for a sprite not yet loaded — lets stub states
   * draw *something* on the very first frame instead of nothing. */
  getPlaceholder(path: string, width = DEFAULT_PLACEHOLDER_SIZE, height = DEFAULT_PLACEHOLDER_SIZE): SpriteHandle {
    return {
      path,
      width,
      height,
      isPlaceholder: true,
      source: buildPlaceholderSprite(path, width, height)
    };
  }

  loadAudio(path: string): Promise<AudioHandle> {
    const cached = this.audios.get(path);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const audio = new window.Audio();
      const onReady = () => {
        const handle: AudioHandle = {
          path,
          isPlaceholder: false,
          play: () => { audio.currentTime = 0; void audio.play().catch(() => {}); },
          stop: () => { audio.pause(); audio.currentTime = 0; }
        };
        this.audios.set(path, handle);
        resolve(handle);
      };
      audio.oncanplaythrough = onReady;
      audio.onerror = () => {
        console.warn(`[assets] missing audio, using silent placeholder: ${path}`);
        const handle: AudioHandle = {
          path,
          isPlaceholder: true,
          play: () => {},
          stop: () => {}
        };
        this.audios.set(path, handle);
        resolve(handle);
      };
      audio.src = path;
      audio.load();
    });
  }
}
