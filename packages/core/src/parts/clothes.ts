import { arc, segment, type Point } from '../geometry.js';
import { blob, dot, stroke } from '../stroke.js';
import type { Catalog, Context, Drawing } from '../types.js';

/**
 * Everything here goes in the `back` layer. That puts the neck behind the face
 * mask, so it never shows through the chin, and lets long hair fall over the
 * shoulders without any extra bookkeeping.
 */

const FLOOR = 104;

function shoulders(ctx: Context, width: number, rise: number): Point[] {
  const { cx, cy, rx, ry } = ctx.layout.frame;
  const top = cy + ry * rise;
  const half = rx * width;
  return [
    [cx - half, FLOOR],
    [cx - half * 0.92, top + ry * 0.22],
    [cx - rx * 0.5, top],
    [cx + rx * 0.5, top],
    [cx + half * 0.92, top + ry * 0.22],
    [cx + half, FLOOR],
  ];
}

function neck(ctx: Context): string {
  const { cx, cy, rx, ry } = ctx.layout.frame;
  const w = rx * ctx.random.between(0.26, 0.36);
  const top = cy + ry * 0.6;
  const bottom = cy + ry * 1.45;
  const points: Point[] = [
    [cx - w, top],
    [cx - w * 1.1, bottom],
    [cx + w * 1.1, bottom],
    [cx + w, top],
  ];
  return (
    blob(points, ctx.colors.skin, ctx.random, { slip: 1.1, opacity: 0.8, wobble: 0.8 }) +
    stroke(segment([cx - w, top], [cx - w * 1.1, bottom], 2), ctx.random, { width: 1.1, wobble: 0.6 }) +
    stroke(segment([cx + w, top], [cx + w * 1.1, bottom], 2), ctx.random, { width: 1.1, wobble: 0.6 })
  );
}

function garment(ctx: Context, width = 1.9, rise = 1.36): { back: string; points: Point[] } {
  const points = shoulders(ctx, width, rise);
  return {
    points,
    back:
      neck(ctx) +
      blob(points, ctx.colors.clothes, ctx.random, { slip: 1.7, opacity: 0.85, wobble: 1.1 }) +
      stroke(points, ctx.random, { closed: true, width: 1.25, wobble: 0.85 }),
  };
}

/** Where a neckline sits, and how wide it opens. */
function collarPoints(ctx: Context, drop: number, spread: number): [Point, Point, Point] {
  const { cx, cy, rx, ry } = ctx.layout.frame;
  const top = cy + ry * 1.36;
  return [
    [cx - rx * spread, top + ry * 0.04],
    [cx, top + ry * drop],
    [cx + rx * spread, top + ry * 0.04],
  ];
}

const thin = { width: 1, wobble: 0.5, passes: 1 as const };

