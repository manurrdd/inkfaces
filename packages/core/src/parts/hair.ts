import { merge } from '../drawing.js';
import { TAU, bow, loop, mix, ring, traceOutline, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/** Radians above the ear where a hairline naturally starts. */
const START = 0.5;

/** Samples the silhouette between two angles, scaled outward per sample. */
function sweep(ctx: Context, from: number, to: number, samples: number, scale: (t: number) => number): Point[] {
  const { at, frame } = ctx.layout;
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = from + (to - from) * (i / samples);
    const [x, y] = at(t);
    const k = scale(t);
    out.push([frame.cx + (x - frame.cx) * k, frame.cy + (y - frame.cy) * k]);
  }
  return out;
}

interface CrownOptions {
  /** How far down the sides the hair reaches. 0 is a skullcap, 1.2 reaches the jaw. */
  drop?: number;
  /** Outward thickness, as a fraction of the head. */
  puff?: number;
  /** Hairline height. Negative bares the forehead, positive covers it. */
  sag?: number;
  /** Depth of the scallops on the outer edge. */
  ripple?: number;
  /** How many scallops go round the head. */
  waves?: number;
}

interface Crown {
  /** The closed mass of hair. */
  band: Point[];
  /** The hairline, right to left. */
  inner: Point[];
  outer: Point[];
  from: number;
  to: number;
}

function crown(ctx: Context, options: CrownOptions = {}): Crown {
  const { drop = 0.5, puff = 0.08, sag = -0.06, ripple = 0, waves = 8 } = options;
  const { at, frame } = ctx.layout;
  const from = -START + drop;
  const to = -Math.PI - from;
  const phase = ctx.random.between(0, TAU);
  const samples = ripple > 0 ? 26 : 16;

  const outer = sweep(ctx, from, to, samples, (t) => 1 + puff * (1 + ripple * Math.sin(waves * t + phase)));

  // The hairline hugs the outline down each side and only cuts across the
  // forehead between the temples. Without this, reaching further down the sides
  // would drag the fringe down with it and swallow the whole face.
  const templeRight = Math.min(-0.85, from - 0.1);
  const templeLeft = -Math.PI - templeRight;
  const inner = [
    ...traceOutline(at, frame, from, templeRight, 4, 0.99),
    ...bow(at(templeRight), at(templeLeft), sag * frame.ry, 8),
    ...traceOutline(at, frame, templeLeft, to, 4, 0.99),
  ];

  return { band: ring(outer, inner), inner, outer, from, to };
}

/** Colour patch plus outline, in the hair colour. */
function mass(ctx: Context, points: readonly Point[], width = 1.15): Drawing {
  const { random, colors } = ctx;
  return {
    color: blob(points, colors.hair, random, { slip: 1.5, opacity: 0.88, wobble: 1 }),
    ink: stroke(points, random, { closed: true, width, wobble: 0.8 }),
  };
}

function spikes(ctx: Context, from: number, to: number, count: number, length: number): Drawing {
  const { random, layout } = ctx;
  const width = ((to - from) / count) * 0.45;
  let out: Drawing = {};
  for (let i = 0; i < count; i++) {
    const t = from + (to - from) * ((i + 0.5) / count);
    const points: Point[] = [
      layout.out(t - width, 1.01),
      layout.out(t + random.jitter(0.06), 1 + length * random.between(0.6, 1.4)),
      layout.out(t + width, 1.01),
    ];
    out = merge(out, mass(ctx, points, 0.95));
  }
  return out;
}

/** Lines running from the hairline back over the skull. */
function rows(ctx: Context, shape: Crown, count: number): string {
  const { random } = ctx;
  let ink = '';
  for (let i = 1; i < count; i++) {
    const u = i / count;
    const a = shape.inner[Math.round(u * (shape.inner.length - 1))] as Point;
    const b = shape.outer[Math.round(u * (shape.outer.length - 1))] as Point;
    ink += stroke([a, mix(a, b, 0.5), b], random, { width: 0.7, wobble: 0.4, passes: 1, opacity: 0.75 });
  }
  return ink;
}

