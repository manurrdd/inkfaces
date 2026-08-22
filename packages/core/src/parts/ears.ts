import { LEFT, RIGHT, mix, type Point } from '../geometry.js';
import { blob, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

interface Shape {
  /** How far the ear sticks out, as a fraction of the head. */
  reach: number;
  /** How tall the attachment is, in radians of silhouette. */
  span: number;
  /** 0 is round, 1 is a point. */
  peak: number;
  /** Draw the inner fold. */
  fold: boolean;
}

function ear(ctx: Context, side: 1 | -1, shape: Shape): { color: string; ink: string } {
  const { random, layout, colors } = ctx;
  const base = side === 1 ? RIGHT : LEFT;
  const { span, reach, peak, fold } = shape;

  const top = layout.at(base - span * side);
  const bottom = layout.at(base + span * side);
  const wide = layout.out(base - span * 0.35 * side, 1 + reach * 0.85);
  const tip = layout.out(base - span * peak * 0.5 * side, 1 + reach * (1 + peak * 0.5));
  const low = layout.out(base + span * 0.45 * side, 1 + reach * 0.7);

  const points: Point[] = [top, wide, tip, low, bottom];
  const color = blob(points, colors.skin, random, { slip: 1.2, opacity: 0.7, wobble: 0.8 });
  let ink = stroke(points, random, { width: 1.05, wobble: 0.7 });

  if (fold) {
    const inner: Point[] = [mix(top, tip, 0.45), mix(wide, low, 0.35), mix(bottom, tip, 0.4)];
    ink += stroke(inner, random, { width: 0.8, wobble: 0.5, passes: 1, opacity: 0.7 });
  }
  return { color, ink };
}

function pair(shape: Shape) {
  return (ctx: Context): Drawing => {
    const right = ear(ctx, 1, shape);
    const left = ear(ctx, -1, shape);
    return { color: right.color + left.color, ink: right.ink + left.ink };
  };
}

export const EARS: Catalog = {
  none: { weight: 3, draw: (): Drawing => ({}) },
  small: { weight: 6, draw: pair({ reach: 0.09, span: 0.28, peak: 0.2, fold: false }) },
  round: { weight: 4, draw: pair({ reach: 0.15, span: 0.34, peak: 0.1, fold: true }) },
  big: { weight: 3, draw: pair({ reach: 0.24, span: 0.42, peak: 0.15, fold: true }) },
  pointy: { weight: 2, draw: pair({ reach: 0.2, span: 0.3, peak: 0.9, fold: false }) },
};
