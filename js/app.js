import { GAMES, CATEGORIES, GAME_BY_ID, CAT_BY_KEY } from './games/index.js?v=2';
import {
  fmt, util, cell, nash, bestJoint, opponentMove, gradeMatrix,
  ULT_STEPS, ultimatumOutcome, gradeUltimatum,
  centNodes, centOpponentTakes, gradeCentipede,
  GRADE_SCORE, letterFromScore,
} from './engine.js?v=2';

const $ = sel => document.querySelector(sel);
const app = $('#app');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ============ Persistence ============
const KEY = 'gta-v2';
let store = { results: {}, run: null };
try { store = { ...store, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* storage unavailable */ }
// Drop saved data for games that no longer exist.
for (const id of Object.keys(store.results || {})) if (!GAME_BY_ID[id]) delete store.results[id];
if (store.run) {
  const before = store.run.ids.length;
  store.run.ids = store.run.ids.filter(id => GAME_BY_ID[id]);
  store.run.results = (store.run.results || []).filter(r => GAME_BY_ID[r.id]);
  store.run.idx = Math.max(0, Math.min(store.run.idx - (before - store.run.ids.length), store.run.ids.length));
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* ignore */ } };

// Current in-progress game (not persisted).
let live = null;

// ============ Helpers ============
const goalText = g => `${g.unit.better === 'lower' ? 'Minimize' : 'Maximize'} ${g.unit.label}`;
const gradeClass = l => 'grade-' + l.toLowerCase();

// Colour a value from red (worst for that player in this game) to green (best).
function tone(g, v, player) {
  const vals = g.pay.map(p => util(p[player], g.unit));
  const min = Math.min(...vals), max = Math.max(...vals);
  const t = max === min ? 0.5 : (util(v, g.unit) - min) / (max - min);
  return `--h:${Math.round(t * 140)}`;
}

function countUp(el, to, unit, ms = 700) {
  if (reduceMotion) { el.textContent = fmt(to, unit); return; }
  const start = performance.now();
  const step = now => {
    const p = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(to * e * 100) / 100, unit);
    if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to, unit);
  };
  requestAnimationFrame(step);
}

