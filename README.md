# InkFaces

Hand-drawn avatars, generated. Give it a seed — a username, an email, an id — and it
draws the same face every time, in wobbling ballpoint lines on off-register colour,
as if someone had filled a page of a notebook with them.

No canvas, no fonts, no network, no dependencies. One function in, one SVG string out.

```js
import { avatar } from 'inkfaces';

document.body.innerHTML = avatar('ada@example.com');
```

**[Try it](https://manurrdd.github.io/inkfaces/)** — type a seed, pin the traits you care
about, download the SVG or the PNG.

## Why another avatar generator

Most generators assemble a face out of a fixed set of drawn pieces, so every nose in
the world is the same nose. InkFaces draws each face from scratch: the outline, the
wobble of every line, the way the colour misses its outline, the tilt of the head and
the placement of the features are all computed. Two faces with the same eyes are still
two different drawings — which is the whole point of a style built on imperfection.

## Install

```bash
npm install inkfaces
```

## Use

```js
import { avatar, traits, dataUri } from 'inkfaces';

avatar('ada');                                   // <svg …>
avatar('ada', { size: 128 });                    // with width/height attributes
avatar('ada', { hair: 'curly', glasses: 'round' }); // pin what you care about
avatar('ada', { grain: false });                 // no paper texture

dataUri('ada');                                  // data:image/svg+xml;utf8,…
traits('ada');                                   // { hair: 'bob', eyes: 'dots', … }
```

Every trait you pin stays put; every trait you leave alone keeps following the seed.
An unknown trait value is ignored rather than thrown, because these usually arrive
from a query string.

### Traits

| Trait | Values |
| --- | --- |
| `face` | 10 head shapes |
| `hair` | 22 |
| `eyes` | 14 |
| `brows` | 10 |
| `nose` | 10 |
| `mouth` | 14 |
| `ears` | 5 |
| `beard` | 11 |
| `glasses` | 10 |
| `hat` | 10 |
| `earrings` | 6 |
| `marks` | 9 — freckles, blush, a plaster, a scar |
| `clothes` | 12 |
| `background` | 7 |
| `skinColor` `hairColor` `clothesColor` `backgroundColor` `paperColor` | named swatches |

The full list is exported, so an editor can be built without hard-coding anything:

```js
import { OPTIONS, SWATCHES, COMBINATIONS } from 'inkfaces';

OPTIONS.hair;        // ['bald', 'buzz', 'short', …]
SWATCHES.skinColor;  // { porcelain: '#f6ded0', … }
COMBINATIONS;        // 20_797_… (a bigint)
```

### Options

| Option | Meaning |
| --- | --- |
| `size` | Pixel size written into `width`/`height`. Omit for a purely scalable SVG. |
| `grain` | Paper texture. `true` by default. |
| `title` | Accessible label. Defaults to the seed. |

## HTTP API

For when you cannot run JavaScript where the avatar is needed.

```
GET https://inkfaces.manurrdd.workers.dev/v1/{seed}.svg?hair=curly&glasses=round&size=256
```

```html
<img src="https://inkfaces.manurrdd.workers.dev/v1/ada.svg?size=96" alt="" width="96">
```

Without the `/v1/` prefix it answers with its own documentation, including the full
trait catalogue.

Responses are pure functions of the URL and are cached immutably. The worker in
`apps/api` is a single file with no bindings, no storage and nothing to log — deploy
your own with `npx wrangler deploy` and you own the whole path.

## The same seed, forever

`STYLE_VERSION` is the promise. While it stays at `1`, a seed draws the same face
across every release: bug fixes are allowed, changes to what a seed looks like are
not. Each trait draws from its own random stream derived from the seed and the
trait's name, so adding a hairstyle cannot move anybody's eyes.

Adding values to a catalogue does change the odds *within that one trait*, which is
the one thing that cannot be isolated. A release that does it bumps `STYLE_VERSION`
and says so in the changelog. A test over two hundred fixed seeds fails loudly if
anything else drifts.

## Layout

```
packages/core   the engine — the published `inkfaces` package
apps/web        the site: pick a seed, pin traits, download SVG or PNG
apps/api        the HTTP endpoint, one Cloudflare Worker file
```

```bash
npm install
npm run dev        # the site
npm test           # determinism and coverage
npm run build      # build the package
```

## Licence

Code is MIT. The avatars it draws are yours: no attribution, no restrictions,
commercial use included. There is no licensed artwork inside — every line is
computed, so there is nobody to credit and nothing to pay for.
