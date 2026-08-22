import './style.css';
import { COLOR_KEYS, COMBINATIONS, FEATURE_KEYS, OPTIONS, SWATCHES, avatar, traits, type Options } from 'inkfaces';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const portrait = el('portrait');
const seedInput = el<HTMLInputElement>('seed');
const controls = el('controls');
const grid = el('grid');
const hint = el('hint');

/** Traits the visitor has pinned. Everything else follows the seed. */
const pinned: Record<string, string> = {};

/** The trait whose thumbnails are on screen. Only one panel draws at a time. */
let open: string | null = null;

const panels = new Map<string, HTMLDivElement>();
const headers = new Map<string, HTMLButtonElement>();

const WORDS = [
  'ada', 'basil', 'clove', 'dune', 'ember', 'fennel', 'gale', 'hazel', 'iris', 'juno',
  'kite', 'lumen', 'moss', 'nettle', 'olive', 'pike', 'quill', 'rune', 'sable', 'tamar',
  'umber', 'vesper', 'wren', 'xanth', 'yarrow', 'zephyr',
];

function randomSeed(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

let seed = randomSeed();

const options = (): Options => ({ ...pinned }) as Options;

/** What the current seed and pins actually draw, trait by trait. */
const resolved = (): Record<string, string> => traits(seed, options()) as Record<string, string>;

function label(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/** Traits worn on the body: the thumbnail has to show the whole square. */
const WHOLE = new Set(['background', 'clothes']);

/** Traits that live in a few square millimetres of face. Shown close up or not at all. */
const CLOSE = new Set(['brows', 'eyes', 'nose', 'mouth', 'marks', 'glasses']);

/** How tight the thumbnail crops. Freckles need a closer look than a jumper. */
function framing(key: string): string {
  if (WHOLE.has(key)) return 'whole';
  return CLOSE.has(key) ? 'close' : 'head';
}

/** One face wearing a single candidate variant. Grain off: invisible at 72px, three times the cost. */
function preview(key: string, value: string): string {
  return avatar(seed, { ...pinned, [key]: value, grain: false, title: label(value) } as Options);
}

function pin(key: string, value: string): void {
  if (pinned[key] === value) delete pinned[key];
  else pinned[key] = value;
  draw();
}

/** Fills the open panel with a thumbnail per variant. Everything else stays empty. */
function fillPanel(key: string): void {
  const panel = panels.get(key);
  if (!panel) return;
  const current = resolved()[key];

  panel.innerHTML = '';
  for (const value of OPTIONS[key] ?? []) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'option';
    cell.dataset.value = value;
    cell.dataset.framing = framing(key);
    cell.innerHTML = `<span class="thumb">${preview(key, value)}</span><span class="name">${label(value)}</span>`;
    cell.addEventListener('click', () => pin(key, value));
    panel.append(cell);
    mark(cell, key, value, current);
  }
}

function mark(cell: HTMLButtonElement, key: string, value: string, current: string): void {
  const isPinned = pinned[key] === value;
  cell.setAttribute('aria-pressed', String(isPinned));
  cell.toggleAttribute('data-seeded', !isPinned && current === value);
  cell.title = isPinned ? `${label(value)} — click again to unpin` : label(value);
}

/** Highlights follow a click immediately; the thumbnails themselves can wait a beat. */
function markPanel(): void {
  if (!open) return;
  const panel = panels.get(open);
  if (!panel) return;
  const current = resolved()[open];
  for (const cell of panel.querySelectorAll<HTMLButtonElement>('.option')) {
    mark(cell, open, cell.dataset.value as string, current);
  }
}

let pending: ReturnType<typeof setTimeout> | undefined;

function refreshPanel(): void {
  if (!open) return;
  clearTimeout(pending);
  pending = setTimeout(() => open && fillPanel(open), 90);
}

function toggle(key: string): void {
  open = open === key ? null : key;
  clearTimeout(pending);
  for (const [other, panel] of panels) {
    const expanded = other === key && open === key;
    panel.hidden = !expanded;
    headers.get(other)?.setAttribute('aria-expanded', String(expanded));
    if (!expanded) panel.innerHTML = '';
  }
  if (open) fillPanel(open);
}

function draw(): void {
  portrait.innerHTML = avatar(seed, options());
  const count = Object.keys(pinned).length;
  hint.textContent = count === 0 ? 'Nothing pinned — the seed decides everything.' : `${count} trait${count === 1 ? '' : 's'} pinned.`;

  const current = resolved();
  for (const [key, header] of headers) {
    const value = header.querySelector('.trait-value') as HTMLElement;
    value.textContent = label(current[key]);
    value.classList.toggle('pinned', key in pinned);
  }
  for (const swatch of controls.querySelectorAll<HTMLButtonElement>('.swatch')) {
    const key = swatch.dataset.key as string;
    swatch.setAttribute('aria-pressed', String(pinned[key] === swatch.dataset.value));
  }

  markPanel();
  refreshPanel();
}

function buildControls(): void {
  for (const key of FEATURE_KEYS) {
    const trait = document.createElement('div');
    trait.className = 'trait';

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'trait-head';
    header.id = `head-${key}`;
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `panel-${key}`);
    header.innerHTML = `<span class="trait-name">${label(key)}</span><span class="trait-value"></span>`;
    header.addEventListener('click', () => toggle(key));

    const panel = document.createElement('div');
    panel.className = 'options';
    panel.id = `panel-${key}`;
    panel.hidden = true;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-labelledby', header.id);

    headers.set(key, header);
    panels.set(key, panel);
    trait.append(header, panel);
    controls.append(trait);
  }

  for (const key of COLOR_KEYS) {
    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('span');
    name.className = 'rowlabel';
    name.textContent = label(key);

    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    for (const [value, hex] of Object.entries(SWATCHES[key] ?? {}) as [string, string][]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.style.background = hex;
      button.title = label(value);
      button.dataset.key = key;
      button.dataset.value = value;
      button.setAttribute('aria-label', `${label(key)}: ${value}`);
      button.addEventListener('click', () => pin(key, value));
      swatches.append(button);
    }

    row.append(name, swatches);
    controls.append(row);
  }
}

