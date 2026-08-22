/**
 * Colours.
 *
 * Ink is always the same near-black; the style depends on it. Everything else
 * is a named swatch so that `{ skinColor: 'olive' }` is a valid, stable option
 * instead of a hex code that ties callers to today's exact shade.
 */

/** The pen. Warm black, never pure #000 — pure black reads as print, not ink. */
export const INK = '#2b2724';

export const SKIN: Record<string, string> = {
  porcelain: '#f6ded0',
  cream: '#f2d3bb',
  sand: '#e7bd9b',
  peach: '#f0c3a7',
  honey: '#dda877',
  clay: '#c98e64',
  olive: '#bf9a6d',
  cocoa: '#a06f4a',
  chestnut: '#875436',
  espresso: '#5f3a26',
  rose: '#f4c9c2',
  mint: '#cfdcc9',
};

export const HAIR: Record<string, string> = {
  ink: '#3b3733',
  soot: '#4a4038',
  chocolate: '#6b4a33',
  chestnut: '#8a5a3b',
  auburn: '#a4552f',
  ginger: '#c96a34',
  honey: '#c99a54',
  wheat: '#d8bd7e',
  ash: '#9a958d',
  silver: '#cdc9c1',
  plum: '#7d5570',
  denim: '#5f7690',
  moss: '#6f8060',
  bubblegum: '#d98aa4',
};

export const CLOTHES: Record<string, string> = {
  brick: '#c2705c',
  blush: '#e0aa9e',
  slate: '#8fa2b6',
  mustard: '#d3b871',
  sage: '#8d9b83',
  mauve: '#b198a8',
  stone: '#9a9a95',
  sand: '#c9b79a',
  teal: '#7ba39c',
  navy: '#5c6a83',
  lilac: '#a99ac4',
  ochre: '#c99a52',
};

export const PAPER: Record<string, string> = {
  cream: '#f4efe4',
  bone: '#f7f3ea',
  linen: '#efe7d7',
  fog: '#eceae4',
  blush: '#f6e9e2',
  sky: '#e5ecef',
  butter: '#f6eed6',
  mint: '#e6eee6',
};

export interface Colors {
  ink: string;
  paper: string;
  skin: string;
  hair: string;
  clothes: string;
  background: string;
}
