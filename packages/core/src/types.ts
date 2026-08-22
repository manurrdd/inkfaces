import type { Frame, Outline, Point } from './geometry.js';
import type { Colors } from './palette.js';
import type { Random } from './random.js';

/**
 * Drawing order, bottom to top.
 *
 * `mask` exists so hair can hang behind the head: it paints the face in the
 * paper colour, hiding whatever the `back` layer put there. Colour patches go
 * above the mask and below every line, which is what makes the ink survive on
 * renderers that ignore blend modes.
 */
export type Layer = 'back' | 'mask' | 'color' | 'ink';

export type Drawing = Partial<Record<Layer, string>>;

export interface Layout {
  frame: Frame;
  /** The face silhouette, asked by angle. */
  at: Outline;
  /** The silhouette pushed out from (or pulled into) the centre. */
  out: (t: number, scale: number) => Point;
  /** The silhouette as a closed loop. */
  outline: Point[];
  /** Degrees the head leans. Applied to head parts as a group. */
  tilt: number;
  eyes: { left: Point; right: Point; radius: number };
  nose: Point;
  mouth: Point;
}

export interface Context {
  /** This part's own stream. Draws here never disturb another part. */
  random: Random;
  layout: Layout;
  colors: Colors;
  /** Every chosen variant, so a part can respond to its neighbours. */
  options: Readonly<Record<string, string>>;
}

export type Part = (ctx: Context) => Drawing;

export interface Variant {
  /** Relative likelihood. A common feature earns a higher number. */
  weight: number;
  draw: Part;
}

export type Catalog = Record<string, Variant>;

export interface Feature {
  key: string;
  /** Head parts lean with the head; body parts stay upright. */
  head: boolean;
  variants: Catalog;
}
