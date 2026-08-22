import { CLOTHES as CLOTHES_COLORS, HAIR as HAIR_COLORS, PAPER, SKIN } from './palette.js';
import { BACKGROUND } from './parts/background.js';
import { BEARD } from './parts/beard.js';
import { BROWS } from './parts/brows.js';
import { CLOTHES } from './parts/clothes.js';
import { EARRINGS } from './parts/earrings.js';
import { EARS } from './parts/ears.js';
import { EYES } from './parts/eyes.js';
import { FACE } from './parts/face.js';
import { GLASSES } from './parts/glasses.js';
import { HAIR } from './parts/hair.js';
import { HAT } from './parts/hat.js';
import { MARKS } from './parts/marks.js';
import { MOUTH } from './parts/mouth.js';
import { NOSE } from './parts/nose.js';
import type { Random } from './random.js';
import type { Catalog, Feature } from './types.js';

/**
 * Draw order, bottom to top. Body features come first so that grouping a layer
 * by head/body never reorders anything.
 */
export const FEATURES: readonly Feature[] = [
  { key: 'background', head: false, variants: BACKGROUND },
  { key: 'clothes', head: false, variants: CLOTHES },
  { key: 'ears', head: true, variants: EARS },
  { key: 'face', head: true, variants: FACE },
  { key: 'hair', head: true, variants: HAIR },
  { key: 'brows', head: true, variants: BROWS },
  { key: 'eyes', head: true, variants: EYES },
  { key: 'nose', head: true, variants: NOSE },
  { key: 'mouth', head: true, variants: MOUTH },
  { key: 'beard', head: true, variants: BEARD },
  { key: 'marks', head: true, variants: MARKS },
  { key: 'glasses', head: true, variants: GLASSES },
  { key: 'earrings', head: true, variants: EARRINGS },
  { key: 'hat', head: true, variants: HAT },
];

/** Colour choices, each a named swatch rather than a raw hex value. */
export const COLOR_TRAITS: Readonly<Record<string, Record<string, string>>> = {
  skinColor: SKIN,
  hairColor: HAIR_COLORS,
  clothesColor: CLOTHES_COLORS,
  backgroundColor: CLOTHES_COLORS,
  paperColor: PAPER,
};

export const FEATURE_KEYS = FEATURES.map((feature) => feature.key);
export const COLOR_KEYS = Object.keys(COLOR_TRAITS);
export const TRAIT_KEYS = [...FEATURE_KEYS, ...COLOR_KEYS];

/** Every trait and the values it accepts. Enough to build a whole editor from. */
export const OPTIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ...Object.fromEntries(FEATURES.map((feature) => [feature.key, Object.keys(feature.variants)])),
  ...Object.fromEntries(Object.entries(COLOR_TRAITS).map(([key, swatches]) => [key, Object.keys(swatches)])),
});

/**
 * Weighted choice. Weights are what keep a wall of avatars looking like a page
 * of doodles instead of a costume shop: most faces get no hat, no glasses and
 * no beard, and the rare ones land where they surprise you.
 */
export function pickVariant(catalog: Catalog, random: Random): string {
  const names = Object.keys(catalog);
  let total = 0;
  for (const name of names) total += catalog[name].weight;
  let roll = random.num() * total;
  for (const name of names) {
    roll -= catalog[name].weight;
    if (roll <= 0) return name;
  }
  return names[names.length - 1];
}

/** How many distinct avatars the catalogue can express. Well past a trillion. */
export const COMBINATIONS: bigint = TRAIT_KEYS.reduce(
  (total, key) => total * BigInt((OPTIONS[key] ?? []).length),
  1n,
);
