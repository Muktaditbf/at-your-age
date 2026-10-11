# Contributing

Thanks for helping! This is a small, friendly project. Here's how to get going.

## Add a line

Everything the paper says that isn't a fact lives in [`src/lib/lines.ts`](src/lib/lines.ts):

- `ROASTS`: shown after "Meanwhile, you:" in the roast edition
- `HYPES`: the hype edition's encouragement
- `CLASSIFIEDS`: the little ads between stories
- `PRESS_LINES`: what the press room says while it searches

A good line:

- is about procrastination and everyday life, **never** about who someone is, how they look, where
  they're from or what they believe, and never about the famous people;
- is short: under 80 characters, so it fits on the share image;
- works for anyone, anywhere.

Not sure? [Suggest it in an issue](https://github.com/Muktaditbf/at-your-age/issues/new?template=line.yml)
and we'll figure it out together.

## Work on the code

```bash
npm install
npm run dev        # the app
npm test           # unit tests
npm run check      # lint, format and types
npm run e2e        # end-to-end tests (npx playwright install chromium, once)
```

Before opening a pull request, please run `npm run check`, `npm test` and `npm run e2e`.

## Change what gets found

The searches are in [`src/lib/sparql.ts`](src/lib/sparql.ts). Fame thresholds are per desk and per
edition. To see what a change does, run a live probe:

```bash
npm run probe -- 24 roast          # all desks for age 24
npm run probe -- 50 hype award     # one desk
```

QLever is a shared public service, so please don't hammer it: probes run one search at a time.

If you change the searches, re-record the test answers with `npm run fixtures`.

## The blocklist

[`src/data/blocklist.ts`](src/data/blocklist.ts) lists people the paper never shows. Additions need
a short reason in the pull request. `npm run probe -- --blocklist` checks every Wikidata ID still
belongs to the expected name.