/** Loose strands, drawn from the hairline upward. */
function strands(ctx: Context, shape: Crown, count: number, length: number): string {
  const { random, layout } = ctx;
  let ink = '';
  for (let i = 0; i < count; i++) {
    const t = shape.from + (shape.to - shape.from) * random.num();
    const root = layout.out(t, 1);
    const tip = layout.out(t + random.jitter(0.25), 1 + length * random.between(0.5, 1.4));
    ink += stroke([root, mix(root, tip, 0.5), tip], random, { width: 0.9, wobble: 0.7, passes: 1 });
  }
  return ink;
}

/** Hair falling behind the head and shoulders. */
function fall(ctx: Context, reach: number, ripple = 0): Drawing {
  const phase = ctx.random.between(0, TAU);
  const outer = sweep(ctx, 0.2, Math.PI - 0.2, 20, (t) => 1 + reach * (1 + ripple * Math.sin(7 * t + phase)));
  const inner = sweep(ctx, 0.2, Math.PI - 0.2, 14, () => 0.98);
  const points = ring(outer, inner);
  const { random, colors } = ctx;
  return {
    back:
      blob(points, colors.hair, random, { slip: 1.4, opacity: 0.88, wobble: 1.1 }) +
      stroke(points, random, { closed: true, width: 1.1, wobble: 0.9 }),
  };
}

function tail(ctx: Context, side: 1 | -1): Drawing {
  const { random, layout, colors } = ctx;
  const { rx, ry } = layout.frame;
  const root = layout.out(side === 1 ? -0.3 : Math.PI + 0.3, 1.02);
  const swing = side * rx * random.between(0.45, 0.8);
  const drop = ry * random.between(0.8, 1.25);
  const thick = rx * random.between(0.22, 0.34);
  const points: Point[] = [
    [root[0], root[1] - thick * 0.5],
    [root[0] + swing * 0.7, root[1] + drop * 0.4],
    [root[0] + swing, root[1] + drop],
    [root[0] + swing - side * thick, root[1] + drop * 0.95],
    [root[0] + swing * 0.5 - side * thick * 0.6, root[1] + drop * 0.35],
    [root[0], root[1] + thick * 0.6],
  ];
  return {
    back:
      blob(points, colors.hair, random, { slip: 1.3, opacity: 0.88, wobble: 1 }) +
      stroke(points, random, { closed: true, width: 1.05, wobble: 0.8 }),
  };
}

function puffBall(ctx: Context, centre: Point, radius: number): Drawing {
  return mass(ctx, loop(centre[0], centre[1], radius, radius * ctx.random.between(0.85, 1.1), 12), 1.05);
}

function braid(ctx: Context, side: 1 | -1): Drawing {
  const { random, layout } = ctx;
  const { rx, ry } = layout.frame;
  const root = layout.out(side === 1 ? 0.1 : Math.PI - 0.1, 1.04);
  const knots = random.int(3, 5);
  let out: Drawing = {};
  for (let i = 1; i <= knots; i++) {
    const u = i / knots;
    const centre: Point = [root[0] + side * rx * 0.12 * u, root[1] + ry * 0.85 * u];
    out = merge(out, puffBall(ctx, centre, rx * (0.15 - 0.02 * u)));
  }
  return out;
}

