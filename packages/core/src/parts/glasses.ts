import { arc, loop, segment, type Point } from '../geometry.js';
import { blob, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

interface Frames {
  /** Half-width and half-height of one lens. */
  w: number;
  h: number;
  left: Point;
  right: Point;
}

function measure(ctx: Context): Frames {
  const { left, right, radius } = ctx.layout.eyes;
  return { w: radius * ctx.random.between(1.5, 1.9), h: radius * ctx.random.between(1.4, 1.8), left, right };
}

function bridge(ctx: Context, frames: Frames, drop = 0): string {
  const { left, right, w } = frames;
  return stroke(
    segment([left[0] + w, left[1] + drop], [right[0] - w, right[1] + drop], 2),
    ctx.random,
    { width: 1, wobble: 0.4 },
  );
}

/** The arms, running from each lens back towards the ears. */
function temples(ctx: Context, frames: Frames): string {
  const { left, right, w } = frames;
  const reach = ctx.layout.frame.rx * 0.32;
  return (
    stroke(segment([left[0] - w, left[1]], [left[0] - w - reach, left[1] - reach * 0.25], 2), ctx.random, { width: 1, wobble: 0.4, passes: 1 }) +
    stroke(segment([right[0] + w, right[1]], [right[0] + w + reach, right[1] - reach * 0.25], 2), ctx.random, { width: 1, wobble: 0.4, passes: 1 })
  );
}

function lenses(ctx: Context, frames: Frames, shape: (c: Point) => Point[], tint?: string): string {
  const { left, right } = frames;
  let out = '';
  for (const centre of [left, right]) {
    const points = shape(centre);
    if (tint) out += blob(points, tint, ctx.random, { slip: 0.6, opacity: 0.45, wobble: 0.5 });
    out += stroke(points, ctx.random, { closed: true, width: 1.1, wobble: 0.45 });
  }
  return out;
}

const box = (c: Point, w: number, h: number): Point[] => [
  [c[0] - w, c[1] - h],
  [c[0] + w, c[1] - h],
  [c[0] + w, c[1] + h],
  [c[0] - w, c[1] + h],
];

export const GLASSES: Catalog = {
  none: { weight: 40, draw: (): Drawing => ({}) },

  round: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      return { ink: lenses(ctx, f, (c) => loop(c[0], c[1], f.w, f.h, 12)) + bridge(ctx, f) + temples(ctx, f) };
    },
  },

  square: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      return { ink: lenses(ctx, f, (c) => box(c, f.w, f.h * 0.85)) + bridge(ctx, f) + temples(ctx, f) };
    },
  },

  thick: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      const { left, right } = f;
      let ink = '';
      for (const centre of [left, right]) {
        ink += stroke(box(centre, f.w, f.h * 0.9), ctx.random, { closed: true, width: 2.4, wobble: 0.5, passes: 3 });
      }
      return { ink: ink + bridge(ctx, f, -f.h * 0.5) + temples(ctx, f) };
    },
  },

  halfMoon: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      let ink = '';
      for (const centre of [f.left, f.right]) {
        const cup = arc(centre[0], centre[1], f.w, f.h, 0, Math.PI, 7);
        ink += stroke([...cup, cup[0] as Point], ctx.random, { closed: true, width: 1.05, wobble: 0.45 });
      }
      return { ink: ink + bridge(ctx, f) + temples(ctx, f) };
    },
  },

  cateye: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      const shape = (c: Point): Point[] => [
        [c[0] - f.w, c[1] - f.h * 0.4],
        [c[0] - f.w * 0.3, c[1] - f.h],
        [c[0] + f.w * 1.1, c[1] - f.h * 1.2],
        [c[0] + f.w * 0.9, c[1] + f.h * 0.4],
        [c[0] - f.w * 0.4, c[1] + f.h],
      ];
      return { ink: lenses(ctx, f, shape) + bridge(ctx, f) + temples(ctx, f) };
    },
  },

  sunglasses: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      return {
        ink: lenses(ctx, f, (c) => box(c, f.w, f.h * 0.85), ctx.colors.ink) + bridge(ctx, f, -f.h * 0.6) + temples(ctx, f),
      };
    },
  },

  shades: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      return {
        ink:
          lenses(ctx, f, (c) => loop(c[0], c[1], f.w * 1.05, f.h * 0.85, 12), ctx.colors.clothes) +
          bridge(ctx, f) +
          temples(ctx, f),
      };
    },
  },

  sport: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      const band: Point[] = [
        [f.left[0] - f.w, f.left[1] - f.h * 0.7],
        [f.right[0] + f.w, f.right[1] - f.h * 0.7],
        [f.right[0] + f.w * 0.9, f.right[1] + f.h * 0.7],
        [f.left[0] - f.w * 0.9, f.left[1] + f.h * 0.7],
      ];
      return {
        ink:
          blob(band, ctx.colors.clothes, ctx.random, { slip: 0.6, opacity: 0.45, wobble: 0.6 }) +
          stroke(band, ctx.random, { closed: true, width: 1.15, wobble: 0.5 }) +
          temples(ctx, f),
      };
    },
  },

  monocle: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      const centre = ctx.random.chance(0.5) ? f.left : f.right;
      const lens = loop(centre[0], centre[1], f.w, f.h, 12);
      const chain = segment([centre[0], centre[1] + f.h], [centre[0] + f.w * 0.4, centre[1] + f.h * 3.2], 4);
      return {
        ink:
          stroke(lens, ctx.random, { closed: true, width: 1.15, wobble: 0.45 }) +
          stroke(chain, ctx.random, { width: 0.8, wobble: 0.7, passes: 1 }),
      };
    },
  },

  reading: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const f = measure(ctx);
      const drop = ctx.layout.frame.ry * 0.12;
      const low: Frames = { ...f, left: [f.left[0], f.left[1] + drop], right: [f.right[0], f.right[1] + drop] };
      return {
        ink: lenses(ctx, low, (c) => loop(c[0], c[1], low.w * 0.9, low.h * 0.7, 10)) + bridge(ctx, low) + temples(ctx, low),
      };
    },
  },
};
