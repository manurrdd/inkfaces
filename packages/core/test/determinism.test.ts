import { describe, expect, it } from 'vitest';
import { COMBINATIONS, OPTIONS, TRAIT_KEYS, avatar, dataUri, traits } from '../src/index.js';
import { hash } from '../src/random.js';
import type { TraitKey } from '../src/render.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => `seed-${i}`);

describe('determinism', () => {
  it('draws the same avatar for the same seed', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      expect(avatar(seed)).toBe(avatar(seed));
    }
  });

  it('draws different avatars for different seeds', () => {
    const drawn = new Set(SEEDS.map((seed) => avatar(seed)));
    expect(drawn.size).toBe(SEEDS.length);
  });

  /**
   * The guardian. If this fails and you did not deliberately change the style,
   * something leaked between traits and every existing user's avatar just moved.
   * Only update it together with a bump of STYLE_VERSION.
   */
  it('keeps every seed on the same face', () => {
    const fingerprints = SEEDS.map((seed) => `${seed} ${hash(avatar(seed)).toString(36)}`);
    expect(fingerprints).toMatchSnapshot();
  });
});

describe('traits', () => {
  it('honours a pinned trait', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      expect(traits(seed, { hair: 'afro' }).hair).toBe('afro');
      expect(traits(seed, { glasses: 'round', mouth: 'teeth' })).toMatchObject({ glasses: 'round', mouth: 'teeth' });
    }
  });

  it('ignores a value that does not exist instead of throwing', () => {
    const chosen = traits('anything', { hair: 'not-a-hairstyle' as string });
    expect(OPTIONS.hair).toContain(chosen.hair);
  });

  it('leaves unpinned traits free to vary', () => {
    const hats = new Set(SEEDS.map((seed) => traits(seed, { hair: 'afro' }).hat));
    expect(hats.size).toBeGreaterThan(1);
  });

  it('draws every catalogued value without failing', () => {
    for (const key of TRAIT_KEYS) {
      for (const value of OPTIONS[key] ?? []) {
        const svg = avatar('coverage', { [key]: value } as Record<string, string>);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg.endsWith('</svg>')).toBe(true);
        expect(svg).not.toContain('NaN');
        expect(svg).not.toContain('undefined');
      }
    }
  });

  it('agrees with the published TraitKey union', () => {
    const declared: TraitKey[] = [
      'background',
      'clothes',
      'ears',
      'face',
      'hair',
      'brows',
      'eyes',
      'nose',
      'mouth',
      'beard',
      'marks',
      'glasses',
      'earrings',
      'hat',
      'skinColor',
      'hairColor',
      'clothesColor',
      'backgroundColor',
      'paperColor',
    ];
    expect([...TRAIT_KEYS].sort()).toEqual([...declared].sort());
  });
});

describe('output', () => {
  it('escapes the seed instead of letting it into the markup', () => {
    const svg = avatar('"><script>alert(1)</script>');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('writes a size on the root element only when asked', () => {
    const root = (svg: string): string => svg.slice(0, svg.indexOf('>') + 1);
    expect(root(avatar('a'))).not.toContain('width=');
    expect(root(avatar('a', { size: 128 }))).toContain('width="128" height="128"');
  });

  it('can leave the paper grain out', () => {
    expect(avatar('a', { grain: false })).not.toContain('feTurbulence');
    expect(avatar('a')).toContain('feTurbulence');
  });

  it('produces a usable data URI', () => {
    expect(dataUri('a').startsWith('data:image/svg+xml;utf8,%3Csvg')).toBe(true);
  });

  it('offers more combinations than there are people', () => {
    expect(COMBINATIONS).toBeGreaterThan(1_000_000_000_000n);
  });
});
