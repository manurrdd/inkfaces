import { COLOR_KEYS, COLOR_TRAITS, FEATURES, pickVariant } from './catalog.js';
import { LAYERS } from './drawing.js';
import { buildOutline, sampleOutline, type FaceShape, type Frame, type Point } from './geometry.js';
import { INK } from './palette.js';
import type { Colors } from './palette.js';
import { hash, streamFor } from './random.js';
import { f } from './stroke.js';
import type { Context, Layer, Layout } from './types.js';

/**
 * The frozen style.
 *
 * Every seed maps to one face for as long as this number does not change.
 * Adding a variant to a catalogue changes the odds inside that one trait, which
 * is why a release that does so bumps this and says so out loud. Nothing else
 * may change what an existing seed draws.
 */
export const STYLE_VERSION = 1;

export type TraitKey =
  | 'background'
  | 'clothes'
  | 'ears'
  | 'face'
  | 'hair'
  | 'brows'
  | 'eyes'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'marks'
  | 'glasses'
  | 'earrings'
  | 'hat'
  | 'skinColor'
  | 'hairColor'
  | 'clothesColor'
  | 'backgroundColor'
  | 'paperColor';

export type Traits = Record<TraitKey, string>;

export interface Options extends Partial<Traits> {
  /** Pixel size written into width/height. Omit for a purely scalable SVG. */
  size?: number;
  /** Paper grain. On unless you turn it off. */
  grain?: boolean;
  /** Accessible label. Defaults to the seed. */
  title?: string;
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/** Seeds arrive from URLs and user input. Nothing unescaped goes into the SVG. */
const escape = (text: string): string => text.replace(/[&<>"']/g, (char) => ESCAPES[char] as string);

/**
 * Picks a value for every trait: what the caller asked for where it is valid,
 * a weighted draw from the seed everywhere else. An unknown value is ignored
 * rather than thrown, because these arrive from query strings.
 */
export function resolveTraits(seed: string, options: Options = {}): Traits {
  const traits: Record<string, string> = {};

  for (const feature of FEATURES) {
    const wanted = options[feature.key as TraitKey];
    traits[feature.key] =
      wanted !== undefined && wanted in feature.variants
        ? wanted
        : pickVariant(feature.variants, streamFor(seed, feature.key, STYLE_VERSION));
  }

  for (const key of COLOR_KEYS) {
    const swatches = COLOR_TRAITS[key];
    const wanted = options[key as TraitKey];
    traits[key] =
      wanted !== undefined && wanted in swatches
        ? wanted
        : streamFor(seed, key, STYLE_VERSION).pick(Object.keys(swatches));
  }

  return traits as Traits;
}

function buildLayout(seed: string, shape: FaceShape): Layout {
  const random = streamFor(seed, 'layout', STYLE_VERSION);

  const rx = random.between(21, 25);
  const frame: Frame = {
    cx: 50 + random.jitter(1.5),
    cy: 45 + random.jitter(2),
    rx,
    ry: rx * random.between(1.06, 1.3),
  };

  const at = buildOutline(shape, frame, streamFor(seed, 'outline', STYLE_VERSION));
  const out = (t: number, scale: number): Point => {
    const [x, y] = at(t);
    return [frame.cx + (x - frame.cx) * scale, frame.cy + (y - frame.cy) * scale];
  };

  const gap = frame.rx * random.between(0.44, 0.56);
  const line = frame.cy + frame.ry * random.between(-0.04, 0.1);
  const wander = frame.ry * 0.035;
  const nose: Point = [frame.cx + random.jitter(frame.rx * 0.08), line + frame.ry * random.between(0.16, 0.26)];

  return {
    frame,
    at,
    out,
    outline: sampleOutline(at, 44),
    tilt: random.jitter(6),
    eyes: {
      left: [frame.cx - gap, line + random.jitter(wander)],
      right: [frame.cx + gap, line + random.jitter(wander)],
      radius: frame.rx * random.between(0.11, 0.15),
    },
    nose,
    mouth: [frame.cx + random.jitter(frame.rx * 0.08), nose[1] + frame.ry * random.between(0.16, 0.26)],
  };
}

function paperGrain(id: string, seed: string): { defs: string; overlay: string } {
  return {
    defs:
      `<filter id="${id}" x="-2%" y="-2%" width="104%" height="104%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" seed="${hash(seed) % 1000}"/>` +
      `<feColorMatrix type="saturate" values="0"/>` +
      `</filter>`,
    // fill="none" on purpose: feTurbulence makes its own image, so a renderer
    // that supports filters shows grain and one that does not shows nothing.
    overlay: `<rect width="100" height="100" fill="none" filter="url(#${id})" opacity="0.13"/>`,
  };
}

/** Renders one avatar as a standalone SVG document. */
export function render(seed: string, options: Options = {}): string {
  const traits = resolveTraits(seed, options);
  const layout = buildLayout(seed, traits.face as FaceShape);

  const swatch = (key: string): string => COLOR_TRAITS[key][traits[key as TraitKey]] as string;
  const colors: Colors = {
    ink: INK,
    paper: swatch('paperColor'),
    skin: swatch('skinColor'),
    hair: swatch('hairColor'),
    clothes: swatch('clothesColor'),
    background: swatch('backgroundColor'),
  };

  const body: Record<Layer, string> = { back: '', mask: '', color: '', ink: '' };
  const head: Record<Layer, string> = { back: '', mask: '', color: '', ink: '' };

  for (const feature of FEATURES) {
    const variant = feature.variants[traits[feature.key as TraitKey]];
    if (!variant) continue;
    const context: Context = {
      // A separate stream from the one that chose the variant, so the choice
      // and the wobble cannot correlate.
      random: streamFor(seed, `${feature.key}:draw`, STYLE_VERSION),
      layout,
      colors,
      options: traits,
    };
    const drawing = variant.draw(context);
    const target = feature.head ? head : body;
    for (const layer of LAYERS) {
      const piece = drawing[layer];
      if (piece) target[layer] += piece;
    }
  }

  const lean = `rotate(${f(layout.tilt)} ${f(layout.frame.cx)} ${f(layout.frame.cy)})`;
  let stack = '';
  for (const layer of LAYERS) {
    if (body[layer]) stack += body[layer];
    if (head[layer]) stack += `<g transform="${lean}">${head[layer]}</g>`;
  }

  const id = `ink-${hash(`${seed}/${STYLE_VERSION}`).toString(36)}`;
  const grain = options.grain === false ? { defs: '', overlay: '' } : paperGrain(id, seed);
  const label = escape(options.title ?? `Avatar for ${seed}`);
  const size = options.size ? ` width="${options.size}" height="${options.size}"` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${size} role="img" aria-label="${label}">` +
    `<title>${label}</title>` +
    (grain.defs ? `<defs>${grain.defs}</defs>` : '') +
    `<rect width="100" height="100" fill="${colors.paper}"/>` +
    stack +
    grain.overlay +
    `</svg>`
  );
}
