import { merge } from '../drawing.js';
import { arc, loop, ring, traceOutline, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/** A band of cloth sitting on the head, between two angles. */
function dome(ctx: Context, from: number, to: number, height: number, base = 1.02): Point[] {
  const { at, frame } = ctx.layout;
  return ring(traceOutline(at, frame, from, to, 14, base + height), traceOutline(at, frame, from, to, 14, base));
}

function cloth(ctx: Context, points: readonly Point[], color?: string, width = 1.2): Drawing {
  const { random, colors } = ctx;
  return {
    color: blob(points, color ?? colors.clothes, random, { slip: 1.4, opacity: 0.88, wobble: 0.9 }),
    ink: stroke(points, random, { closed: true, width, wobble: 0.7 }),
  };
}

const SIDE_R = -0.35;
const SIDE_L = -Math.PI + 0.35;

export const HAT: Catalog = {
  none: { weight: 45, draw: (): Drawing => ({}) },

  cap: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const brow = ctx.layout.out(side === 1 ? -0.55 : -Math.PI + 0.55, 1.02);
      const tip = ctx.layout.out(side === 1 ? -0.15 : -Math.PI + 0.15, 1.55);
      const visor: Point[] = [brow, [tip[0], tip[1] + 1.5], [tip[0], tip[1] - 1], ctx.layout.out(side === 1 ? -0.9 : -Math.PI + 0.9, 1.02)];
      const button = ctx.layout.out(-Math.PI / 2, 1.14);
      return merge(cloth(ctx, visor, undefined, 1.1), cloth(ctx, dome(ctx, SIDE_R, SIDE_L, 0.12)), {
        ink: dot(button[0], button[1], 0.9),
      });
    },
  },

  beanie: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const cuff = dome(ctx, -0.1, -Math.PI + 0.1, 0.07, 1.01);
      const body = dome(ctx, -0.25, -Math.PI + 0.25, 0.22, 1.06);
      const top = ctx.layout.out(-Math.PI / 2, 1.3);
      return merge(
        cloth(ctx, body),
        cloth(ctx, cuff, ctx.colors.background, 1.15),
        cloth(ctx, loop(top[0], top[1], 2.6, 2.6, 10), ctx.colors.background, 1),
      );
    },
  },

  beret: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const seat = ctx.layout.out(-Math.PI / 2 + side * 0.3, 1.05);
      const rx = ctx.layout.frame.rx;
      const disc = loop(seat[0] + side * rx * 0.15, seat[1] - rx * 0.12, rx * 0.85, rx * 0.38, 14);
      const nub = loop(seat[0] + side * rx * 0.55, seat[1] - rx * 0.3, 1.6, 1.6, 8);
      return merge(cloth(ctx, disc), cloth(ctx, nub, undefined, 1));
    },
  },

  brim: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { cx, rx } = ctx.layout.frame;
      const band = ctx.layout.out(-Math.PI / 2, 1.02)[1] + rx * 0.55;
      const brimShape = loop(cx, band, rx * 1.5, rx * 0.24, 16);
      const crownShape = dome(ctx, -0.35, -Math.PI + 0.35, 0.32, 1.02);
      return merge(cloth(ctx, brimShape), cloth(ctx, crownShape), {
        ink: stroke(loop(cx, band - rx * 0.12, rx * 0.78, rx * 0.18, 12), ctx.random, {
          closed: true,
          width: 1.1,
          wobble: 0.5,
          passes: 1,
        }),
      });
    },
  },

  headband: {
    weight: 3,
    draw: (ctx: Context): Drawing => cloth(ctx, dome(ctx, -0.15, -Math.PI + 0.15, 0.07, 1.01), ctx.colors.background, 1.1),
  },

  bandana: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const knot = ctx.layout.out(side === 1 ? -0.2 : -Math.PI + 0.2, 1.08);
      const rx = ctx.layout.frame.rx;
      const tails: Point[] = [
        knot,
        [knot[0] + side * rx * 0.4, knot[1] - rx * 0.2],
        [knot[0] + side * rx * 0.45, knot[1] + rx * 0.25],
      ];
      return merge(cloth(ctx, dome(ctx, -0.2, -Math.PI + 0.2, 0.1, 1.02)), cloth(ctx, tails, undefined, 1));
    },
  },

  crown: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { at, frame } = ctx.layout;
      const base = traceOutline(at, frame, -0.5, -Math.PI + 0.5, 6, 1.02);
      const spikes: Point[] = [];
      for (let i = 0; i < base.length; i++) {
        const t = -0.5 + ((-Math.PI + 0.5 - -0.5) * i) / (base.length - 1);
        spikes.push(ctx.layout.out(t, i % 2 === 0 ? 1.28 : 1.08));
      }
      return cloth(ctx, ring(spikes, base), ctx.colors.background, 1.1);
    },
  },

  bow: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const seat = ctx.layout.out(-Math.PI / 2 + side * 0.55, 1.06);
      const rx = ctx.layout.frame.rx;
      const wing = (dir: 1 | -1): Point[] => [
        seat,
        [seat[0] + dir * rx * 0.36, seat[1] - rx * 0.24],
        [seat[0] + dir * rx * 0.4, seat[1] + rx * 0.14],
      ];
      return merge(cloth(ctx, wing(1), ctx.colors.background, 1.05), cloth(ctx, wing(-1), ctx.colors.background, 1.05), {
        ink: dot(seat[0], seat[1], 1.1),
      });
    },
  },

  flower: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const seat = ctx.layout.out(-0.5 + (side === 1 ? 0 : Math.PI), 1.06);
      let out: Drawing = {};
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * Math.PI * 2;
        out = merge(out, cloth(ctx, loop(seat[0] + Math.cos(t) * 2.4, seat[1] + Math.sin(t) * 2.4, 1.7, 1.7, 8), ctx.colors.background, 0.9));
      }
      return merge(out, { ink: dot(seat[0], seat[1], 1.2, ctx.colors.ink) });
    },
  },

  halo: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { cx } = ctx.layout.frame;
      const top = ctx.layout.out(-Math.PI / 2, 1.28);
      return {
        ink: stroke(arc(cx, top[1], ctx.layout.frame.rx * 0.62, ctx.layout.frame.rx * 0.2, 0, Math.PI * 2, 14), ctx.random, {
          closed: true,
          width: 1.1,
          wobble: 0.5,
        }),
      };
    },
  },
};