function confetti() {
  if (reduceMotion) return;
  const box = $('#confetti');
  const colors = ['#FF6B9A', '#4C7DFF', '#22C07A', '#FFC53D', '#9B6BFF', '#FF8A3D'];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span');
    s.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};--dx:${(Math.random() - .5) * 200}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * .25}s`;
    box.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

function overallStats() {
  const rs = Object.values(store.results);
  if (!rs.length) return null;
  const avg = rs.reduce((t, r) => t + GRADE_SCORE[r.letter], 0) / rs.length;
  return { played: rs.length, letter: letterFromScore(avg) };
}

function updateChrome() {
  const s = overallStats(), el = $('#overall');
  el.hidden = !s;
  if (s) el.innerHTML = `${s.played}/${GAMES.length} played · avg <b class="${gradeClass(s.letter)}">${s.letter}</b>`;
  const run = store.run;
  $('#run-bar').style.width = run && live ? `${(run.idx / run.ids.length) * 100}%` : '0%';
}

function show(html) {
  app.innerHTML = html;
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  updateChrome();
}

// ============ Runs ============
function startRun(ids, label) {
  store.run = { ids, idx: 0, label, results: [] };
  save();
  playCurrent();
}
const quickPlay = () => startRun(shuffle(GAMES.map(g => g.id)).slice(0, 10), 'Quick play');
const playCategory = key => {
  const ids = CAT_BY_KEY[key].games.map(g => g.id);
  startRun(ids, CAT_BY_KEY[key].name);
};
function playFrom(id) {
  const cat = CAT_BY_KEY[GAME_BY_ID[id].cat];
  const ids = cat.games.map(g => g.id), i = ids.indexOf(id);
  startRun([...ids.slice(i), ...ids.slice(0, i)], cat.name);
}

function playCurrent() {
  const run = store.run;
  if (!run || run.idx >= run.ids.length) return renderSummary();
  const g = GAME_BY_ID[run.ids[run.idx]];
  live = { g, done: false };
  renderGame(g);
}

function next() {
  if (!store.run) return renderHome();
  store.run.idx++;
  save();
  playCurrent();
}

function record(g, res) {
  store.results[g.id] = res;
  store.run?.results.push({ id: g.id, ...res });
  save();
  updateChrome();
}

// ============ Home ============
function renderHome() {
  live = null;
  const run = store.run && store.run.idx < store.run.ids.length ? store.run : null;
  show(`
  <section class="hero">
    <p class="eyebrow">${GAMES.length} real-world dilemmas</p>
    <h1>Can you outsmart<br><span class="scribble">the other side?</span></h1>
    <p class="lede">Every game has real stakes, from salaries to prison years. Make your move, see the other side's, and get a grade.</p>
    <div class="hero-cta">
      ${run ? `<button class="btn btn-primary btn-lg" data-action="resume">▶ Continue: ${esc(run.label)} (${run.idx + 1}/${run.ids.length})</button>
               <button class="btn btn-lg" data-action="quick">🎲 New quick game</button>`
            : `<button class="btn btn-primary btn-lg" data-action="quick">▶ Quick game · 10 rounds</button>
               <button class="btn btn-lg" data-action="browse">Browse all ${GAMES.length}</button>`}
    </div>
  </section>
  <h2 class="section-title">Pick a world</h2>
  <section class="cat-grid">
    ${CATEGORIES.map(c => {
      const done = c.games.filter(g => store.results[g.id]).length;
      return `<button class="cat-card c-${c.color}" data-action="cat" data-key="${c.key}">
        <span class="cat-emoji" aria-hidden="true">${c.emoji}</span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-meta">${c.games.length} games${done ? ` · ${done} played` : ''}</span>
        <span class="meter" aria-hidden="true"><span style="width:${(done / c.games.length) * 100}%"></span></span>
      </button>`;
    }).join('')}
  </section>
  <p class="foot">Tip: press <kbd>1</kbd>, <kbd>2</kbd> or <kbd>3</kbd> to choose and <kbd>Enter</kbd> to continue.</p>`);
}

// ============ Game screen ============
function gameHeader(g) {
  const run = store.run, cat = CAT_BY_KEY[g.cat];
  return `
  <div class="game-top">
    <span class="chip c-${cat.color}">${cat.emoji} ${esc(cat.name)}</span>
    <span class="counter">${run.idx + 1} / ${run.ids.length}</span>
  </div>
  <article class="scenario c-${cat.color}">
    <div class="scenario-emoji" aria-hidden="true">${g.emoji}</div>
    <div>
      <p class="tag">${esc(g.tag)}</p>
      <h1 class="scenario-title">${esc(g.title)}</h1>
      <p class="setup">${esc(g.setup)}</p>
      ${g.type === 'matrix' ? stakesList(g) : ''}
      <p class="goal">🎯 Your goal: <b>${esc(goalText(g))}</b></p>
    </div>
  </article>
  <div class="versus">
    <span class="avatar you">🙂 You</span><span class="vs">vs</span>
    <span class="avatar them" id="them">🤖 ${esc(g.them)} <span class="bubble" id="bubble"></span></span>
  </div>`;
}

// Every outcome in words, so the player can weigh the stakes before the grid is revealed.
function stakesList(g) {
  return `<div class="stakes">${g.rows.map((row, r) => `
    <div class="stake-group">
      <p class="stake-move">If you pick <b>${esc(row)}</b></p>
      <ul>${g.cols.map((col, c) => {
        const [y, t] = cell(g, r, c);
        return `<li><span class="stake-if">${esc(g.them)}: ${esc(col)}</span><span class="stake-pay">you <b>${fmt(y, g.unit)}</b>, them ${fmt(t, g.unit)}</span></li>`;
      }).join('')}</ul>
    </div>`).join('')}</div>`;
}

function renderGame(g) {
  let body = '';
  if (g.type === 'matrix') body = matrixChoices(g);
  else if (g.type === 'ultimatum') body = ultimatumBody(g);
  else if (g.type === 'centipede') body = centipedeBody(g);
  show(`${gameHeader(g)}
    <section id="play">${body}</section>
    <section id="result" aria-live="polite"></section>
    <div class="game-actions"><button class="btn btn-ghost btn-sm" data-action="skip">Skip this one →</button></div>`);
  if (g.type === 'ultimatum') bindSlider(g);
  if (g.type === 'centipede') { live.node = 0; drawCentipede(g); }
}

// ----- Matrix -----
function matrixChoices(g) {
  return `<p class="hint">Choose your move. ${esc(g.them)} chooses at the same time, and the grid fills in once you've picked.</p>
  <div class="choices" role="group" aria-label="Your move">
    ${g.rows.map((row, r) => `
      <button class="choice" data-action="choose" data-r="${r}">
        <span class="choice-head"><kbd>${r + 1}</kbd><span class="choice-label">${esc(row)}</span></span>
        <span class="outcomes" style="--n:${g.cols.length}">
          ${g.cols.map((col, c) => {
            return `<span class="outcome" data-c="${c}">
              <span class="if">${esc(g.them)}: <b>${esc(col)}</b></span>
              <span class="val hidden">?</span>
              <span class="their">them ?</span>
            </span>`;
          }).join('')}
        </span>
      </button>`).join('')}
  </div>`;
}

async function chooseMatrix(r) {
  const g = live.g;
  if (live.done || live.busy) return;
  live.busy = true;
  document.querySelectorAll('.choice').forEach((b, i) => { b.disabled = true; b.classList.toggle('picked', i === r); b.classList.toggle('faded', i !== r); });
  await think();
  const c = opponentMove(g);
  $('#bubble').textContent = g.cols[c];
  $('#bubble').classList.add('show');
  const idx = r * g.cols.length + c;
  revealGrid(g);
  document.querySelector(`.choice.picked .outcome[data-c="${c}"]`)?.classList.add('hit');
  await wait(450);

  const [you, them] = cell(g, r, c);
  const gr = gradeMatrix(g, r, c);
  const isNash = nash(g).includes(idx), isJoint = bestJoint(g).includes(idx);
  record(g, { letter: gr.letter, coop: g.coop === undefined ? null : r === g.coop });

  const better = gr.letter === 'A' ? `You couldn't have done better against “${esc(g.cols[c])}”.`
    : `Your best reply to “${esc(g.cols[c])}” was <b>${esc(g.rows[gr.bestRows[0]])}</b>: ${fmt(gr.bestValue, g.unit)}.`;
  resultPanel(g, gr.letter, you, `${esc(g.them)} chose <b>${esc(g.cols[c])}</b> and got ${fmt(them, g.unit)}.`, better,
    `${isNash ? '<span class="badge">⭐ Nash equilibrium</span>' : ''}${isJoint ? '<span class="badge">🤝 Best combined outcome</span>' : ''}`,
    nashMatrix(g, idx) + bestForBoth(g, idx));
}

