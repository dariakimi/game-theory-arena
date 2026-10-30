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

const BANNED = /\b(delve|realm|harness|unlock|tapestry|paradigm|cutting\-edge|revolutionize|intricate|intricacies|showcasing|crucial|pivotal|surpass|meticulously|vibrant|unparalleled|underscore|leverage|synergy|innovative|game\-changer|testament|commendable|meticulous|highlight|emphasize|boast|groundbreaking|align|foster|showcase|enhance|holistic|garner|accentuate|pioneering|trailblazing|unleash|versatile|transformative|redefine|seamless|optimize|scalable|robust|breakthrough|empower|streamline|frictionless|elevate|adaptive|effortless|data\-driven|insightful|proactive|mission\-critical|visionary|disruptive|reimagine|unprecedented|intuitive|leading\-edge|synergize|democratize|accelerate|state\-of\-the\-art|dynamic|immersive|predictive|transparent|proprietary|integrated|plug\-and\-play|turnkey|future\-proof|supercharge|enduring|interplay|valuable|captivate|furthermore|moreover|additionally)\w*/i;
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
  const text = [g.title, g.tag, g.setup, g.takeaway, g.why, g.them, g.unit?.label, ...(g.rows || []), ...(g.cols || [])].filter(Boolean).join(' \n ');
  if (/[—–]/.test(text)) err(g, 'contains an em or en dash');
  const banned = text.match(BANNED);
  if (banned) err(g, `banned word: "${banned[0]}"`);
  if (/\bnot (just|only)\b|\bisn't .{1,40}\. it's\b|\bit's not about\b/i.test(text)) err(g, 'reframe pattern ("not X, but Y")');

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


// Quick sample of formatting so units can be eyeballed.
if (process.env.SHOW) for (const g of games.filter(g => g.type === 'matrix'))
  console.log(g.id.padEnd(28), g.pay.slice(0, 2).map(p => p.map(v => fmt(v, g.unit)).join(' / ')).join('  |  '));

if (errors.length) { console.error(errors.map(e => '✗ ' + e).join('\n')); console.error(`\n${errors.length} problem(s) in ${games.length} games`); process.exit(1); }
console.log(`✓ ${games.length} games valid`);
