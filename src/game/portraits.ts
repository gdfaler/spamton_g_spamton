// Lazily loads+caches speaker portraits (async load, sync read) so the
// dialogue box always has *something* to draw on the very first frame a
// new speaker appears, per the same placeholder-fallback rule as every
// other asset. Reused by battle flavor text in later stages.
import type { AssetManager, SpriteHandle } from '../core/assets';
import type { SpeakerId } from '../core/dialogueData';

const PORTRAIT_SIZE = 64;

export class PortraitCache {
  private cache = new Map<SpeakerId, SpriteHandle>();
  private loading = new Set<SpeakerId>();

  get(assets: AssetManager, speaker: SpeakerId): SpriteHandle {
    const cached = this.cache.get(speaker);
    if (cached) return cached;

    if (!this.loading.has(speaker)) {
      this.loading.add(speaker);
      assets.loadSprite(`assets/sprites/portrait_${speaker}.png`, PORTRAIT_SIZE, PORTRAIT_SIZE).then((handle) => {
        this.cache.set(speaker, handle);
      });
    }
    // Synchronous placeholder until the real (or placeholder) load resolves.
    return assets.getPlaceholder(`assets/sprites/portrait_${speaker}.png`, PORTRAIT_SIZE, PORTRAIT_SIZE);
  }
}
