import { arc, segment, type Point } from '../geometry.js';
import { dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

interface Nose {
  centre: Point;
  /** Half-width. */
  w: number;
  /** Half-height. */
  h: number;
}

function place(ctx: Context): Nose {
  const { rx, ry } = ctx.layout.frame;
  return {
    centre: ctx.layout.nose,
    w: rx * ctx.random.between(0.1, 0.16),
    h: ry * ctx.random.between(0.08, 0.13),
  };
}

const pen = { width: 1.1, wobble: 0.5 };

export const NOSE: Catalog = {
  none: { weight: 2, draw: (): Drawing => ({}) },

  dot: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const { centre, w } = place(ctx);
      return { ink: dot(centre[0], centre[1], w * ctx.random.between(0.35, 0.55)) };
    },
  },

  line: {
    weight: 5,
    draw: (ctx: Context): Drawing => {
      const { centre, h } = place(ctx);
      return {
        ink: stroke(segment([centre[0], centre[1] - h], [centre[0] + ctx.random.jitter(1), centre[1] + h], 3), ctx.random, pen),
      };
    },
  },

  hook: {
    weight: 5,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(
          [
            [centre[0] + w * 0.4, centre[1] - h],
            [centre[0] + w * 0.5, centre[1] + h * 0.3],
            [centre[0] - w * 0.6, centre[1] + h],
          ],
          ctx.random,
          pen,
        ),
      };
    },
  },

  button: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return { ink: stroke(arc(centre[0], centre[1], w, h, 0, Math.PI, 6), ctx.random, pen) };
    },
  },

  wide: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink:
          stroke(arc(centre[0], centre[1], w * 1.5, h * 0.8, 0, Math.PI, 7), ctx.random, pen) +
          dot(centre[0] - w * 1.1, centre[1] - h * 0.1, 0.5) +
          dot(centre[0] + w * 1.1, centre[1] - h * 0.1, 0.5),
      };
    },
  },

  long: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(
          [
            [centre[0] + ctx.random.jitter(0.6), centre[1] - h * 1.6],
            [centre[0] + w * 0.2, centre[1] + h * 0.6],
            [centre[0] - w * 0.7, centre[1] + h * 1.2],
          ],
          ctx.random,
          pen,
        ),
      };
    },
  },

  triangle: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(
          [
            [centre[0], centre[1] - h * 1.2],
            [centre[0] + w, centre[1] + h],
            [centre[0] - w, centre[1] + h],
          ],
          ctx.random,
          { ...pen, closed: true },
        ),
      };
    },
  },

  upturned: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(
          [
            [centre[0] - w * 0.2, centre[1] - h],
            [centre[0] - w * 0.6, centre[1] + h * 0.5],
            [centre[0] + w, centre[1] + h * 0.2],
          ],
          ctx.random,
          pen,
        ),
      };
    },
  },

  bulb: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(arc(centre[0], centre[1] - h * 0.2, w * 1.1, h * 1.2, -0.5, Math.PI + 0.5, 9), ctx.random, pen),
      };
    },
  },

  nostrils: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink:
          stroke(arc(centre[0] - w * 0.8, centre[1], w * 0.4, h * 0.4, -0.4, Math.PI + 0.4, 5), ctx.random, pen) +
          stroke(arc(centre[0] + w * 0.8, centre[1], w * 0.4, h * 0.4, -0.4, Math.PI + 0.4, 5), ctx.random, pen),
      };
    },
  },
};
