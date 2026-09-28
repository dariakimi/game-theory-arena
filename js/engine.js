// Pure game logic: no DOM access. Shared by the UI and tools/validate.mjs.

// ---------- Units ----------
// A game's `unit` is { k:'usd' } for money (raw dollars), or a custom
// { suf:' yrs', pre:'', dec:0 }. `better` is 'higher' (default) or 'lower'.
export function fmt(v, unit, { signed = false } = {}) {
  const neg = v < 0;
  const a = Math.abs(v);
  let body;
  if (unit.k === 'usd') {
    if (a >= 1e9) body = '$' + trim(a / 1e9) + 'B';
    else if (a >= 1e6) body = '$' + trim(a / 1e6) + 'M';
    else if (a >= 1e4) body = '$' + trim(a / 1e3) + 'k';
    else body = '$' + a.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } else {
    const dec = unit.dec ?? (Number.isInteger(a) ? 0 : 1);
    body = (unit.pre || '') + a.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (unit.suf || '');
  }
  if (neg) return '−' + body;
  return (signed && v > 0 ? '+' : '') + body;
}
function trim(x) {
  return x >= 100 ? String(Math.round(x)) : String(Math.round(x * 10) / 10);
}

// Utility: bigger is always better, whatever the unit's direction.
export const util = (v, unit) => (unit.better === 'lower' ? -v : v);

// ---------- Matrix games ----------
export const dims = g => ({ R: g.rows.length, C: g.cols.length });
export const cell = (g, r, c) => g.pay[r * g.cols.length + c];

// Pure-strategy Nash equilibria (weak: no player can strictly gain by deviating).
export function nash(g) {
  const { R, C } = dims(g);
  const u = (r, c, p) => util(cell(g, r, c)[p], g.unit);
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    let ok = true;
    for (let r2 = 0; r2 < R && ok; r2++) if (u(r2, c, 0) > u(r, c, 0)) ok = false;
    for (let c2 = 0; c2 < C && ok; c2++) if (u(r, c2, 1) > u(r, c, 1)) ok = false;
    if (ok) out.push(r * C + c);
  }
  return out;
}

// Cell(s) with the highest combined utility.
export function bestJoint(g) {
  const sums = g.pay.map(([a, b]) => util(a, g.unit) + util(b, g.unit));
  const max = Math.max(...sums);
  return sums.map((s, i) => (s === max ? i : -1)).filter(i => i >= 0);
}

// Opponent: play a dominant column if one exists, else a Nash column, else random.
export function opponentMove(g, rand = Math.random) {
  const { R, C } = dims(g);
  const u = (r, c) => util(cell(g, r, c)[1], g.unit);
  for (let c = 0; c < C; c++) {
    let dom = true;
    for (let c2 = 0; c2 < C && dom; c2++) {
      if (c2 === c) continue;
      for (let r = 0; r < R; r++) if (u(r, c) < u(r, c2)) { dom = false; break; }
    }
    if (dom) return c;
  }
  const cols = [...new Set(nash(g).map(i => i % C))];
  const pool = cols.length ? cols : [...Array(C).keys()];
  return pool[Math.floor(rand() * pool.length)];
}

// Grade a matrix move against the column the opponent actually played.
export function gradeMatrix(g, r, c) {
  const { R } = dims(g);
  const col = [...Array(R).keys()].map(i => util(cell(g, i, c)[0], g.unit));
  const mine = col[r], max = Math.max(...col), min = Math.min(...col);
  const bestRows = col.map((v, i) => (v === max ? i : -1)).filter(i => i >= 0);
  const pct = max === min ? 1 : (mine - min) / (max - min);
  let letter;
  if (mine === max) letter = 'A';
  else if (bestJoint(g).includes(r * g.cols.length + c)) letter = 'B';
  else letter = letterFromPct(pct);
  return { letter, pct, bestRows, bestValue: cell(g, bestRows[0], c)[0] };
}

export function letterFromPct(p) {
  return p >= 0.999 ? 'A' : p >= 0.66 ? 'B' : p >= 0.4 ? 'C' : p > 0 ? 'D' : 'F';
}
export const GRADE_SCORE = { A: 100, B: 80, C: 60, D: 40, F: 20 };
export function letterFromScore(s) {
  return s >= 90 ? 'A' : s >= 70 ? 'B' : s >= 50 ? 'C' : s >= 30 ? 'D' : 'F';
}

// ---------- Ultimatum ----------
export const ULT_STEPS = [...Array(19).keys()].map(i => (i + 1) * 5); // % you keep: 5..95

export function ultimatumOutcome(g, keepPct) {
  const mine = Math.round(g.pot * keepPct / 100);
  const theirs = g.pot - mine;
  const accepted = theirs >= g.pot * g.threshold / 100;
  const rej = g.rejectPay || [0, 0];
  return { accepted, you: accepted ? mine : rej[0], them: accepted ? theirs : rej[1], offered: theirs };
}

export function gradeUltimatum(g, keepPct) {
  const vals = ULT_STEPS.map(k => ultimatumOutcome(g, k).you);
  const max = Math.max(...vals), min = Math.min(...vals);
  const mine = ultimatumOutcome(g, keepPct).you;
  const bestKeep = ULT_STEPS[vals.indexOf(max)];
  const pct = max === min ? 1 : (mine - min) / (max - min);
  return { letter: letterFromPct(pct), pct, bestKeep, bestValue: max };
}

// ---------- Centipede ----------
// Node i: mover is you on even i, the opponent on odd i. The pot doubles
// (x growth) every pass; whoever takes gets `takeShare` of it.
export function centNodes(g) {
  const nodes = [];
  let pot = g.startPot;
  for (let i = 0; i < g.nodes; i++) {
    const big = Math.round(pot * g.takeShare), small = Math.round(pot - pot * g.takeShare);
    const you = i % 2 === 0;
    nodes.push({ pot: Math.round(pot), mover: you ? 'you' : 'them', you: you ? big : small, them: you ? small : big });
    pot *= g.growth;
  }
  return nodes;
}

// Opponent 'patient' passes until its final move; 'greedy' takes at once.
export const centOpponentTakes = (g, i) => g.opponent === 'greedy' || i === lastOppNode(g);
const lastOppNode = g => (g.nodes - 1) % 2 === 1 ? g.nodes - 1 : g.nodes - 2;

// What you'd earn stopping at each of your nodes, given the opponent's policy.
export function centYourOptions(g) {
  const nodes = centNodes(g);
  const out = [];
  for (let i = 0; i < g.nodes; i++) {
    if (nodes[i].mover === 'you') { out.push({ stopAt: i, you: nodes[i].you }); continue; }
    if (centOpponentTakes(g, i)) { out.push({ stopAt: i, you: nodes[i].you, forced: true }); break; }
  }
  return out;
}

export function gradeCentipede(g, earned) {
  const vals = centYourOptions(g).map(o => o.you);
  const max = Math.max(...vals), min = Math.min(...vals);
  const pct = max === min ? 1 : (earned - min) / (max - min);
  return { letter: letterFromPct(pct), pct, bestValue: max };
}
