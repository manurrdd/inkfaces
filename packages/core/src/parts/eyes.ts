import { merge } from '../drawing.js';
import { arc, loop, segment, type Point } from '../geometry.js';
import { dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/**
 * Draws the same idea twice, never quite identically. Eyes that match exactly
 * are the fastest way to make a hand-drawn face look printed.
 */
function eyes(fn: (ctx: Context, centre: Point, radius: number, side: 1 | -1) => Drawing) {
  return (ctx: Context): Drawing => {
    const { left, right, radius } = ctx.layout.eyes;
    return merge(
      fn(ctx, left, radius * ctx.random.between(0.88, 1.12), -1),
      fn(ctx, right, radius * ctx.random.between(0.88, 1.12), 1),
    );
  };
}

const ring = (c: Point, rx: number, ry: number): Point[] => loop(c[0], c[1], rx, ry, 12);

export const EYES: Catalog = {
  dots: {
    weight: 5,
    draw: eyes((ctx, c, r) => ({ ink: dot(c[0], c[1], r * ctx.random.between(0.42, 0.58)) })),
  },

  round: {
    weight: 5,
    draw: eyes((ctx, c, r) => ({
      ink:
        stroke(ring(c, r, r * ctx.random.between(0.9, 1.1)), ctx.random, { closed: true, width: 1, wobble: 0.45 }) +
        dot(c[0] + ctx.random.jitter(r * 0.25), c[1] + ctx.random.jitter(r * 0.2), r * 0.4),
    })),
  },

  wide: {
    weight: 3,
    draw: eyes((ctx, c, r) => ({
      ink:
        stroke(ring(c, r * 1.35, r * 1.15), ctx.random, { closed: true, width: 1, wobble: 0.5 }) +
        dot(c[0] + ctx.random.jitter(r * 0.3), c[1] + ctx.random.jitter(r * 0.25), r * 0.38),
    })),
  },

  surprised: {
    weight: 2,
    draw: eyes((ctx, c, r) => ({
      ink:
        stroke(ring(c, r * 1.15, r * 1.5), ctx.random, { closed: true, width: 1, wobble: 0.5 }) +
        dot(c[0], c[1] + r * 0.1, r * 0.28),
    })),
  },

  lines: {
    weight: 3,
    draw: eyes((ctx, c, r) => ({
      ink: stroke(segment([c[0] - r, c[1]], [c[0] + r, c[1]], 3), ctx.random, { width: 1.15, wobble: 0.5 }),
    })),
  },

  happy: {
    weight: 4,
    draw: eyes((ctx, c, r) => ({
      ink: stroke(arc(c[0], c[1] + r * 0.4, r * 1.05, r * 0.95, Math.PI, Math.PI * 2, 6), ctx.random, {
        width: 1.2,
        wobble: 0.4,
      }),
    })),
  },

  sleepy: {
    weight: 2,
    draw: eyes((ctx, c, r) => ({
      ink: stroke(arc(c[0], c[1] - r * 0.3, r * 1.05, r * 0.9, 0, Math.PI, 6), ctx.random, { width: 1.2, wobble: 0.4 }),
    })),
  },

  tired: {
    weight: 2,
    draw: eyes((ctx, c, r) => ({
      ink:
        stroke(arc(c[0], c[1], r, r, 0, Math.PI, 6), ctx.random, { width: 1, wobble: 0.4 }) +
        stroke(segment([c[0] - r * 1.1, c[1]], [c[0] + r * 1.1, c[1]], 3), ctx.random, { width: 1.05, wobble: 0.4 }) +
        dot(c[0], c[1] + r * 0.35, r * 0.3),
    })),
  },

  squint: {
    weight: 2,
    draw: eyes((ctx, c, r, side) => ({
      ink: stroke(
        [
          [c[0] - r, c[1] + r * 0.35 * side],
          [c[0], c[1] - r * 0.1],
          [c[0] + r, c[1] + r * 0.35 * -side],
        ],
        ctx.random,
        { width: 1.1, wobble: 0.4 },
      ),
    })),
  },

  lashes: {
    weight: 2,
    draw: eyes((ctx, c, r) => {
      let ink =
        stroke(ring(c, r, r * 1.05), ctx.random, { closed: true, width: 1, wobble: 0.45 }) + dot(c[0], c[1], r * 0.42);
      for (let i = 0; i < 3; i++) {
        const t = Math.PI * (1.15 + i * 0.22);
        const from: Point = [c[0] + r * Math.cos(t), c[1] + r * 1.05 * Math.sin(t)];
        const to: Point = [c[0] + r * 1.75 * Math.cos(t), c[1] + r * 1.8 * Math.sin(t)];
        ink += stroke([from, to], ctx.random, { width: 0.8, wobble: 0.3, passes: 1 });
      }
      return { ink };
    }),
  },

  sideways: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const shift = ctx.random.between(-0.45, 0.45);
      return eyes((inner, c, r) => ({
        ink:
          stroke(ring(c, r, r), inner.random, { closed: true, width: 1, wobble: 0.45 }) +
          dot(c[0] + r * shift, c[1] + inner.random.jitter(r * 0.15), r * 0.4),
      }))(ctx);
    },
  },

  wink: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const closed = ctx.random.chance(0.5) ? -1 : 1;
      return eyes((inner, c, r, side) =>
        side === closed
          ? { ink: stroke(arc(c[0], c[1] + r * 0.4, r * 1.05, r, Math.PI, Math.PI * 2, 6), inner.random, { width: 1.2, wobble: 0.4 }) }
          : {
              ink:
                stroke(ring(c, r, r * 1.05), inner.random, { closed: true, width: 1, wobble: 0.45 }) +
                dot(c[0], c[1], r * 0.42),
            },
      )(ctx);
    },
  },

  cross: {
    weight: 1,
    draw: eyes((ctx, c, r) => ({
      ink:
        stroke([[c[0] - r, c[1] - r], [c[0] + r, c[1] + r]], ctx.random, { width: 1.15, wobble: 0.5 }) +
        stroke([[c[0] + r, c[1] - r], [c[0] - r, c[1] + r]], ctx.random, { width: 1.15, wobble: 0.5 }),
    })),
  },

  stars: {
    weight: 1,
    draw: eyes((ctx, c, r) => {
      let ink = '';
      for (let i = 0; i < 3; i++) {
        const t = (i / 3) * Math.PI;
        ink += stroke(
          [
            [c[0] - r * Math.cos(t), c[1] - r * Math.sin(t)],
            [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)],
          ],
          ctx.random,
          { width: 0.9, wobble: 0.35, passes: 1 },
        );
      }
      return { ink };
    }),
  },
};
