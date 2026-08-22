import { merge } from '../drawing.js';
import { arc, segment, type Point } from '../geometry.js';
import { stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/** Wide-open eyes need their brows further out of the way. */
function lift(ctx: Context): number {
  const roomy = ['wide', 'surprised', 'lashes', 'round'].includes(ctx.options.eyes ?? '');
  return ctx.layout.eyes.radius * (roomy ? 2.5 : 1.9);
}

function brows(fn: (ctx: Context, centre: Point, half: number, side: 1 | -1) => Drawing) {
  return (ctx: Context): Drawing => {
    const { left, right, radius } = ctx.layout.eyes;
    const up = lift(ctx);
    const half = radius * ctx.random.between(1.15, 1.45);
    return merge(
      fn(ctx, [left[0] + ctx.random.jitter(0.4), left[1] - up * ctx.random.between(0.92, 1.08)], half, -1),
      fn(ctx, [right[0] + ctx.random.jitter(0.4), right[1] - up * ctx.random.between(0.92, 1.08)], half, 1),
    );
  };
}

const pen = (width: number) => ({ width, wobble: 0.45 });

export const BROWS: Catalog = {
  none: { weight: 2, draw: (): Drawing => ({}) },

  straight: {
    weight: 5,
    draw: brows((ctx, c, h) => ({
      ink: stroke(segment([c[0] - h, c[1]], [c[0] + h, c[1] + ctx.random.jitter(0.5)], 3), ctx.random, pen(1.1)),
    })),
  },

  arched: {
    weight: 5,
    draw: brows((ctx, c, h) => ({
      ink: stroke(arc(c[0], c[1] + h * 0.45, h, h * 0.6, Math.PI, Math.PI * 2, 5), ctx.random, pen(1.1)),
    })),
  },

  thick: {
    weight: 4,
    draw: brows((ctx, c, h) => ({
      ink: stroke(arc(c[0], c[1] + h * 0.3, h * 1.05, h * 0.45, Math.PI, Math.PI * 2, 5), ctx.random, {
        width: 2.4,
        wobble: 0.5,
        passes: 3,
      }),
    })),
  },

  thin: {
    weight: 3,
    draw: brows((ctx, c, h) => ({
      ink: stroke(arc(c[0], c[1] + h * 0.4, h * 0.9, h * 0.5, Math.PI, Math.PI * 2, 5), ctx.random, {
        width: 0.7,
        wobble: 0.35,
        passes: 1,
      }),
    })),
  },

  angry: {
    weight: 3,
    draw: brows((ctx, c, h, side) => ({
      ink: stroke(segment([c[0] - h * side, c[1] - h * 0.35], [c[0] + h * side, c[1] + h * 0.35], 3), ctx.random, pen(1.3)),
    })),
  },

  worried: {
    weight: 3,
    draw: brows((ctx, c, h, side) => ({
      ink: stroke(segment([c[0] - h * side, c[1] + h * 0.35], [c[0] + h * side, c[1] - h * 0.3], 3), ctx.random, pen(1.1)),
    })),
  },

  raised: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const high = ctx.random.chance(0.5) ? 1 : -1;
      return brows((inner, c, h, side) => {
        const y = side === high ? c[1] - h * 0.55 : c[1];
        return {
          ink: stroke(arc(c[0], y + h * 0.4, h, h * 0.55, Math.PI, Math.PI * 2, 5), inner.random, pen(1.1)),
        };
      })(ctx);
    },
  },

  wiggly: {
    weight: 2,
    draw: brows((ctx, c, h) => ({
      ink: stroke(
        [
          [c[0] - h, c[1] + h * 0.2],
          [c[0] - h * 0.35, c[1] - h * 0.3],
          [c[0] + h * 0.35, c[1] + h * 0.2],
          [c[0] + h, c[1] - h * 0.25],
        ],
        ctx.random,
        pen(1.05),
      ),
    })),
  },

  bushy: {
    weight: 2,
    draw: brows((ctx, c, h) => {
      let ink = stroke(arc(c[0], c[1] + h * 0.3, h * 1.1, h * 0.5, Math.PI, Math.PI * 2, 5), ctx.random, {
        width: 2,
        wobble: 0.6,
        passes: 2,
      });
      for (let i = 0; i < 5; i++) {
        const x = c[0] - h + (2 * h * i) / 4;
        ink += stroke(
          [
            [x, c[1] + ctx.random.jitter(0.4)],
            [x + ctx.random.jitter(0.8), c[1] - h * ctx.random.between(0.4, 0.8)],
          ],
          ctx.random,
          { width: 0.7, wobble: 0.3, passes: 1 },
        );
      }
      return { ink };
    }),
  },

  unibrow: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { left, right, radius } = ctx.layout.eyes;
      const up = lift(ctx);
      const h = radius * 1.3;
      const y = (left[1] + right[1]) / 2 - up;
      return {
        ink: stroke(
          [
            [left[0] - h, y + ctx.random.jitter(0.6)],
            [left[0], y - h * 0.3],
            [(left[0] + right[0]) / 2, y - h * 0.1],
            [right[0], y - h * 0.3],
            [right[0] + h, y + ctx.random.jitter(0.6)],
          ],
          ctx.random,
          { width: 2, wobble: 0.55, passes: 2 },
        ),
      };
    },
  },
};
