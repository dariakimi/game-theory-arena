// Checks every game's data. Run: node tools/validate.mjs
import { nash, fmt, ULT_STEPS, ultimatumOutcome, centNodes, centYourOptions } from '../js/engine.js';

const files = process.argv.slice(2);
let games;
if (files.length) {
  games = [];
  for (const f of files) games.push(...(await import(new URL('../js/games/' + f, import.meta.url))).default);
} else {
  games = (await import('../js/games/index.js')).GAMES;
}

const errors = [];
const err = (g, msg) => errors.push(`${g.id || '?'}: ${msg}`);
const ids = new Set();

for (const g of games) {
  if (ids.has(g.id)) err(g, 'duplicate id');
  ids.add(g.id);
  for (const k of ['id', 'type', 'emoji', 'title', 'tag', 'setup', 'unit', 'them', 'takeaway'])
    if (g[k] === undefined) err(g, `missing ${k}`);
  if (g.setup && g.setup.length > 140) err(g, `setup is ${g.setup.length} chars (max 140)`);
  if (g.takeaway && g.takeaway.length > 140) err(g, `takeaway is ${g.takeaway.length} chars (max 140)`);
  if (g.takeaway && /[.!?]\s+[A-Z]/.test(g.takeaway)) err(g, 'takeaway should be one sentence');
  if (g.why && g.why.length > 260) err(g, `why is ${g.why.length} chars (max 260)`);
  if (g.unit && g.unit.better && !['higher', 'lower'].includes(g.unit.better)) err(g, 'bad unit.better');

  if (g.type === 'matrix') {
    const R = g.rows?.length, C = g.cols?.length;
    if (!R || !C) { err(g, 'missing rows/cols'); continue; }
    if (g.pay?.length !== R * C) { err(g, `pay has ${g.pay?.length} cells, expected ${R * C}`); continue; }
    if (!g.pay.every(p => p.length === 2 && p.every(Number.isFinite))) err(g, 'pay must be [[num,num],...]');
    const n = nash(g);
    if (JSON.stringify(n) !== JSON.stringify(g.expectNash))
      err(g, `Nash ${JSON.stringify(n)} but expectNash ${JSON.stringify(g.expectNash)}`);
    if (g.coop !== undefined && !(g.coop >= 0 && g.coop < R)) err(g, 'coop row out of range');
    for (const l of [...g.rows, ...g.cols]) if (l.length > 24) err(g, `label too long: "${l}"`);
  } else if (g.type === 'ultimatum') {
    if (!(g.pot > 0 && g.threshold > 0 && g.threshold < 100)) err(g, 'bad pot/threshold');
    if (!ULT_STEPS.some(k => ultimatumOutcome(g, k).accepted)) err(g, 'no acceptable offer');
  } else if (g.type === 'centipede') {
    if (!(g.nodes >= 4 && g.nodes % 2 === 0)) err(g, 'nodes must be even and >= 4');
    if (!centNodes(g).length || !centYourOptions(g).length) err(g, 'centipede produced no nodes');
  } else err(g, `unknown type ${g.type}`);
}

if (!files.length && games.length !== 80) errors.push(`expected 80 games, found ${games.length}`);

// Quick sample of formatting so units can be eyeballed.
if (process.env.SHOW) for (const g of games.filter(g => g.type === 'matrix'))
  console.log(g.id.padEnd(28), g.pay.slice(0, 2).map(p => p.map(v => fmt(v, g.unit)).join(' / ')).join('  |  '));

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); console.error(`\n${errors.length} problem(s) in ${games.length} games`); process.exit(1); }
console.log(`✓ ${games.length} games valid`);
