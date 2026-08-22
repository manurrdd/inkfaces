import { merge } from '../drawing.js';
import { arc, bow, ring, traceOutline, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/** Right cheek and left cheek, where facial hair usually starts. */
const RIGHT_CHEEK = 0.3;
const LEFT_CHEEK = Math.PI - 0.3;

function jawMass(ctx: Context, reach: number, sag: number): Point[] {
  const { at, frame } = ctx.layout;
  const outer = traceOutline(at, frame, RIGHT_CHEEK, LEFT_CHEEK, 14, reach);
  const inner = bow(at(RIGHT_CHEEK), at(LEFT_CHEEK), sag * frame.ry, 8);
  return ring(outer, inner);
}

function hairMass(ctx: Context, points: readonly Point[], width = 1.1): Drawing {
  const { random, colors } = ctx;
  return {
    color: blob(points, colors.hair, random, { slip: 1.3, opacity: 0.85, wobble: 1 }),
    ink: stroke(points, random, { closed: true, width, wobble: 0.75 }),
  };
}

function moustache(ctx: Context, spread: number, droop: number, thickness: number): Point[] {
  const { mouth } = ctx.layout;
  const { rx, ry } = ctx.layout.frame;
  const w = rx * spread;
  const y = mouth[1] - ry * 0.13;
  return [
    [mouth[0] - w, y + ry * droop],
    [mouth[0] - w * 0.5, y - ry * 0.02],
    [mouth[0], y + ry * 0.01],
    [mouth[0] + w * 0.5, y - ry * 0.02],
    [mouth[0] + w, y + ry * droop],
    [mouth[0] + w * 0.6, y + ry * (droop + thickness)],
    [mouth[0], y + ry * thickness * 1.2],
    [mouth[0] - w * 0.6, y + ry * (droop + thickness)],
  ];
}

export const BEARD: Catalog = {
  none: { weight: 46, draw: (): Drawing => ({}) },

  stubble: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { at, frame } = ctx.layout;
      let ink = '';
      for (let i = 0; i < 70; i++) {
        const t = ctx.random.between(RIGHT_CHEEK, LEFT_CHEEK);
        const k = ctx.random.between(0.62, 0.97);
        const [x, y] = at(t);
        ink += dot(frame.cx + (x - frame.cx) * k, frame.cy + (y - frame.cy) * k, ctx.random.between(0.2, 0.45), ctx.colors.hair, 0.85);
      }
      return { ink };
    },
  },

  moustache: { weight: 3, draw: (ctx) => hairMass(ctx, moustache(ctx, 0.45, 0.02, 0.06)) },

  handlebar: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const base = moustache(ctx, 0.55, -0.04, 0.05);
      const { rx } = ctx.layout.frame;
      let out = hairMass(ctx, base);
      for (const side of [-1, 1] as const) {
        const tip = base[side === -1 ? 0 : 4] as Point;
        out = merge(out, {
          ink: stroke(arc(tip[0] + side * rx * 0.06, tip[1], rx * 0.08, rx * 0.08, side === -1 ? Math.PI : 0, side === -1 ? Math.PI * 2.2 : 1.2 * Math.PI, 6), ctx.random, {
            width: 1.1,
            wobble: 0.5,
          }),
        });
      }
      return out;
    },
  },

  pencil: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { mouth, frame } = ctx.layout;
      const w = frame.rx * 0.34;
      return {
        ink: stroke(
          [
            [mouth[0] - w, mouth[1] - frame.ry * 0.1],
            [mouth[0], mouth[1] - frame.ry * 0.14],
            [mouth[0] + w, mouth[1] - frame.ry * 0.1],
          ],
          ctx.random,
          { width: 0.9, wobble: 0.35, passes: 1 },
        ),
      };
    },
  },

  goatee: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { mouth, frame } = ctx.layout;
      const w = frame.rx * ctx.random.between(0.16, 0.24);
      const patch: Point[] = [
        [mouth[0] - w, mouth[1] + frame.ry * 0.09],
        [mouth[0] + w, mouth[1] + frame.ry * 0.09],
        [mouth[0] + w * 0.7, mouth[1] + frame.ry * 0.34],
        [mouth[0] - w * 0.7, mouth[1] + frame.ry * 0.34],
      ];
      return merge(hairMass(ctx, patch), hairMass(ctx, moustache(ctx, 0.4, 0, 0.05)));
    },
  },

  soulPatch: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { mouth, frame } = ctx.layout;
      const w = frame.rx * 0.1;
      return hairMass(
        ctx,
        [
          [mouth[0] - w, mouth[1] + frame.ry * 0.1],
          [mouth[0] + w, mouth[1] + frame.ry * 0.1],
          [mouth[0], mouth[1] + frame.ry * 0.26],
        ],
        1,
      );
    },
  },

  sideburns: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { at, frame } = ctx.layout;
      let out: Drawing = {};
      for (const [from, to] of [
        [-0.25, 0.45],
        [Math.PI + 0.25, Math.PI - 0.45],
      ] as const) {
        const outer = traceOutline(at, frame, from, to, 6, 1.04);
        const inner = traceOutline(at, frame, from, to, 6, 0.86);
        out = merge(out, hairMass(ctx, ring(outer, inner), 1));
      }
      return out;
    },
  },

  chinstrap: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { at, frame } = ctx.layout;
      const outer = traceOutline(at, frame, -0.25, Math.PI + 0.25, 18, 1.04);
      const inner = traceOutline(at, frame, -0.25, Math.PI + 0.25, 18, 0.88);
      return hairMass(ctx, ring(outer, inner), 1);
    },
  },

  full: {
    weight: 3,
    draw: (ctx: Context): Drawing => merge(hairMass(ctx, jawMass(ctx, 1.08, 0.5)), hairMass(ctx, moustache(ctx, 0.5, 0, 0.06))),
  },

  long: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { at, frame } = ctx.layout;
      const outer = traceOutline(at, frame, RIGHT_CHEEK, LEFT_CHEEK, 14, 1.06).map(
        ([x, y]): Point => [x, y + frame.ry * 0.42 * Math.max(0, 1 - Math.abs(x - frame.cx) / frame.rx)],
      );
      const inner = bow(at(RIGHT_CHEEK), at(LEFT_CHEEK), frame.ry * 0.5, 8);
      return merge(hairMass(ctx, ring(outer, inner)), hairMass(ctx, moustache(ctx, 0.5, 0, 0.06)));
    },
  },
};
