# Game Theory Arena

80 real-world strategy games with real stakes: dollars, years in prison, market share. Play at https://dariakimi.github.io/game-theory-arena/

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves the `main` branch as-is.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk won't work, because ES modules need a server.

## Adding or editing a game

Games live in `js/games/<category>.js`. A two-player table game looks like this:

```js
{ id: 'prisoners-dilemma', type: 'matrix', emoji: '🚔', title: "Prisoner's Dilemma", tag: 'Dominant strategy',
  setup: 'One or two sentences, max 140 characters.',
  unit: { suf: ' yrs', one: ' yr', better: 'lower', label: 'years in prison' }, // or { k: 'usd', label: 'profit' }
  them: 'Partner', coop: 0,                       // coop = index of the "cooperative" row (optional)
  rows: ['Stay silent', 'Confess'], cols: ['Stays silent', 'Confesses'],
  pay: [[1, 1], [10, 0], [0, 10], [5, 5]],        // [you, them] per cell, row by row, in real units
  expectNash: [3],                                // cells you intend to be Nash equilibria
  takeaway: 'One sentence shown after playing.',
  why: 'Optional short explanation.' }
```

Nash equilibria are computed from `pay`. After any change, run the validator:

```bash
node tools/validate.mjs
```

It checks every game: that the computed Nash equilibria match `expectNash`, that `pay` fits the table size, and that text stays within its length limits.