// Fill in every payoff in the choice grid and mark the Nash equilibria.
function revealGrid(g) {
  const N = nash(g);
  document.querySelectorAll('.choice').forEach((b, r) => {
    b.classList.remove('faded');
    b.querySelectorAll('.outcome').forEach((o, c) => {
      const [y, t] = cell(g, r, c);
      const v = o.querySelector('.val');
      v.classList.remove('hidden');
      v.style.cssText = tone(g, y, 0);
      v.textContent = fmt(y, g.unit);
      o.querySelector('.their').textContent = `them ${fmt(t, g.unit)}`;
      if (N.includes(r * g.cols.length + c)) { o.classList.add('nash'); o.insertAdjacentHTML('beforeend', '<span class="nash-mark" title="Nash equilibrium">⭐</span>'); }
    });
  });
  if (N.length) $('#play').insertAdjacentHTML('beforeend', '<p class="legend">⭐ Nash equilibrium</p>');
}

// The best move for one side when the other side's move is fixed.
const bestRow = (g, c, skip) => g.rows.map((_, r) => r).filter(r => r !== skip).sort((a, b) => util(cell(g, b, c)[0], g.unit) - util(cell(g, a, c)[0], g.unit))[0];
const bestCol = (g, r, skip) => g.cols.map((_, c) => c).filter(c => c !== skip).sort((a, b) => util(cell(g, r, b)[1], g.unit) - util(cell(g, r, a)[1], g.unit))[0];

