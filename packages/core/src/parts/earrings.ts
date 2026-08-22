import { arc, loop, segment, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/** Roughly where a lobe sits on either side of the head. */
const LOBE = 0.32;

function lobes(ctx: Context): [Point, Point] {
  const roomy = ctx.options.ears === 'big' || ctx.options.ears === 'round';
  const push = roomy ? 1.16 : 1.04;
  return [ctx.layout.out(Math.PI - LOBE, push), ctx.layout.out(LOBE, push)];
}

function both(fn: (ctx: Context, at: Point, side: 1 | -1) => Drawing) {
  return (ctx: Context): Drawing => {
    const [left, right] = lobes(ctx);
    const a = fn(ctx, left, -1);
    const b = fn(ctx, right, 1);
    return { color: (a.color ?? '') + (b.color ?? ''), ink: (a.ink ?? '') + (b.ink ?? '') };
  };
}

export const EARRINGS: Catalog = {
  none: { weight: 36, draw: (): Drawing => ({}) },

  studs: {
    weight: 3,
    draw: both((ctx, at) => ({ ink: dot(at[0], at[1], ctx.random.between(0.7, 1.1), ctx.colors.background) + dot(at[0], at[1], 0.35, ctx.colors.ink, 0.5) })),
  },

  hoops: {
    weight: 3,
    draw: both((ctx, at) => {
      const r = ctx.layout.frame.rx * ctx.random.between(0.12, 0.2);
      return {
        ink: stroke(loop(at[0], at[1] + r * 0.7, r, r, 10), ctx.random, { closed: true, width: 1, wobble: 0.4 }),
      };
    }),
  },

  drops: {
    weight: 2,
    draw: both((ctx, at) => {
      const drop = ctx.layout.frame.ry * ctx.random.between(0.14, 0.24);
      const bead = loop(at[0], at[1] + drop, 1.4, 1.8, 8);
      return {
        color: blob(bead, ctx.colors.background, ctx.random, { slip: 0.5, opacity: 0.9, wobble: 0.4 }),
        ink:
          stroke(segment(at, [at[0], at[1] + drop], 2), ctx.random, { width: 0.8, wobble: 0.35, passes: 1 }) +
          stroke(bead, ctx.random, { closed: true, width: 0.9, wobble: 0.35 }),
      };
    }),
  },

  pearls: {
    weight: 2,
    draw: both((ctx, at) => {
      let ink = '';
      for (let i = 0; i < 3; i++) ink += dot(at[0], at[1] + i * 1.8, 0.8, ctx.colors.paper) + stroke(loop(at[0], at[1] + i * 1.8, 0.9, 0.9, 6), ctx.random, { closed: true, width: 0.6, wobble: 0.2, passes: 1 });
      return { ink };
    }),
  },

  single: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const [left, right] = lobes(ctx);
      const at = ctx.random.chance(0.5) ? left : right;
      const r = ctx.layout.frame.rx * 0.17;
      return {
        ink: stroke(arc(at[0], at[1] + r * 0.6, r, r, 0, Math.PI * 2, 10), ctx.random, { closed: true, width: 1, wobble: 0.4 }),
      };
    },
  },
};
