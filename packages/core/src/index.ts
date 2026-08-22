/**
 * InkFaces — hand-drawn procedural avatars.
 *
 *   import { avatar } from 'inkfaces';
 *   const svg = avatar('ada@example.com');
 *   const fixed = avatar('ada@example.com', { hair: 'curly', glasses: 'round' });
 *
 * The same seed always draws the same face. Pin as many traits as you like; the
 * rest keep coming from the seed.
 */
import { render, resolveTraits, type Options, type Traits } from './render.js';

/** The avatar for a seed, as a standalone SVG document. */
export function avatar(seed: string, options?: Options): string {
  return render(String(seed), options);
}

/** The traits a seed resolves to, without drawing anything. Useful for editors. */
export function traits(seed: string, options?: Options): Traits {
  return resolveTraits(String(seed), options);
}

/** The same avatar as a `data:` URI, ready for `src` or `background-image`. */
export function dataUri(seed: string, options?: Options): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(avatar(seed, options))}`;
}

export { COLOR_KEYS, COLOR_TRAITS as SWATCHES, COMBINATIONS, FEATURE_KEYS, OPTIONS, TRAIT_KEYS } from './catalog.js';
export { STYLE_VERSION } from './render.js';
export type { Options, TraitKey, Traits } from './render.js';