function nashMatrix(g, hit) {
  const N = nash(g), C = g.cols.length, them = esc(g.them);
  const intro = 'A Nash equilibrium is a pair of moves where neither side can do better by changing only its own move.';
  let body;
  if (!N.length) {
    body = `<p>This game has none. Whatever pair of moves you land on, one side gains by switching, so the safest plan is to keep your moves unpredictable.</p>`;
  } else {
    body = `<p>${N.length === 1 ? 'This game has 1:' : `This game has ${N.length}:`}</p><ul>${N.map(i => {
      const r = Math.floor(i / C), c = i % C, [y, t] = g.pay[i];
      const r2 = bestRow(g, c, r), c2 = bestCol(g, r, c);
      return `<li>You pick <b>${esc(g.rows[r])}</b> and ${them} picks <b>${esc(g.cols[c])}</b>: you get ${fmt(y, g.unit)} and they get ${fmt(t, g.unit)}.
        Switching to “${esc(g.rows[r2])}” would give you ${fmt(cell(g, r2, c)[0], g.unit)}, and switching to “${esc(g.cols[c2])}” would give ${them} ${fmt(cell(g, r, c2)[1], g.unit)}, so neither side wants to move.</li>`;
    }).join('')}</ul>`;
  }
  const r = Math.floor(hit / C), c = hit % C;
  let mine;
  if (N.includes(hit)) mine = 'You landed on a Nash equilibrium, so neither of you would change your move after seeing the other.';
  else {
    const r2 = bestRow(g, c, r), c2 = bestCol(g, r, c);
    const youGain = util(cell(g, r2, c)[0], g.unit) > util(cell(g, r, c)[0], g.unit);
    const themGain = util(cell(g, r, c2)[1], g.unit) > util(cell(g, r, c)[1], g.unit);
    const why = [youGain && `you'd rather have picked “${esc(g.rows[r2])}” (${fmt(cell(g, r2, c)[0], g.unit)})`,
      themGain && `${them} would rather have picked “${esc(g.cols[c2])}” (${fmt(cell(g, r, c2)[1], g.unit)})`].filter(Boolean).join(', and ');
    mine = `Your outcome isn't a Nash equilibrium: ${why}.`;
  }
  return nashBox(intro, body + `<p class="nash-yours">${mine}</p>`);
}

const nashBox = (intro, body) => `<div class="nash-box"><h3>⭐ Nash equilibrium</h3><p class="nash-intro">${intro}</p>${body}</div>`;

// One plain sentence describing the outcome with the highest combined payoff.
function bestForBoth(g, hit) {
  const j = bestJoint(g)[0], C = g.cols.length, [y, t] = g.pay[j];
  const desc = `you pick <b>${esc(g.rows[Math.floor(j / C)])}</b> and ${esc(g.them)} picks <b>${esc(g.cols[j % C])}</b>, giving you ${fmt(y, g.unit)} and them ${fmt(t, g.unit)}`;
  return `<p class="best-both">🤝 <b>Best combined outcome:</b> ${desc}.${bestJoint(g).includes(hit) ? ' You got there.' : ''}</p>`;
}

// ----- Ultimatum -----
function ultimatumBody(g) {
  return `<div class="pot"><span class="pot-label">On the table</span><span class="pot-value">${fmt(g.pot, g.unit)}</span></div>
  <div class="slider-card">
    <label for="keep" class="hint">How much do you keep? <b>${esc(g.them)}</b> gets the rest and can say no.</label>
    <input type="range" id="keep" min="${ULT_STEPS[0]}" max="${ULT_STEPS.at(-1)}" step="5" value="50">
    <div class="split" aria-hidden="true"><span class="split-you" id="split-you"></span><span class="split-them" id="split-them"></span></div>
    <div class="split-labels"><span>You <b id="keep-you"></b></span><span>${esc(g.them)} <b id="keep-them"></b></span></div>
    <button class="btn btn-primary btn-lg wide" data-action="offer">Make the offer</button>
  </div>`;
}

function bindSlider(g) {
  const s = $('#keep');
  const upd = () => {
    const k = +s.value, you = Math.round(g.pot * k / 100);
    $('#keep-you').textContent = `${fmt(you, g.unit)} (${k}%)`;
    $('#keep-them').textContent = `${fmt(g.pot - you, g.unit)} (${100 - k}%)`;
    $('#split-you').style.width = k + '%';
    $('#split-them').style.width = (100 - k) + '%';
  };
  s.addEventListener('input', upd);
  upd();
}

