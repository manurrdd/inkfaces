import { arc, loop, segment, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

const soft = { width: 0.8, wobble: 0.35, passes: 1 as const, opacity: 0.75 };

export const MARKS: Catalog = {
  none: { weight: 30, draw: (): Drawing => ({}) },

  freckles: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const { nose, frame } = ctx.layout;
      let ink = '';
      const count = ctx.random.int(8, 18);
      for (let i = 0; i < count; i++) {
        const side = ctx.random.chance(0.5) ? 1 : -1;
        const x = nose[0] + side * frame.rx * ctx.random.between(0.22, 0.7);
        const y = nose[1] + frame.ry * ctx.random.between(-0.12, 0.1);
        ink += dot(x, y, ctx.random.between(0.3, 0.55), ctx.colors.ink, 0.55);
      }
      return { ink };
    },
  },

  blush: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const { eyes, frame } = ctx.layout;
      const y = eyes.left[1] + frame.ry * 0.3;
      const rx = frame.rx * ctx.random.between(0.2, 0.3);
      let color = '';
      for (const side of [-1, 1] as const) {
        color += blob(loop(frame.cx + side * frame.rx * 0.62, y, rx, rx * 0.62, 10), ctx.colors.clothes, ctx.random, {
          slip: 1,
          opacity: 0.45,
          wobble: 0.8,
        });
      }
      return { color };
    },
  },

  blushLines: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { eyes, frame } = ctx.layout;
      const y = eyes.left[1] + frame.ry * 0.28;
      let ink = '';
      for (const side of [-1, 1] as const) {
        const x = frame.cx + side * frame.rx * 0.62;
        for (let i = 0; i < 3; i++) {
          ink += stroke(segment([x - 2 + i * 2, y - 1.4], [x - 2.8 + i * 2, y + 1.4], 2), ctx.random, soft);
        }
      }
      return { ink };
    },
  },

  mole: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { mouth, frame } = ctx.layout;
      const side = ctx.random.chance(0.5) ? 1 : -1;
      return {
        ink: dot(
          mouth[0] + side * frame.rx * ctx.random.between(0.3, 0.5),
          mouth[1] - frame.ry * ctx.random.between(0, 0.16),
          ctx.random.between(0.6, 0.95),
        ),
      };
    },
  },

  dimples: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { mouth, frame } = ctx.layout;
      let ink = '';
      for (const side of [-1, 1] as const) {
        const x = mouth[0] + side * frame.rx * 0.5;
        ink += stroke(arc(x, mouth[1], frame.rx * 0.1, frame.ry * 0.09, side === 1 ? -1.4 : Math.PI + 1.4, side === 1 ? 1.4 : Math.PI - 1.4, 5), ctx.random, soft);
      }
      return { ink };
    },
  },

  wrinkles: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { eyes, frame } = ctx.layout;
      let ink = '';
      for (const side of [-1, 1] as const) {
        const centre = side === -1 ? eyes.left : eyes.right;
        for (let i = 0; i < 3; i++) {
          const x = centre[0] + side * (eyes.radius * 1.5 + i * 1.2);
          ink += stroke(segment([x, centre[1] - 1.2], [x + side * 1.4, centre[1] - 2.4], 2), ctx.random, soft);
        }
      }
      const brow = eyes.left[1] - frame.ry * 0.3;
      ink += stroke(segment([frame.cx - frame.rx * 0.35, brow], [frame.cx + frame.rx * 0.35, brow], 3), ctx.random, soft);
      return { ink };
    },
  },

  sweat: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const at = ctx.layout.out(-0.9 * side + (side === -1 ? Math.PI : 0), 1.2);
      const drop: Point[] = [
        [at[0], at[1] - 2.6],
        [at[0] + 1.5, at[1] + 0.6],
        [at[0], at[1] + 2],
        [at[0] - 1.5, at[1] + 0.6],
      ];
      return {
        color: blob(drop, ctx.colors.background, ctx.random, { slip: 0.4, opacity: 0.5, wobble: 0.3 }),
        ink: stroke(drop, ctx.random, { closed: true, width: 0.9, wobble: 0.3 }),
      };
    },
  },

  plaster: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { frame, eyes } = ctx.layout;
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const cx = frame.cx + side * frame.rx * 0.45;
      const cy = eyes.left[1] - frame.ry * 0.42;
      const tilt = ctx.random.between(-0.5, 0.5);
      const w = frame.rx * 0.3;
      const h = frame.ry * 0.09;
      const corner = (dx: number, dy: number): Point => [
        cx + dx * w * Math.cos(tilt) - dy * h * Math.sin(tilt),
        cy + dx * w * Math.sin(tilt) + dy * h * Math.cos(tilt),
      ];
      const shape = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
      return {
        color: blob(shape, ctx.colors.background, ctx.random, { slip: 0.6, opacity: 0.7, wobble: 0.4 }),
        ink: stroke(shape, ctx.random, { closed: true, width: 1, wobble: 0.4 }) + dot(cx, cy, 0.5, ctx.colors.ink, 0.5),
      };
    },
  },

  scar: {
    weight: 1,
    draw: (ctx: Context): Drawing => {
      const { frame, eyes } = ctx.layout;
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const x = frame.cx + side * frame.rx * 0.55;
      const top = eyes.left[1] - frame.ry * 0.35;
      const bottom = eyes.left[1] + frame.ry * 0.2;
      let ink = stroke(segment([x, top], [x + side * 1.2, bottom], 3), ctx.random, { width: 0.9, wobble: 0.4, passes: 1 });
      for (let i = 1; i < 4; i++) {
        const y = top + ((bottom - top) * i) / 4;
        ink += stroke(segment([x - 1.4, y], [x + 1.4, y], 2), ctx.random, soft);
      }
      return { ink };
    },
  },
};
