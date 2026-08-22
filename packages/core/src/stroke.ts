/**
 * Ink and colour.
 *
 * Two ideas carry the whole look:
 *
 * 1. A line is drawn twice, wobbled differently each time. Where the two passes
 *    diverge the line looks pressed; where they meet it looks thin. That is
 *    what a ballpoint does on paper, and no amount of extra detail replaces it.
 * 2. Colour is a flat patch that misses its outline slightly, the way a cheap
 *    two-plate print misses registration. Colour under ink, never on top.
 */
import { INK } from './palette.js';
import type { Point } from './geometry.js';
import type { Random } from './random.js';

/** One decimal is under a tenth of a pixel at any sane avatar size. */
export const f = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};

function wobbled(points: readonly Point[], random: Random, amount: number): Point[] {
  return points.map(([x, y]) => [x + random.jitter(amount), y + random.jitter(amount)] as Point);
}

/** Catmull-Rom through the points, emitted as cubic Beziers. */
function toPath(points: readonly Point[], closed: boolean): string {
  const n = points.length;
  if (n === 0) return '';
  const at = (i: number): Point =>
    closed ? (points[((i % n) + n) % n] as Point) : (points[Math.max(0, Math.min(n - 1, i))] as Point);

  const first = at(0);
  let d = `M${f(first[0])} ${f(first[1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [dx, dy] = at(i + 2);
    d += `C${f(bx + (cx - ax) / 6)} ${f(by + (cy - ay) / 6)} ${f(cx - (dx - bx) / 6)} ${f(cy - (dy - by) / 6)} ${f(cx)} ${f(cy)}`;
  }
  return closed ? `${d}Z` : d;
}

export interface StrokeOptions {
  closed?: boolean;
  /** Nominal pen width. The two passes land either side of it. */
  width?: number;
  /** How far the pen strays, in user units. */
  wobble?: number;
  color?: string;
  opacity?: number;
  /** 1 for a light note, 2 for a normal line, 3 for a laboured one. */
  passes?: number;
}

/** A pen line through the given points. */
export function stroke(points: readonly Point[], random: Random, options: StrokeOptions = {}): string {
  const { closed = false, width = 1.1, wobble = 0.9, color = INK, opacity = 1, passes = 2 } = options;
  if (points.length < 2) return '';

  const weights = [0.95, 0.55, 0.35];
  const alphas = [1, 0.7, 0.45];
  let out = '';
  for (let i = 0; i < passes; i++) {
    const d = toPath(wobbled(points, random, wobble), closed);
    const a = opacity * (alphas[i] ?? 0.4);
    out +=
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(width * (weights[i] ?? 0.3))}"` +
      ` stroke-linecap="round" stroke-linejoin="round"${a < 1 ? ` opacity="${f(a)}"` : ''}/>`;
  }
  return out;
}

export interface BlobOptions {
  /** How far the colour plate slips off register. */
  slip?: number;
  opacity?: number;
  /** Extra softness on the patch edge, on top of the slip. */
  wobble?: number;
}

/** A flat patch of colour, printed slightly off its outline. */
export function blob(points: readonly Point[], color: string, random: Random, options: BlobOptions = {}): string {
  const { slip = 1.6, opacity = 0.85, wobble = 1 } = options;
  if (points.length < 3) return '';
  const dx = random.jitter(slip);
  const dy = random.jitter(slip);
  const moved = points.map(([x, y]) => [x + dx, y + dy] as Point);
  const d = toPath(wobbled(moved, random, wobble), true);
  return `<path d="${d}" fill="${color}" opacity="${f(opacity)}"/>`;
}

/** A solid shape with no life in it. Used for the paper-coloured face mask. */
export function solid(points: readonly Point[], color: string): string {
  if (points.length < 3) return '';
  return `<path d="${toPath(points, true)}" fill="${color}"/>`;
}

/** A filled dot: a pupil, a freckle, a mole. */
export function dot(x: number, y: number, r: number, color = INK, opacity = 1): string {
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${color}"${opacity < 1 ? ` opacity="${f(opacity)}"` : ''}/>`;
}
