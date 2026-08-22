import { OPTIONS, STYLE_VERSION, TRAIT_KEYS, avatar, type Options } from 'inkfaces';

/**
 * The avatar endpoint.
 *
 *   GET /v1/<seed>.svg?hair=curly&glasses=round&size=256
 *
 * Answers are pure functions of the URL, so everything is cached hard and for a
 * long time. There is no state, no database and nothing to log.
 */

const MAX_SEED = 256;
const MAX_SIZE = 1024;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-max-age': '86400',
};

function help(): Response {
  return json(
    {
      style: 'inkfaces',
      styleVersion: STYLE_VERSION,
      usage: '/v1/{seed}.svg?trait=value',
      example: '/v1/ada.svg?hair=curly&glasses=round&size=256',
      traits: OPTIONS,
    },
    200,
    { 'cache-control': 'public, max-age=3600' },
  );
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...headers },
  });
}

function fail(status: number, message: string): Response {
  return json({ error: message }, status, { 'cache-control': 'no-store' });
}

/** Only known traits get through, and only with values the catalogue knows. */
function readOptions(params: URLSearchParams): Options | string {
  const options: Record<string, string | number | boolean> = {};

  for (const key of TRAIT_KEYS) {
    const value = params.get(key);
    if (value === null) continue;
    if (!(OPTIONS[key] ?? []).includes(value)) return `Unknown value "${value}" for "${key}".`;
    options[key] = value;
  }

  const size = params.get('size');
  if (size !== null) {
    const parsed = Number(size);
    if (!Number.isInteger(parsed) || parsed < 8 || parsed > MAX_SIZE) return `"size" must be an integer between 8 and ${MAX_SIZE}.`;
    options.size = parsed;
  }

  if (params.get('grain') === 'false') options.grain = false;

  return options as Options;
}

export default {
  fetch(request: Request): Response {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET') return fail(405, 'Only GET.');

    const url = new URL(request.url);
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return fail(400, 'Malformed path.');
    }

    const match = /^\/v1\/(.+?)(\.svg)?$/.exec(path);
    if (!match) return help();

    const seed = match[1] as string;
    if (seed.length > MAX_SEED) return fail(414, `Seed longer than ${MAX_SEED} characters.`);

    const options = readOptions(url.searchParams);
    if (typeof options === 'string') return fail(400, options);

    return new Response(avatar(seed, options), {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        // The style is frozen, so the same URL always means the same picture.
        'cache-control': 'public, max-age=31536000, immutable',
        'x-inkfaces-style': String(STYLE_VERSION),
        ...CORS,
      },
    });
  },
};
