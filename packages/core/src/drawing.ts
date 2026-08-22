import type { Drawing, Layer } from './types.js';

/** Bottom to top. The renderer stacks the layers in this order. */
export const LAYERS: readonly Layer[] = ['back', 'mask', 'color', 'ink'];

/** Concatenates drawings layer by layer, keeping the order they were given in. */
export function merge(...drawings: Drawing[]): Drawing {
  const out: Drawing = {};
  for (const drawing of drawings) {
    for (const layer of LAYERS) {
      const piece = drawing[layer];
      if (piece) out[layer] = (out[layer] ?? '') + piece;
    }
  }
  return out;
}