async function makeOffer() {
  const g = live.g;
  if (live.done || live.busy) return;
  live.busy = true;
  const k = +$('#keep').value;
  $('#keep').disabled = true;
  document.querySelector('[data-action="offer"]').disabled = true;
  await think();
  const o = ultimatumOutcome(g, k), gr = gradeUltimatum(g, k);
  $('#bubble').textContent = o.accepted ? 'Deal ✅' : 'No deal ❌';
  $('#bubble').classList.add('show');
  await wait(450);
  record(g, { letter: gr.letter, coop: null });
  const bestYou = Math.round(g.pot * gr.bestKeep / 100);
  resultPanel(g, gr.letter, o.you,
    o.accepted ? `Accepted. They got ${fmt(o.them, g.unit)}.` : `Rejected. ${o.you ? `You each end up with ${fmt(o.you, g.unit)} after the fallout.` : 'You walk away with nothing.'}`,
    gr.letter === 'A' ? 'That was the best possible offer.' : `The best offer was to keep ${gr.bestKeep}%: ${fmt(bestYou, g.unit)}.`,
    `<span class="badge">${o.accepted ? '✅ Accepted' : '❌ Rejected'}</span><span class="badge">Their minimum: ${g.threshold}%</span>`,
    nashUltimatum(g, gr.bestKeep));
}

function nashUltimatum(g, bestKeep) {
  const fallback = g.rejectPay[1];
  const k = [...ULT_STEPS].reverse().find(k => g.pot - Math.round(g.pot * k / 100) > fallback);
  const theirs = g.pot - Math.round(g.pot * k / 100);
  return nashBox('A Nash equilibrium is a pair of moves where neither side can do better by changing only its own move.',
    `<p>If ${esc(g.them)} only cared about money, they would accept anything above the ${fmt(fallback, g.unit)} they get by saying no. The prediction is that you keep ${k}% and they accept ${fmt(theirs, g.unit)}.</p>
     <p class="nash-yours">In experiments, people reject offers that feel unfair. ${esc(g.them)} needed at least ${g.threshold}%, so in practice your best move was to keep ${bestKeep}%.</p>`);
}

// ----- Centipede -----
function centipedeBody(g) {
  return `<p class="hint">Take ${Math.round(g.takeShare * 100)}% of the pot now, or pass and it doubles for ${esc(g.them)}'s turn.</p>
    <div class="track" id="track"></div>
    <div class="cent-actions" id="cent-actions"></div>`;
}

function drawCentipede(g, ended = null) {
  const nodes = centNodes(g), cur = live.node;
  $('#track').innerHTML = nodes.map((n, i) => `
    <div class="node ${n.mover} ${i < cur ? 'passed' : ''} ${i === cur && !ended ? 'current' : ''} ${ended && i === ended.at ? 'taken' : ''}">
      <span class="node-who">${n.mover === 'you' ? '🙂' : '🤖'}</span>
      <span class="node-pot">${fmt(n.pot, g.unit)}</span>
    </div>`).join('<span class="link" aria-hidden="true"></span>');
  $('#track .current, #track .taken')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  const n = nodes[cur], acts = $('#cent-actions');
  if (ended) { acts.innerHTML = ''; return; }
  if (n.mover === 'you') {
    const nextPot = nodes[cur + 1]?.pot;
    acts.innerHTML = `<button class="btn btn-primary btn-lg" data-action="take">💰 Take ${fmt(n.you, g.unit)} <kbd>T</kbd></button>
      ${nextPot ? `<button class="btn btn-lg" data-action="pass">⏭ Pass: pot grows to ${fmt(nextPot, g.unit)} <kbd>P</kbd></button>` : ''}`;
  } else acts.innerHTML = `<p class="hint">${esc(g.them)} is deciding…</p>`;
}

async function centMove(take) {
  const g = live.g;
  if (live.done || live.busy) return;
  live.busy = true;
  const nodes = centNodes(g);
  if (take) return centEnd(g, live.node, 'you');
  live.node++;
  drawCentipede(g);
  await think(900);
  if (centOpponentTakes(g, live.node)) {
    $('#bubble').textContent = 'Taking it! 💰';
    $('#bubble').classList.add('show');
    return centEnd(g, live.node, 'them');
  }
  $('#bubble').textContent = 'Pass ⏭';
  $('#bubble').classList.add('show');
  live.node++;
  if (live.node >= nodes.length) return centEnd(g, nodes.length - 1, 'them');
  live.busy = false;
  drawCentipede(g);
}