function fillGrid(): void {
  grid.innerHTML = '';
  for (let i = 0; i < 28; i++) {
    const other = randomSeed();
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.title = other;
    cell.innerHTML = avatar(other, options());
    cell.addEventListener('click', () => {
      seed = other;
      seedInput.value = other;
      draw();
    });
    grid.append(cell);
  }
}

function download(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPng(): void {
  const svg = avatar(seed, { ...options(), size: 512 });
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext('2d')?.drawImage(image, 0, 0, 512, 512);
    canvas.toBlob((blob) => blob && download(`${seed}.png`, blob), 'image/png');
  };
  image.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function snippet(): string {
  const pins = Object.entries(pinned);
  const args = pins.length ? `, { ${pins.map(([k, v]) => `${k}: '${v}'`).join(', ')} }` : '';
  return `import { avatar } from 'inkfaces';\n\nconst svg = avatar('${seed}'${args});`;
}

seedInput.value = seed;
seedInput.addEventListener('input', () => {
  seed = seedInput.value;
  draw();
});

el('shuffle').addEventListener('click', () => {
  seed = randomSeed();
  seedInput.value = seed;
  draw();
});

el('reset').addEventListener('click', () => {
  for (const key of Object.keys(pinned)) delete pinned[key];
  draw();
});

el('svg').addEventListener('click', () => {
  download(`${seed}.svg`, new Blob([avatar(seed, options())], { type: 'image/svg+xml' }));
});

el('png').addEventListener('click', downloadPng);

el('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(snippet());
  hint.textContent = 'Copied.';
});

el('reroll').addEventListener('click', fillGrid);

el('count').textContent = `${COMBINATIONS.toLocaleString('en-US')} possible faces.`;

buildControls();
draw();
fillGrid();
