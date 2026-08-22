import { FACE_SHAPES, type Point } from '../geometry.js';
import { blob, solid, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing, Variant } from '../types.js';

/**
 * The silhouette itself is built in `render`, because every other part needs to
 * know it before it can be drawn. All this does is put it on paper.
 */
function draw({ random, layout, colors }: Context): Drawing {
  const points = layout.outline;

  // A hand-drawn outline often does not quite meet itself. Leaving the gap in
  // is the difference between a drawing and a shape.
  const open = random.chance(0.35);
  let line: Point[] = points;
  if (open) {
    const start = random.int(0, points.length - 1);
    const gap = random.int(2, 4);
    line = [];
    for (let i = gap; i < points.length; i++) line.push(points[(start + i) % points.length] as Point);
  }

  return {
    mask: solid(points, colors.paper),
    color: blob(points, colors.skin, random, { slip: 1.9, opacity: 0.85, wobble: 1.1 }),
    ink: stroke(line, random, { closed: !open, width: 1.35, wobble: 0.85 }),
  };
}

const WEIGHTS: Record<string, number> = {
  oval: 5,
  round: 4,
  egg: 3,
  pear: 3,
  long: 2,
  wide: 2,
  square: 2,
  potato: 2,
  triangle: 1,
  heart: 1,
};

export const FACE: Catalog = Object.fromEntries(
  FACE_SHAPES.map((shape): [string, Variant] => [shape, { weight: WEIGHTS[shape] ?? 1, draw }]),
);
