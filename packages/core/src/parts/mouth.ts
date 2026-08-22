import { arc, ring, segment, type Point } from '../geometry.js';
import { INK } from '../palette.js';
import { solid, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

interface Mouth {
  centre: Point;
  /** Half-width. */
  w: number;
  /** Half-height. */
  h: number;
}

function place(ctx: Context): Mouth {
  const { rx, ry } = ctx.layout.frame;
  return {
    centre: ctx.layout.mouth,
    w: rx * ctx.random.between(0.26, 0.42),
    h: ry * ctx.random.between(0.07, 0.13),
  };
}

const pen = { width: 1.2, wobble: 0.5 };

export const MOUTH: Catalog = {
  line: {
    weight: 5,
    draw: (ctx: Context): Drawing => {
      const { centre, w } = place(ctx);
      return {
        ink: stroke(
          segment([centre[0] - w, centre[1] + ctx.random.jitter(0.6)], [centre[0] + w, centre[1] + ctx.random.jitter(0.6)], 3),
          ctx.random,
          pen,
        ),
      };
    },
  },

  smile: {
    weight: 6,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return { ink: stroke(arc(centre[0], centre[1] - h * 0.3, w, h * 1.2, 0.15, Math.PI - 0.15, 7), ctx.random, pen) };
    },
  },

  bigSmile: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const cup = arc(centre[0], centre[1] - h * 0.4, w * 1.15, h * 1.5, 0.1, Math.PI - 0.1, 9);
      const lip = segment(cup[cup.length - 1] as Point, cup[0] as Point, 4);
      return { ink: stroke([...cup, ...lip], ctx.random, { ...pen, closed: true }) };
    },
  },

  frown: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(arc(centre[0], centre[1] + h * 0.9, w, h * 1.2, Math.PI + 0.15, Math.PI * 2 - 0.15, 7), ctx.random, pen),
      };
    },
  },

  wavy: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink: stroke(
          [
            [centre[0] - w, centre[1]],
            [centre[0] - w * 0.35, centre[1] - h * 0.7],
            [centre[0] + w * 0.35, centre[1] + h * 0.6],
            [centre[0] + w, centre[1] - h * 0.2],
          ],
          ctx.random,
          pen,
        ),
      };
    },
  },

  smirk: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const side = ctx.random.chance(0.5) ? 1 : -1;
      return {
        ink: stroke(
          [
            [centre[0] - w * side, centre[1] + h * 0.35],
            [centre[0], centre[1] + h * 0.15],
            [centre[0] + w * side, centre[1] - h * 0.7],
          ],
          ctx.random,
          pen,
        ),
      };
    },
  },

  open: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const shape = arc(centre[0], centre[1], w * 0.8, h * 1.6, 0, Math.PI * 2, 12);
      return { ink: solid(shape, INK) + stroke(shape, ctx.random, { ...pen, closed: true }) };
    },
  },

  oh: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const r = Math.min(w, h * 1.6) * 0.7;
      return { ink: stroke(arc(centre[0], centre[1], r, r * 1.2, 0, Math.PI * 2, 10), ctx.random, { ...pen, closed: true }) };
    },
  },

  teeth: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const cup = arc(centre[0], centre[1] - h * 0.2, w, h * 1.4, 0, Math.PI, 9);
      const lip = segment(cup[cup.length - 1] as Point, cup[0] as Point, 4);
      const shape = [...cup, ...lip];
      let ink = solid(shape, ctx.colors.paper) + stroke(shape, ctx.random, { ...pen, closed: true });
      const count = ctx.random.int(3, 5);
      for (let i = 1; i < count; i++) {
        const x = centre[0] - w + (2 * w * i) / count;
        ink += stroke(
          [
            [x, centre[1] - h * 0.2],
            [x + ctx.random.jitter(0.4), centre[1] + h * 0.8],
          ],
          ctx.random,
          { width: 0.7, wobble: 0.3, passes: 1, opacity: 0.8 },
        );
      }
      return { ink };
    },
  },

  grin: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const cup = arc(centre[0], centre[1] - h * 0.3, w * 1.1, h * 1.3, 0.05, Math.PI - 0.05, 9);
      const lip = segment(cup[cup.length - 1] as Point, cup[0] as Point, 4);
      const shape = [...cup, ...lip];
      const line = segment([centre[0] - w * 0.85, centre[1] - h * 0.1], [centre[0] + w * 0.85, centre[1] - h * 0.1], 4);
      return {
        ink: solid(shape, ctx.colors.paper) + stroke(shape, ctx.random, { ...pen, closed: true }) + stroke(line, ctx.random, { width: 0.9, wobble: 0.3, passes: 1 }),
      };
    },
  },

  tongue: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const cup = arc(centre[0], centre[1] - h * 0.3, w, h * 1.6, 0.05, Math.PI - 0.05, 9);
      const lip = segment(cup[cup.length - 1] as Point, cup[0] as Point, 4);
      const shape = [...cup, ...lip];
      const tip = arc(centre[0] + w * 0.15, centre[1] + h * 1.1, w * 0.35, h * 0.7, 0, Math.PI * 2, 8);
      return {
        ink:
          solid(shape, INK) +
          stroke(shape, ctx.random, { ...pen, closed: true }) +
          solid(tip, ctx.colors.clothes) +
          stroke(tip, ctx.random, { width: 0.9, wobble: 0.4, closed: true }),
      };
    },
  },

  kiss: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const top = arc(centre[0], centre[1], w * 0.5, h * 0.9, Math.PI, Math.PI * 2, 6);
      const bottom = arc(centre[0], centre[1], w * 0.5, h * 1.1, 0, Math.PI, 6);
      return { ink: stroke(ring(top, bottom), ctx.random, { ...pen, closed: true }) };
    },
  },

  cat: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      return {
        ink:
          stroke(arc(centre[0] - w * 0.5, centre[1], w * 0.5, h, 0, Math.PI, 5), ctx.random, pen) +
          stroke(arc(centre[0] + w * 0.5, centre[1], w * 0.5, h, 0, Math.PI, 5), ctx.random, pen),
      };
    },
  },

  grimace: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { centre, w, h } = place(ctx);
      const box: Point[] = [
        [centre[0] - w, centre[1] - h],
        [centre[0] + w, centre[1] - h],
        [centre[0] + w, centre[1] + h],
        [centre[0] - w, centre[1] + h],
      ];
      let ink = solid(box, ctx.colors.paper) + stroke(box, ctx.random, { ...pen, closed: true });
      const count = ctx.random.int(4, 6);
      for (let i = 1; i < count; i++) {
        const x = centre[0] - w + (2 * w * i) / count;
        ink += stroke(
          [
            [x, centre[1] - h],
            [x, centre[1] + h],
          ],
          ctx.random,
          { width: 0.7, wobble: 0.3, passes: 1, opacity: 0.8 },
        );
      }
      return { ink };
    },
  },
};