export const CLOTHES: Catalog = {
  collar: {
    weight: 5,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const [a, b, c] = collarPoints(ctx, 0.22, 0.42);
      return { back: g.back + stroke([a, b], ctx.random, thin) + stroke([b, c], ctx.random, thin) };
    },
  },

  tShirt: {
    weight: 5,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      return {
        back: g.back + stroke(arc(cx, cy + ry * 1.36, rx * 0.5, ry * 0.2, 0, Math.PI, 7), ctx.random, thin),
      };
    },
  },

  vNeck: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const [a, b, c] = collarPoints(ctx, 0.4, 0.36);
      return { back: g.back + stroke([a, b, c], ctx.random, { width: 1.05, wobble: 0.5 }) };
    },
  },

  turtleneck: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const w = rx * 0.44;
      const band: Point[] = [
        [cx - w, cy + ry * 1.05],
        [cx + w, cy + ry * 1.05],
        [cx + w * 1.05, cy + ry * 1.45],
        [cx - w * 1.05, cy + ry * 1.45],
      ];
      const g = garment(ctx);
      return {
        back:
          g.back +
          blob(band, ctx.colors.clothes, ctx.random, { slip: 1.2, opacity: 0.85, wobble: 0.9 }) +
          stroke(band, ctx.random, { closed: true, width: 1.1, wobble: 0.6 }),
      };
    },
  },

  buttonUp: {
    weight: 4,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const { cx, cy, ry, rx } = ctx.layout.frame;
      const top = cy + ry * 1.4;
      let back = g.back + stroke(segment([cx, top], [cx, FLOOR], 3), ctx.random, thin);
      const [a, b, c] = collarPoints(ctx, 0.2, 0.34);
      back += stroke([a, b], ctx.random, thin) + stroke([b, c], ctx.random, thin);
      for (let i = 0; i < 3; i++) back += dot(cx + rx * 0.12, top + ry * (0.28 + i * 0.32), 0.7);
      return { back };
    },
  },

  sweater: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx, 2, 1.34);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      let back = g.back + stroke(arc(cx, cy + ry * 1.36, rx * 0.46, ry * 0.16, 0, Math.PI, 6), ctx.random, thin);
      for (let i = 0; i < 4; i++) {
        const x = cx - rx * 1.5 + rx * i * 1;
        back += stroke(segment([x, FLOOR - 6], [x, FLOOR], 2), ctx.random, { ...thin, opacity: 0.6 });
      }
      return { back };
    },
  },

  hoodie: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx, 2.05, 1.32);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const hood = arc(cx, cy + ry * 1.2, rx * 1.15, ry * 0.6, Math.PI, Math.PI * 2, 10);
      let back =
        blob(hood, ctx.colors.clothes, ctx.random, { slip: 1.4, opacity: 0.8, wobble: 1 }) +
        stroke(hood, ctx.random, { width: 1.1, wobble: 0.7 }) +
        g.back;
      for (const side of [-1, 1] as const) {
        back += stroke(segment([cx + side * rx * 0.3, cy + ry * 1.42], [cx + side * rx * 0.36, cy + ry * 1.95], 3), ctx.random, thin);
        back += dot(cx + side * rx * 0.36, cy + ry * 1.98, 0.8);
      }
      return { back };
    },
  },

  stripes: {
    weight: 3,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const { cx, rx } = ctx.layout.frame;
      let back = g.back;
      const gap = ctx.random.between(3.5, 5.5);
      for (let y = FLOOR - gap; y > FLOOR - 20; y -= gap) {
        const half = rx * 1.85 * Math.min(1, (FLOOR - y) / 9);
        back += stroke(segment([cx - half, y], [cx + half, y], 4), ctx.random, { width: 1.4, wobble: 0.5, passes: 1, opacity: 0.75 });
      }
      return { back };
    },
  },

  dungarees: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const top = cy + ry * 1.45;
      const bib: Point[] = [
        [cx - rx * 0.6, top + ry * 0.25],
        [cx + rx * 0.6, top + ry * 0.25],
        [cx + rx * 0.6, FLOOR],
        [cx - rx * 0.6, FLOOR],
      ];
      let back =
        g.back +
        blob(bib, ctx.colors.background, ctx.random, { slip: 1.2, opacity: 0.6, wobble: 0.8 }) +
        stroke(bib, ctx.random, { closed: true, width: 1.05, wobble: 0.6 });
      for (const side of [-1, 1] as const) {
        back += stroke(segment([cx + side * rx * 0.5, top + ry * 0.25], [cx + side * rx * 0.95, top - ry * 0.02], 2), ctx.random, thin);
      }
      return { back };
    },
  },

  scarf: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const band: Point[] = [
        [cx - rx * 0.6, cy + ry * 1.1],
        [cx + rx * 0.6, cy + ry * 1.15],
        [cx + rx * 0.55, cy + ry * 1.5],
        [cx - rx * 0.55, cy + ry * 1.45],
      ];
      const side = ctx.random.chance(0.5) ? 1 : -1;
      const tail: Point[] = [
        [cx + side * rx * 0.35, cy + ry * 1.45],
        [cx + side * rx * 0.75, cy + ry * 1.9],
        [cx + side * rx * 0.45, cy + ry * 2.1],
        [cx + side * rx * 0.1, cy + ry * 1.5],
      ];
      return {
        back:
          g.back +
          blob(band, ctx.colors.background, ctx.random, { slip: 1.2, opacity: 0.8, wobble: 0.9 }) +
          blob(tail, ctx.colors.background, ctx.random, { slip: 1.2, opacity: 0.8, wobble: 0.9 }) +
          stroke(tail, ctx.random, { closed: true, width: 1.05, wobble: 0.7 }) +
          stroke(band, ctx.random, { closed: true, width: 1.15, wobble: 0.7 }),
      };
    },
  },

  suit: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const g = garment(ctx, 2, 1.34);
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const top = cy + ry * 1.36;
      const shirt: Point[] = [
        [cx - rx * 0.42, top],
        [cx + rx * 0.42, top],
        [cx + rx * 0.3, FLOOR],
        [cx - rx * 0.3, FLOOR],
      ];
      const tie: Point[] = [
        [cx - rx * 0.11, top + ry * 0.16],
        [cx + rx * 0.11, top + ry * 0.16],
        [cx + rx * 0.16, FLOOR],
        [cx - rx * 0.16, FLOOR],
      ];
      return {
        back:
          g.back +
          blob(shirt, ctx.colors.paper, ctx.random, { slip: 1, opacity: 0.95, wobble: 0.7 }) +
          stroke(shirt, ctx.random, { closed: true, width: 1.05, wobble: 0.6 }) +
          blob(tie, ctx.colors.background, ctx.random, { slip: 0.9, opacity: 0.9, wobble: 0.6 }) +
          stroke(tie, ctx.random, { closed: true, width: 1.05, wobble: 0.6 }),
      };
    },
  },

  tank: {
    weight: 2,
    draw: (ctx: Context): Drawing => {
      const { cx, cy, rx, ry } = ctx.layout.frame;
      const top = cy + ry * 1.4;
      const points: Point[] = [
        [cx - rx * 1.15, FLOOR],
        [cx - rx * 0.95, top + ry * 0.3],
        [cx - rx * 0.5, top],
        [cx + rx * 0.5, top],
        [cx + rx * 0.95, top + ry * 0.3],
        [cx + rx * 1.15, FLOOR],
      ];
      return {
        back:
          neck(ctx) +
          blob(points, ctx.colors.clothes, ctx.random, { slip: 1.6, opacity: 0.85, wobble: 1 }) +
          stroke(points, ctx.random, { closed: true, width: 1.2, wobble: 0.8 }),
      };
    },
  },
};
