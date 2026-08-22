# Contributing

## Getting set up

```bash
npm install
npm run dev     # the site, with the engine loaded from source
npm test
```

## Adding a variant

A variant is an entry in a catalogue under `packages/core/src/parts/`:

```ts
export const HAIR: Catalog = {
  windswept: {
    weight: 2,                       // relative likelihood; common things get more
    draw: (ctx) => mass(ctx, crown(ctx, { drop: 0.6, puff: 0.12 }).band),
  },
};
```

`draw` receives a context and returns strings of SVG per layer. It must be pure: the
only randomness allowed is `ctx.random`, which is the part's own stream. Calling
`Math.random()`, reading the clock, or reaching for anything outside the context
breaks determinism, and the test suite will say so.

Hang geometry off `ctx.layout` rather than off fixed numbers — `layout.at(angle)`
gives you the point on the face outline at that angle, and `layout.out(angle, scale)`
gives you a point pushed out from it. That is what keeps a hat sitting on a potato
head as well as on a round one.

**Adding a variant shifts the odds inside its own trait**, so existing seeds can pick
a different value for that one trait. That is a style change: bump `STYLE_VERSION` in
`packages/core/src/render.ts`, update the snapshot with `npm test -- -u`, and say so
in the pull request. Nothing else may change what an existing seed draws.

## Before opening a pull request

```bash
npm run typecheck
npm test
```

Then look at the grid on the site. Thirty faces at once will tell you in a second
what a unit test cannot: whether the new thing shows up too often, whether it
collides with hats, whether it still reads as drawn by hand.
