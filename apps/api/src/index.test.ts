import { describe, expect, it } from 'vitest';
import worker from './index.js';

const get = (path: string): Response => worker.fetch(new Request(`https://example.com${path}`));

describe('the avatar endpoint', () => {
  it('draws an SVG for a seed', async () => {
    const response = get('/v1/ada.svg');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    expect(await response.text()).toContain('<svg');
  });

  it('does not need the extension', () => {
    expect(get('/v1/ada').status).toBe(200);
  });

  it('caches immutably, because the style is frozen', () => {
    expect(get('/v1/ada.svg').headers.get('cache-control')).toContain('immutable');
  });

  it('gives the same answer for the same URL', async () => {
    expect(await get('/v1/ada.svg').text()).toBe(await get('/v1/ada.svg').text());
  });

  it('applies traits from the query string', async () => {
    const pinned = await get('/v1/ada.svg?hair=afro&glasses=round').text();
    expect(pinned).not.toBe(await get('/v1/ada.svg').text());
  });

  it('refuses a trait value it does not know', async () => {
    const response = get('/v1/ada.svg?hair=mullet');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('hair') });
  });

  it('refuses a size outside the allowed range', () => {
    expect(get('/v1/ada.svg?size=4').status).toBe(400);
    expect(get('/v1/ada.svg?size=99999').status).toBe(400);
    expect(get('/v1/ada.svg?size=notanumber').status).toBe(400);
    expect(get('/v1/ada.svg?size=256').status).toBe(200);
  });

  it('refuses an absurdly long seed', () => {
    expect(get(`/v1/${'x'.repeat(300)}.svg`).status).toBe(414);
  });

  it('never lets a seed break out of the markup', async () => {
    const svg = await get('/v1/%22%3E%3Cscript%3E.svg').text();
    expect(svg).not.toContain('<script>');
  });

  it('describes itself at any other path', async () => {
    const response = get('/');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ style: 'inkfaces' });
  });

  it('answers preflight and refuses anything but GET', () => {
    expect(worker.fetch(new Request('https://example.com/v1/ada.svg', { method: 'OPTIONS' })).status).toBe(200);
    expect(worker.fetch(new Request('https://example.com/v1/ada.svg', { method: 'POST' })).status).toBe(405);
  });
});
