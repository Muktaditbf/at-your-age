<div align="center">

<img src="docs/banner.png" alt="At Your Age… A red tabloid front page saying 'At 24… Michael Jackson releases Thriller. Meanwhile, you: practiced your autograph.' next to a sunny 'Late Bloomer Times' page with Barack Obama, and a shareable front-page image." width="100%">

# At Your Age…

**Type your age. See what famous people had already done by then.**
Get roasted, or get hyped.

[**Open the app →**](https://muktaditbf.github.io/at-your-age/)
&nbsp;·&nbsp; [Report a bug](https://github.com/Muktaditbf/at-your-age/issues/new?template=bug_report.yml)
&nbsp;·&nbsp; [Suggest a line](https://github.com/Muktaditbf/at-your-age/issues/new?template=line.yml)

[![CI](https://github.com/Muktaditbf/at-your-age/actions/workflows/ci.yml/badge.svg)](https://github.com/Muktaditbf/at-your-age/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-d6000f?labelColor=000000)](LICENSE)
[![Live data: Wikidata](https://img.shields.io/badge/live%20data-Wikidata-f2a900?labelColor=0f3d2e)](#where-the-facts-come-from)
[![No tracking](https://img.shields.io/badge/tracking-none-f6f5f1?labelColor=000000)](#privacy)

</div>

---

## What it does

You type an age. The app prints a newspaper front page about it, using live facts from Wikidata.

- **Roast edition, _The Daily Disappointment_:** what famous people did at exactly your age.
  "At 24, Michael Jackson releases ‘Thriller’. _Meanwhile, you:_ reheated the same coffee three times."
- **Hype edition, _The Late Bloomer Times_:** famous people who did their big thing _later_ than
  your age, and how much runway that gives you.
  "Barack Obama becomes President of the United States. Age 47: 23 years of runway."

Flip between the two with one tap. Then share your front page as an image.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/roast.png" width="250" alt="Roast edition: Michael Jackson releases Thriller at 24, with a ROASTED stamp"><br><sub><b>Roast</b>: what they did at your age</sub></td>
    <td align="center"><img src="docs/screenshots/hype.png" width="250" alt="Hype edition: Barack Obama becomes President at 47, with a Still time ribbon"><br><sub><b>Hype</b>: who did it later than you</sub></td>
    <td align="center"><img src="docs/screenshots/night.png" width="250" alt="The roast edition in night mode"><br><sub><b>Night print</b> follows your system</sub></td>
  </tr>
  <tr>
    <td align="center" colspan="3">
      <img src="docs/screenshots/card-roast.png" width="270" alt="Shareable roast front page image">
      <img src="docs/screenshots/card-hype.png" width="270" alt="Shareable hype front page image"><br>
      <sub><b>Share your front page</b>: made on your device, sent through your phone's share menu</sub>
    </td>
  </tr>
</table>

## Features

- 🗞️ **Two editions of one paper.** A red-top tabloid for roasts and a sunny paper for hype.
  Switching flips the whole page over.
- ⌨️ **The headline is the form.** The page says "At _your age_…"; type over "your age" and press
  Enter. Quick picks and +/− buttons help on phones.
- 📡 **Always live.** Every search asks Wikidata fresh. Nothing is cached, so new facts show up as
  soon as volunteers add them.
- ⏳ **Fun while you wait.** "Stop the presses!" shows which of the five newsroom desks has
  answered, and stories appear as they arrive. The first ones usually show up within about
  4 seconds.
- 🧾 **Honest ages.** When Wikidata only knows the year, the paper says "around age 24" instead
  of pretending. Every story links to its source.
- 📤 **Share card.** A 1080×1350 image (halftone photos for roasts, colour arches for hype) shared
  through your phone's share menu, or downloaded.
- 🔗 **Links that work.** `?age=24&mode=hype` opens that front page directly, and Back goes back.
  Shared links show a proper title and preview image.
- ♿ **Accessible.** Works with a keyboard and screen readers, respects reduced motion, and is
  checked with axe in both editions, by day and by night.

## Where the facts come from

1. **Five searches per age**, one per newsroom desk:

   | Desk | Wikidata fact |
   | --- | --- |
   | Books, films and music | notable work (P800) and its publication date |
   | Awards | award received (P166) and when |
   | Crowns and offices | position held (P39) and its start, for offices tied to a place |
   | Companies and bands | founded by (P112) and inception |
   | Discoveries and inventions | discoverer or inventor (P61) and when |

2. They run on **[QLever](https://qlever.dev/wikidata)**, a fast public search engine for Wikidata
   from the University of Freiburg. The official Wikidata endpoint needed 17–47 seconds for these
   questions; QLever answers in about 3–6. At most three searches run at once, and if the server
   says "slow down", the app waits and asks again.
3. **Photos and one-line bios** come from English Wikipedia, 50 people per request.
4. "Famous" means many Wikipedia language editions have an article about the person (and the
   thing they did). The hype edition asks for a bit more fame.

**Honesty rules:**

- Ages come from the birth date and the date of the deed. If either date is only known to the year
  (or to the month, in the birth month), the age is shown as "around".
- Nothing dated after someone's death counts, so no posthumous albums.
- Some people are never shown: perpetrators of genocide and mass murder, terrorists, serial killers
  and notorious abusers, plus founders of religions and prophets, whom many readers hold sacred.
  The list is in [`src/data/blocklist.ts`](src/data/blocklist.ts) and `npm run probe -- --blocklist`
  checks it against Wikidata.
- Wikidata is written by volunteers, so now and then a date is wrong. Every story links to its
  Wikipedia article.

## Privacy

- No accounts, no cookies, no analytics. Fonts are bundled.
- The only things sent anywhere: the age you type (inside the search sent to QLever) and the names
  in your results (to Wikipedia, for photos).
- Just opening the home page contacts no one. Connections start when you tap the age box or open
  a link that already has an age.
- The share image is drawn in your browser. It never leaves your device unless you share it.

## Built with

- **React 19**, **TypeScript** (strict) and **Vite 8**
- **Tailwind CSS v4** with two editions × two prints of design tokens
- **SPARQL** on [QLever](https://qlever.dev/wikidata), plus the Wikipedia API
- **Canvas** for the share card, including a real halftone screen
- **zod** (mini) to check every answer from the servers
- **Vitest** unit tests and **Playwright** end-to-end tests on phone and desktop sizes, against
  recorded real answers, including failure and retry paths and **axe** accessibility checks
- **GitHub Actions** for CI and **GitHub Pages** for hosting

```
src/
├── lib/sparql.ts      # the five searches, as SPARQL
├── lib/qlever.ts      # fetch with timeouts, retries and at most 3 at a time
├── lib/dates.ts       # Wikidata dates and honest age math ("around")
├── lib/stories.ts     # rows → one story per person
├── lib/headline.ts    # "Michael Jackson releases ‘Thriller’"
├── lib/wikipedia.ts   # photos and one-line bios
├── lib/lines.ts       # everything the paper says that isn't a fact ← PRs welcome!
├── lib/shareCard.ts   # the shareable front page, drawn on a canvas
├── lib/edition.ts     # runs one edition: searches, progress, retries
├── data/blocklist.ts  # people the paper leaves out
└── components/        # masthead, the age form, stories, the press room, sharing
```

## Run it locally

```bash
git clone https://github.com/Muktaditbf/at-your-age.git
cd at-your-age
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | End-to-end tests against recorded answers (run `npx playwright install chromium` once) |
| `npm run e2e:live` | A smoke test against the real QLever and Wikipedia |
| `npm run check` | Lint, format check and type check |
| `npm run build` | Production build into `dist/` |
| `npm run probe -- 24 roast` | Print what the live searches return for an age, for tuning |
| `npm run fixtures` | Re-record the answers the end-to-end tests use |
| `npm run screenshots` | Regenerate the README images (needs `npm run preview` running) |
| `npm run og` | Regenerate the link preview image (needs a server running) |

The app is served from `/at-your-age/` for GitHub Pages. To host it at the root of a domain, build
with `BASE_PATH=/ npm run build`.

## Contributing

The easiest way to help is a **new line**: a roast, a hype line or a classified ad. Add it to
[`src/lib/lines.ts`](src/lib/lines.ts) or
[suggest one in an issue](https://github.com/Muktaditbf/at-your-age/issues/new?template=line.yml).
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

- Facts: [Wikidata](https://www.wikidata.org/) (CC0), searched with
  [QLever](https://github.com/ad-freiburg/qlever) from the University of Freiburg.
- Photos and bios: [Wikipedia](https://en.wikipedia.org/) and
  [Wikimedia Commons](https://commons.wikimedia.org/). Each photo keeps its own licence; follow the
  story's link for details.
- Fonts: Anton, UnifrakturCook, Fraunces and Newsreader, all under the SIL Open Font License.

## License

[MIT](LICENSE) © Muktaditbf

<div align="center">
<br>
<img src="public/logo.svg" width="64" alt=""><br>
<sub>For everyone who has ever compared their age with Mozart's. You're doing fine.</sub>
</div>
