import { arc, loop, segment, TAU, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

const C = 50;

function rounded(size: number, radius: number): Point[] {
  const a = size - radius;
  return [
    ...arc(C + a, C - a, radius, radius, -Math.PI / 2, 0, 3),
    ...arc(C + a, C + a, radius, radius, 0, Math.PI / 2, 3),
    ...arc(C - a, C + a, radius, radius, Math.PI / 2, Math.PI, 3),
    ...arc(C - a, C - a, radius, radius, Math.PI, Math.PI * 1.5, 3),
  ];
}

export const BACKGROUND: Catalog = {
  none: { weight: 12, draw: (): Drawing => ({}) },

  circle: {
    weight: 3,
    draw: ({ random, colors }: Context): Drawing => ({
      back: blob(loop(C, C, random.between(38, 43), random.between(38, 43), 22), colors.background, random, {
        slip: 2.2,
        opacity: 0.75,
        wobble: 1.4,
      }),
    }),
  },

  square: {
    weight: 2,
    draw: ({ random, colors }: Context): Drawing => ({
      back: blob(rounded(random.between(38, 43), random.between(4, 12)), colors.background, random, {
        slip: 2.2,
        opacity: 0.7,
        wobble: 1.2,
      }),
    }),
  },

  halo: {
    weight: 1,
    draw: ({ random }: Context): Drawing => ({
      ink: stroke(loop(C, C, random.between(39, 44), random.between(39, 44), 20), random, {
        closed: true,
        width: 1,
        wobble: 1.5,
        opacity: 0.75,
      }),
    }),
  },

  rays: {
    weight: 1,
    draw: ({ random }: Context): Drawing => {
      let ink = '';
      const count = random.int(10, 16);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * TAU + random.jitter(0.08);
        const from = random.between(38, 41);
        const to = from + random.between(3, 7);
        ink += stroke(
          segment([C + from * Math.cos(t), C + from * Math.sin(t)], [C + to * Math.cos(t), C + to * Math.sin(t)], 2),
          random,
          { width: 0.9, wobble: 0.5, passes: 1, opacity: 0.8 },
        );
      }
      return { ink };
    },
  },

  dots: {
    weight: 2,
    draw: ({ random, colors }: Context): Drawing => {
      let back = '';
      const count = random.int(14, 26);
      for (let i = 0; i < count; i++) {
        const t = random.between(0, TAU);
        const r = random.between(34, 46);
        back += dot(C + r * Math.cos(t), C + r * Math.sin(t), random.between(0.7, 2.1), colors.background, 0.7);
      }
      return { back };
    },
  },

  frame: {
    weight: 1,
    draw: ({ random }: Context): Drawing => ({
      ink: stroke(rounded(random.between(43, 47), random.between(1, 4)), random, {
        closed: true,
        width: 1,
        wobble: 1.2,
        opacity: 0.7,
      }),
    }),
  },
};