async function centEnd(g, at, who) {
  const n = centNodes(g)[at];
  drawCentipede(g, { at });
  await wait(300);
  const gr = gradeCentipede(g, n.you);
  record(g, { letter: gr.letter, coop: null });
  resultPanel(g, gr.letter, n.you,
    `${who === 'you' ? 'You took' : `${esc(g.them)} took`} the pot at ${fmt(n.pot, g.unit)}. They got ${fmt(n.them, g.unit)}.`,
    gr.letter === 'A' ? 'Perfect timing: you took just before they would have.' : `Best possible for you: ${fmt(gr.bestValue, g.unit)}, taking just before ${esc(g.them)} would.`,
    '', nashBox('A Nash equilibrium is a pair of moves where neither side can do better by changing only its own move.',
      `<p>Here it means taking on your very first turn, for ${fmt(centNodes(g)[0].you, g.unit)}. On the last turn, the player moving takes. Knowing that, the player before takes one turn earlier, and the same reasoning runs back to the start.</p>
       <p class="nash-yours">${esc(g.them)} kept passing until their last turn, so the longer you waited before then, the more you earned. Most people in experiments pass several times too.</p>`));
}

// ----- Shared bits -----
async function think(ms = 800) {
  const b = $('#bubble');
  b.textContent = 'thinking…';
  b.classList.add('show', 'thinking');
  await wait(ms);
  b.classList.remove('thinking');
}

function resultPanel(g, letter, you, sub, better, badges, extra = '') {
  live.done = true;
  $('#result').innerHTML = `
  <div class="result">
    <div class="result-main">
      <div class="stamp ${gradeClass(letter)}" aria-label="Grade ${letter}">${letter}</div>
      <div>
        <p class="result-label">Your ${esc(g.unit.label)}</p>
        <p class="result-value" id="result-value" style="${g.type === 'matrix' ? tone(g, you, 0) : ''}">${fmt(0, g.unit)}</p>
        <p class="result-sub">${sub}</p>
      </div>
    </div>
    <p class="better">${better}</p>
    ${badges ? `<div class="badges">${badges}</div>` : ''}
    ${extra}
    <p class="takeaway">💡 ${esc(g.takeaway)}</p>
    ${g.why ? `<details><summary>Why?</summary><p>${esc(g.why)}</p></details>` : ''}
    <button class="btn btn-primary btn-lg wide" data-action="next" id="next-btn">${store.run.idx + 1 >= store.run.ids.length ? 'See your results 🏁' : 'Next game →'} <kbd>Enter</kbd></button>
  </div>`;
  document.querySelector('.game-actions')?.remove();
  countUp($('#result-value'), you, g.unit);
  if (letter === 'A') confetti();
  $('#next-btn').focus({ preventScroll: true });
  $('#result').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
}

// ============ Summary ============
const PROFILES = {
  'Strategic Cooperator': 'You made smart moves and still cooperated when it paid off for both sides, which is how good negotiators play.',
  'Sharp Strategist': 'You almost always picked the best reply to the other side, even when cooperating would have helped you both more.',
  'Hopeful Idealist': 'You kept choosing to cooperate. That builds trust over time, but in one-off games the other side often took advantage.',
  'Wildcard': 'Your moves were hard to predict, and they cost you more often than they paid off.',
  'Adaptive Player': 'You changed your approach from game to game, which is what most people do in real negotiations.',
};
function profileFor(score, coop) {
  if (coop === null) return score >= 80 ? 'Sharp Strategist' : score < 55 ? 'Wildcard' : 'Adaptive Player';
  if (score >= 80) return coop >= 0.5 ? 'Strategic Cooperator' : 'Sharp Strategist';
  if (score < 55) return coop >= 0.5 ? 'Hopeful Idealist' : 'Wildcard';
  return 'Adaptive Player';
}

