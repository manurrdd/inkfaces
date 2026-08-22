import { COLOR_KEYS, COMBINATIONS, FEATURE_KEYS, OPTIONS, SWATCHES, avatar, type Options } from 'inkfaces';

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const portrait = el('portrait');
const seedInput = el<HTMLInputElement>('seed');
const controls = el('controls');
const grid = el('grid');
const hint = el('hint');

/** Traits the visitor has pinned. Everything else follows the seed. */
const pinned: Record<string, string> = {};

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

function label(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function draw(): void {
  portrait.innerHTML = avatar(seed, options());
  const count = Object.keys(pinned).length;
  hint.textContent = count === 0 ? 'Nothing pinned — the seed decides everything.' : `${count} trait${count === 1 ? '' : 's'} pinned.`;
  for (const select of controls.querySelectorAll<HTMLSelectElement>('select')) {
    select.value = pinned[select.name] ?? '';
  }
  for (const swatch of controls.querySelectorAll<HTMLButtonElement>('.swatch')) {
    const key = swatch.dataset.key as string;
    swatch.setAttribute('aria-pressed', String(pinned[key] === swatch.dataset.value));
  }
}

function buildControls(): void {
  for (const key of FEATURE_KEYS) {
    const row = document.createElement('div');
    row.className = 'row';

    const name = document.createElement('label');
    name.textContent = label(key);
    name.htmlFor = `pick-${key}`;

    const select = document.createElement('select');
    select.id = `pick-${key}`;
    select.name = key;
    select.append(new Option('random', ''));
    for (const value of OPTIONS[key] ?? []) select.append(new Option(label(value), value));
    select.addEventListener('change', () => {
      if (select.value) pinned[key] = select.value;
      else delete pinned[key];
      draw();
    });

    row.append(name, select);
    controls.append(row);
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
      button.addEventListener('click', () => {
        if (pinned[key] === value) delete pinned[key];
        else pinned[key] = value;
        draw();
      });
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
