/**
 * Geometry helpers.
 *
 * Angles follow the SVG convention: x grows right, y grows down. So `UP` is
 * -PI/2 (top of the head) and `DOWN` is +PI/2 (the chin).
 */
import type { Random } from './random.js';

export type Point = readonly [number, number];

export const TAU = Math.PI * 2;
export const RIGHT = 0;
export const DOWN = Math.PI / 2;
export const LEFT = Math.PI;
export const UP = -Math.PI / 2;

export interface Frame {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** A face silhouette, sampled by angle. */
export type Outline = (t: number) => Point;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mix = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export const shift = (p: Point, dx: number, dy: number): Point => [p[0] + dx, p[1] + dy];

/** Points along an elliptical arc, `from` and `to` included. */
export function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, samples = 10): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = lerp(from, to, i / samples);
    out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return out;
}

/** A straight run between two points, sampled so it can wobble along its length. */
export function segment(a: Point, b: Point, samples = 3): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) out.push(mix(a, b, i / samples));
  return out;
}

/** Closes an outer run and an inner run into one band, e.g. a mass of hair. */
export function ring(outer: readonly Point[], inner: readonly Point[]): Point[] {
  return [...outer, ...[...inner].reverse()];
}

/** Signed superellipse in unit coordinates. n=2 is a circle, higher is squarer. */
function superellipse(n: number, t: number): Point {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const k = 2 / n;
  return [Math.sign(c) * Math.abs(c) ** k, Math.sign(s) * Math.abs(s) ** k];
}

const clampUp = (v: number): number => (v > 0 ? v : 0);

export const FACE_SHAPES = [
  'oval',
  'round',
  'square',
  'long',
  'wide',
  'pear',
  'egg',
  'triangle',
  'heart',
  'potato',
] as const;

export type FaceShape = (typeof FACE_SHAPES)[number];

/**
 * Builds the silhouette for a face shape.
 *
 * The result is a function of angle rather than a list of points, because every
 * other part hangs off it: ears attach at an angle, hair sweeps between two
 * angles, a beard follows the jaw. Asking the outline where it is at an angle
 * keeps all of them in agreement, whatever the shape.
 */
export function buildOutline(shape: FaceShape, frame: Frame, random: Random): Outline {
  const { cx, cy, rx, ry } = frame;

  // Low-frequency lumps, so "potato" is a different potato every time.
  const p1 = random.between(0, TAU);
  const p2 = random.between(0, TAU);
  const p3 = random.between(0, TAU);

  return (t: number): Point => {
    let [ux, uy] = superellipse(exponent(shape), t);
    let sx = rx;
    let sy = ry;

    const below = clampUp(Math.sin(t)); // 0 at the temples, 1 at the chin
    const above = clampUp(-Math.sin(t));

    switch (shape) {
      case 'long':
        sx *= 0.88;
        sy *= 1.16;
        break;
      case 'wide':
        sx *= 1.14;
        sy *= 0.9;
        break;
      case 'pear':
        ux *= 1 + 0.24 * below;
        sy *= 1.02;
        break;
      case 'egg':
        ux *= 1 - 0.2 * below ** 1.1 + 0.06 * above;
        break;
      case 'triangle':
        ux *= 1 - 0.36 * below ** 1.2;
        sy *= 1.02;
        break;
      case 'heart':
        ux *= 1 - 0.26 * below ** 1.3;
        uy += 0.34 * above ** 8; // the notch of a widow's peak
        break;
      case 'potato': {
        const lump = 1 + 0.07 * Math.sin(3 * t + p1) + 0.05 * Math.sin(5 * t + p2) + 0.04 * Math.sin(2 * t + p3);
        ux *= lump;
        uy *= lump;
        break;
      }
      default:
        break;
    }

    return [cx + sx * ux, cy + sy * uy];
  };
}

function exponent(shape: FaceShape): number {
  switch (shape) {
    case 'round':
      return 2;
    case 'square':
      return 3.4;
    case 'wide':
      return 2.4;
    case 'triangle':
      return 2.7;
    case 'heart':
      return 2.3;
    default:
      return 2.15;
  }
}

/** Samples a whole silhouette into a closed loop of points. */
export function sampleOutline(at: Outline, samples = 44): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < samples; i++) out.push(at((i / samples) * TAU));
  return out;
}

/** Samples part of a silhouette, optionally pushed out from the centre by `scale`. */
export function traceOutline(at: Outline, frame: Frame, from: number, to: number, samples = 10, scale = 1): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const [x, y] = at(lerp(from, to, i / samples));
    out.push([frame.cx + (x - frame.cx) * scale, frame.cy + (y - frame.cy) * scale]);
  }
  return out;
}

/** A closed ellipse of points, with no duplicated join. */
export function loop(cx: number, cy: number, rx: number, ry: number, samples = 16): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * TAU;
    out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  return out;
}

/** A run from `a` to `b` bent by `sag` at its middle. Positive sag bends down. */
export function bow(a: Point, b: Point, sag: number, samples = 8): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const [x, y] = mix(a, b, u);
    out.push([x, y + sag * 4 * u * (1 - u)]);
  }
  return out;
}