function renderSummary() {
  live = null;
  const run = store.run;
  const rs = run?.results || [];
  if (!rs.length) { store.run = null; save(); return renderHome(); }
  const avg = rs.reduce((t, r) => t + GRADE_SCORE[r.letter], 0) / rs.length;
  const letter = letterFromScore(avg);
  const coopRs = rs.filter(r => r.coop !== null);
  const coop = coopRs.length ? coopRs.filter(r => r.coop).length / coopRs.length : null;
  const profile = profileFor(avg, coop);
  const aCount = rs.filter(r => r.letter === 'A').length;
  show(`
  <section class="summary">
    <p class="eyebrow">${esc(run.label)} complete</p>
    <div class="stamp big ${gradeClass(letter)}">${letter}</div>
    <h1>${profile}</h1>
    <p class="lede">${PROFILES[profile]}</p>
    <div class="tiles">
      <div class="tile"><b>${rs.length}</b><span>games played</span></div>
      <div class="tile"><b>${aCount}</b><span>perfect moves</span></div>
      <div class="tile"><b>${coop === null ? 'n/a' : Math.round(coop * 100) + '%'}</b><span>cooperation</span></div>
    </div>
    <ol class="recap">${rs.map(r => { const g = GAME_BY_ID[r.id];
      return `<li><button data-action="replay" data-id="${r.id}"><span aria-hidden="true">${g.emoji}</span> ${esc(g.title)}<span class="mini ${gradeClass(r.letter)}">${r.letter}</span></button></li>`; }).join('')}</ol>
    <div class="hero-cta">
      <button class="btn btn-primary btn-lg" data-action="quick">🎲 Play another 10</button>
      <button class="btn btn-lg" data-action="home">Home</button>
    </div>
  </section>`);
  if (letter === 'A') confetti();
  store.run = null;
  save();
}

// ============ Browse sheet ============
function openSheet() {
  $('#sheet').classList.add('open');
  $('#sheet').setAttribute('aria-hidden', 'false');
  $('#sheet-backdrop').hidden = false;
  renderSheet();
  setTimeout(() => $('#search').focus(), 50);
}
function closeSheet() {
  $('#sheet').classList.remove('open');
  $('#sheet').setAttribute('aria-hidden', 'true');
  $('#sheet-backdrop').hidden = true;
}
function renderSheet() {
  const q = $('#search').value.trim().toLowerCase();
  const match = g => !q || (g.title + ' ' + g.tag + ' ' + g.setup).toLowerCase().includes(q);
  $('#sheet-list').innerHTML = CATEGORIES.map(c => {
    const gs = c.games.filter(match);
    if (!gs.length) return '';
    return `<h3 class="sheet-cat">${c.emoji} ${esc(c.name)}</h3>` + gs.map(g => {
      const r = store.results[g.id];
      return `<button class="sheet-item" data-action="play-id" data-id="${g.id}">
        <span class="sheet-emoji" aria-hidden="true">${g.emoji}</span>
        <span class="sheet-text"><b>${esc(g.title)}</b><small>${esc(g.tag)}</small></span>
        ${r ? `<span class="mini ${gradeClass(r.letter)}">${r.letter}</span>` : ''}
      </button>`;
    }).join('');
  }).join('') || '<p class="hint">No games match.</p>';
}

// ============ Events ============
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  if (a === 'home') renderHome();
  else if (a === 'quick') quickPlay();
  else if (a === 'resume') playCurrent();
  else if (a === 'cat') playCategory(el.dataset.key);
  else if (a === 'browse') openSheet();
  else if (a === 'close-sheet') closeSheet();
  else if (a === 'play-id' || a === 'replay') { closeSheet(); playFrom(el.dataset.id); }
  else if (a === 'choose') chooseMatrix(+el.dataset.r);
  else if (a === 'offer') makeOffer();
  else if (a === 'take') centMove(true);
  else if (a === 'pass') centMove(false);
  else if (a === 'next' || a === 'skip') next();
});
$('#sheet-backdrop').addEventListener('click', closeSheet);
$('#search').addEventListener('input', renderSheet);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeSheet();
  if ($('#sheet').classList.contains('open') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.matches('input[type=search]')) return;
  if (!live) return;
  const g = live.g;
  if (live.done) { if (e.key === 'Enter') { e.preventDefault(); next(); } return; }
  if (g.type === 'matrix' && /^[1-9]$/.test(e.key) && +e.key <= g.rows.length) chooseMatrix(+e.key - 1);
  else if (g.type === 'centipede' && !live.busy) {
    if (e.key.toLowerCase() === 't') centMove(true);
    if (e.key.toLowerCase() === 'p' && document.querySelector('[data-action="pass"]')) centMove(false);
  }
});

renderHome();