export const HAIR: Catalog = {
  bald: { weight: 2, draw: (): Drawing => ({}) },

  buzz: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.4, puff: 0.05, sag: 0.02 });
      let ink = '';
      for (let i = 0; i < 40; i++) {
        const t = shape.from + (shape.to - shape.from) * ctx.random.num();
        const [x, y] = ctx.layout.out(t, ctx.random.between(0.96, 1.02));
        ink += dot(x, y, ctx.random.between(0.25, 0.55), ctx.colors.hair, 0.9);
      }
      return merge(mass(ctx, shape.band, 0.95), { ink });
    },
  },

  short: { weight: 5, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.55, puff: 0.1, sag: 0.04 }).band) },

  sidePart: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.6, puff: 0.11, sag: 0.06 });
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const a = ctx.layout.out(-Math.PI / 2 + side * 0.4, 1.02);
      const b = ctx.layout.out(-Math.PI / 2 + side * 0.75, 1.06);
      return merge(mass(ctx, shape.band), {
        ink: stroke([a, mix(a, b, 0.5), b], ctx.random, { width: 0.9, wobble: 0.5, passes: 1, opacity: 0.8 }),
      });
    },
  },

  messy: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.55, puff: 0.13, ripple: 0.5, waves: 7 });
      return merge(mass(ctx, shape.band), { ink: strands(ctx, shape, 7, 0.22) });
    },
  },

  curly: { weight: 3, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.75, puff: 0.16, ripple: 0.55, waves: 9 }).band) },

  afro: { weight: 2, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.6, puff: 0.42, ripple: 0.26, waves: 11 }).band) },

  bowl: { weight: 2, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.9, puff: 0.16, sag: 0.2 }).band) },

  bangs: { weight: 3, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.8, puff: 0.15, sag: 0.32 }).band) },

  receding: { weight: 2, draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.85, puff: 0.07, sag: -0.3 }).band) },

  bob: { weight: 3, draw: (ctx) => mass(ctx, crown(ctx, { drop: 1.15, puff: 0.2, sag: 0.06 }).band) },

  bun: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.5, puff: 0.07, sag: -0.05 });
      const seat = ctx.layout.out(-Math.PI / 2 + ctx.random.jitter(0.5), 1.05);
      const radius = ctx.layout.frame.rx * ctx.random.between(0.22, 0.32);
      return merge(mass(ctx, shape.band), puffBall(ctx, [seat[0], seat[1] - radius * 0.7], radius));
    },
  },

  topknot: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.45, puff: 0.06, sag: -0.04 });
      const seat = ctx.layout.out(-Math.PI / 2, 1.04);
      const rx = ctx.layout.frame.rx;
      const tuft: Point[] = [
        [seat[0] - rx * 0.14, seat[1]],
        [seat[0] - rx * 0.1, seat[1] - rx * 0.4],
        [seat[0] + rx * 0.06, seat[1] - rx * 0.52],
        [seat[0] + rx * 0.16, seat[1] - rx * 0.15],
        [seat[0] + rx * 0.14, seat[1]],
      ];
      return merge(mass(ctx, shape.band), mass(ctx, tuft, 1));
    },
  },

  ponytail: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.7, puff: 0.12, sag: 0 });
      return merge(tail(ctx, ctx.random.chance(0.5) ? 1 : -1), mass(ctx, shape.band));
    },
  },

  pigtails: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.7, puff: 0.12, sag: 0.04 });
      const radius = ctx.layout.frame.rx * ctx.random.between(0.24, 0.34);
      const right = ctx.layout.out(-0.15, 1.05);
      const left = ctx.layout.out(Math.PI + 0.15, 1.05);
      return merge(
        mass(ctx, shape.band),
        puffBall(ctx, [right[0] + radius * 0.5, right[1]], radius),
        puffBall(ctx, [left[0] - radius * 0.5, left[1]], radius),
      );
    },
  },

  long: {
    weight: 4,
    draw: (ctx: Context): Drawing => merge(fall(ctx, 0.3), mass(ctx, crown(ctx, { drop: 0.95, puff: 0.17, sag: 0.02 }).band)),
  },

  wavy: {
    weight: 3,
    draw: (ctx: Context): Drawing =>
      merge(fall(ctx, 0.28, 0.3), mass(ctx, crown(ctx, { drop: 1, puff: 0.18, ripple: 0.3, waves: 6 }).band)),
  },

  spiky: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.4, puff: 0.04, sag: -0.05 });
      return merge(mass(ctx, shape.band, 1), spikes(ctx, shape.from, shape.to, ctx.random.int(6, 9), 0.3));
    },
  },

  mohawk: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const top = -Math.PI / 2;
      const span = ctx.random.between(0.35, 0.55);
      const height = ctx.random.between(0.28, 0.45);
      const outer = sweep(ctx, top - span, top + span, 10, () => 1 + height);
      const inner = sweep(ctx, top - span, top + span, 10, () => 1);
      return mass(ctx, ring(outer, inner), 1.1);
    },
  },

  braids: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.6, puff: 0.08, sag: 0.02 });
      return merge(braid(ctx, 1), braid(ctx, -1), mass(ctx, shape.band));
    },
  },

  cornrows: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.45, puff: 0.04, sag: -0.04 });
      return merge(mass(ctx, shape.band, 1), { ink: rows(ctx, shape, ctx.random.int(5, 8)) });
    },
  },

  wispy: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const shape = crown(ctx, { drop: 0.6, puff: 0.02, sag: -0.18 });
      return { ink: strands(ctx, shape, ctx.random.int(5, 9), 0.2) };
    },
  },
};
