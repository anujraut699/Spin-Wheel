/* ══════════════════════════════════════════════
   SPIN WHEEL STUDIO — JS
   B&W + Yellow glow  ·  Full-page spin screen
   Win = name only, no labels
══════════════════════════════════════════════ */

// Alternating dark + yellow-tint palette for rim accents
const PAL = [
  '#f5c53a','#ffffff','#c49a00','#d4d4d4','#e6b800',
  '#aaaaaa','#ffe878','#777777','#ffd000','#bbbbbb',
  '#f0a500','#555555','#ffecaa','#444444','#ffc107',
  '#888888','#ffdb4d','#333333','#e6c000','#666666'
];

const G = {
  mode: null, pctSub: null, heading: '', count: 6,
  entries: [], eliminated: new Set(),
  angle: 0, spinning: false,
};

const STEPS = 4;

/* ── Progress dots ── */
function renderDots(id, cur) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 1; i <= STEPS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < cur ? ' done' : i === cur ? ' active' : '');
    el.appendChild(d);
  }
}

/* ── Navigate ── */
function goStep(n) {
  if (n === 4) { G.count = parseInt(document.getElementById('count-display').textContent); buildNamesGrid(); }
  if (n === 5) { launchWheel(); return; }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = document.getElementById(`step-${n}`);
  if (t) { t.classList.add('active'); t.scrollTop = 0; }
  renderDots(`dots-${n}`, n);
  if (n === 2) setTimeout(() => document.getElementById('heading-input')?.focus(), 80);
}

/* ── Step 1 ── */
function selectMode(m) {
  G.mode   = m;
  G.pctSub = null;
  document.getElementById('mode-regular').classList.toggle('selected', m === 'regular');
  document.getElementById('mode-elim').classList.toggle('selected', m === 'elim');
  document.getElementById('mode-pct').classList.toggle('selected', m === 'pct');

  // Show/hide pct sub-mode panel
  const sub = document.getElementById('pct-submode');
  sub.style.display = m === 'pct' ? 'block' : 'none';
  document.getElementById('sub-regular').classList.remove('selected');
  document.getElementById('sub-elim').classList.remove('selected');

  // NEXT is enabled for regular/elim immediately; for pct need sub-mode chosen too
  document.getElementById('btn-1-next').disabled = m === 'pct';
}

function selectSubMode(s) {
  G.pctSub = s;
  document.getElementById('sub-regular').classList.toggle('selected', s === 'regular');
  document.getElementById('sub-elim').classList.toggle('selected', s === 'elim');
  document.getElementById('btn-1-next').disabled = false;
}

/* ── Step 2 ── */
function validateStep2() {
  document.getElementById('btn-2-next').disabled =
    !document.getElementById('heading-input').value.trim();
}
document.getElementById('heading-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('heading-input').value.trim()) goStep(3);
});

/* ── Step 3 ── */
function changeCount(d) {
  G.count = Math.min(20, Math.max(2, G.count + d));
  document.getElementById('count-display').textContent = G.count;
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('step-3').classList.contains('active')) return;
  if (e.key === 'ArrowUp'   || e.key === '+') changeCount(1);
  if (e.key === 'ArrowDown' || e.key === '-') changeCount(-1);
});

/* ── Step 4 ── */
function buildNamesGrid() {
  G.entries = Array.from({ length: G.count }, (_, i) => ({ name: '', color: PAL[i % PAL.length], pct: 0 }));
  const grid    = document.getElementById('names-grid');
  const isPct   = G.mode === 'pct';
  grid.innerHTML = '';
  document.getElementById('names-badge').textContent = `0 / ${G.count}`;
  document.getElementById('names-desc').textContent  = isPct
    ? `Name each slice and set its % chance. All percentages must add up to 100%.`
    : `Enter a label for each of the ${G.count} slices. Blanks get auto-names.`;

  // Show / hide pct total bar
  document.getElementById('pct-total-bar').style.display = isPct ? 'flex' : 'none';
  document.getElementById('btn-launch').disabled = isPct; // disabled until total = 100

  G.entries.forEach((e, i) => {
    const row = document.createElement('div');
    row.className = isPct ? 'pct-row' : 'name-row';
    if (isPct) {
      row.innerHTML = `
        <span class="name-num">${i + 1}</span>
        <span class="name-swatch" style="background:${e.color};border:1px solid rgba(255,255,255,.15)"></span>
        <input class="name-input" placeholder="Entry ${i + 1}" maxlength="28"
          oninput="updateEntry(${i}, this.value)"
          style="border-left:2px solid ${e.color}44"/>
        <input class="pct-input" type="number" min="1" max="99" placeholder="0"
          oninput="updatePct(${i}, this.value)"/>
        <span class="pct-symbol">%</span>
      `;
    } else {
      row.innerHTML = `
        <span class="name-num">${i + 1}</span>
        <span class="name-swatch" style="background:${e.color};border:1px solid rgba(255,255,255,.15)"></span>
        <input class="name-input" placeholder="Entry ${i + 1}" maxlength="28"
          oninput="updateEntry(${i}, this.value)"
          style="border-left:2px solid ${e.color}44"/>
      `;
    }
    grid.appendChild(row);
  });
  updateFill();
}

function updateEntry(i, v) { G.entries[i].name = v.trim(); updateFill(); }

function updatePct(i, v) {
  const val = Math.max(0, Math.min(99, parseInt(v) || 0));
  G.entries[i].pct = val;
  updateFill();
}

function updateFill() {
  const f   = G.entries.filter(e => e.name).length;
  const t   = G.entries.length;
  const isPct = G.mode === 'pct';
  document.getElementById('names-badge').textContent = `${f} / ${t}`;

  if (isPct) {
    const total = G.entries.reduce((s, e) => s + (e.pct || 0), 0);
    const pct   = Math.min(total, 100);
    const fill  = document.getElementById('pct-bar-fill');
    const lbl   = document.getElementById('pct-total-label');
    fill.style.width = pct + '%';
    fill.classList.toggle('over', total > 100);
    lbl.textContent  = total + '%';
    lbl.className    = 'pct-total-label ' + (total === 100 ? 'ok' : total > 100 ? 'over' : 'under');

    const allNamed = f === t;
    const valid    = total === 100 && allNamed;
    document.getElementById('btn-launch').disabled = !valid;
    document.getElementById('fill-count').textContent =
      total > 100  ? `⚠ Over by ${total - 100}% — reduce some values` :
      total === 100 && !allNamed ? 'Name all entries to continue' :
      total === 100 ? '✓ Ready!' :
      `${100 - total}% remaining to assign`;
  } else {
    document.getElementById('fill-count').textContent =
      f === 0 ? 'Blank fields will be auto-named' :
      f === t ? '✓ All names set' : `${t - f} still empty`;
  }
}

/* ════════════════════════════════════
   LAUNCH — transition to spin screen
════════════════════════════════════ */
function launchWheel() {
  G.heading    = document.getElementById('heading-input').value.trim();
  G.eliminated = new Set();
  G.angle      = 0;
  G.entries    = G.entries.map((e, i) => ({
    name:  e.name || `Entry ${i + 1}`,
    color: e.color,
    pct:   e.pct || 0
  }));

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-spin').classList.add('active');

  document.getElementById('spin-title').textContent = G.heading;

  // Pill label: pct shows sub-mode too
  const pill = document.getElementById('spin-pill');
  const isElimStyle = G.mode === 'elim' || (G.mode === 'pct' && G.pctSub === 'elim');
  if (G.mode === 'pct') {
    pill.textContent = G.pctSub === 'elim' ? '📊⚡ PCT · ELIM' : '📊🌀 PCT · REGULAR';
    pill.className   = 'spin-pill ' + (G.pctSub === 'elim' ? 'pill-elim' : 'pill-pct');
  } else {
    const pillMap = { regular:'🌀 REGULAR', elim:'⚡ ELIMINATION' };
    const clsMap  = { regular:'pill-regular', elim:'pill-elim' };
    pill.textContent = pillMap[G.mode] || '🌀 REGULAR';
    pill.className   = 'spin-pill ' + (clsMap[G.mode] || 'pill-regular');
  }

  const elimTray  = document.getElementById('elim-tray');
  const resetCtrl = document.getElementById('btn-reset-ctrl');
  elimTray.classList.toggle('visible', isElimStyle);
  resetCtrl.style.display = isElimStyle ? 'inline-block' : 'none';

  const rs = document.getElementById('result-strip');
  rs.textContent = ''; rs.classList.remove('show');
  document.getElementById('btn-spin-go').disabled = false;
  document.getElementById('spin-hub').classList.remove('busy');

  requestAnimationFrame(() => {
    resizeCanvas(); drawWheel();
    if (isElimStyle) renderElimList();
  });
}

/* ════════════════════
   CANVAS & DRAWING
════════════════════ */
function resizeCanvas() {
  const stage  = document.getElementById('wheel-stage');
  const canvas = document.getElementById('spin-canvas');
  const sz     = stage.offsetWidth;
  canvas.width  = sz;
  canvas.height = sz;
}

window.addEventListener('resize', () => {
  if (document.getElementById('screen-spin').classList.contains('active')) {
    resizeCanvas(); drawWheel();
  }
});

function getActive() {
  return G.entries.filter(e => !G.eliminated.has(e.name));
}

function drawWheel() {
  const canvas = document.getElementById('spin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const CX  = canvas.width / 2, CY = canvas.height / 2, R = CX - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const active = getActive();
  if (!active.length) {
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.strokeStyle = 'rgba(245,197,58,.2)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = `700 ${Math.max(12, R * 0.05)}px DM Sans,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No entries left', CX, CY);
    ctx.restore();
    return;
  }

  // Build segments — pct mode uses weighted angles, others equal
  const isPct = G.mode === 'pct';
  const totalPct = isPct ? active.reduce((s, e) => s + (e.pct || 0), 0) : active.length;
  let cursor = G.angle - Math.PI / 2;

  active.forEach((entry, i) => {
    const weight = isPct ? (entry.pct || 0) / totalPct : 1 / active.length;
    const span   = weight * Math.PI * 2;
    const start  = cursor;
    const end    = cursor + span;
    const mid    = start + span / 2;
    cursor       = end;

    // Segment fill
    ctx.save();
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, R, start, end); ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#0d0d0d' : '#171717';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,197,58,.15)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Rim colour strip
    ctx.save();
    ctx.beginPath(); ctx.arc(CX, CY, R - 2, start + 0.03, end - 0.03);
    ctx.strokeStyle = entry.color; ctx.lineWidth = R * 0.055; ctx.stroke();
    ctx.restore();

    // Label (name + % in pct mode)
    const lr    = R * (active.length <= 3 ? 0.50 : active.length <= 6 ? 0.57 : active.length <= 10 ? 0.62 : 0.66);
    const lx    = CX + Math.cos(mid) * lr;
    const ly    = CY + Math.sin(mid) * lr;
    const maxC  = active.length <= 4 ? 14 : active.length <= 8 ? 10 : active.length <= 14 ? 7 : 5;
    const label = entry.name.length > maxC ? entry.name.slice(0, maxC - 1) + '…' : entry.name;
    const fs    = Math.max(9, Math.min(18, R * 1.0 / active.length));

    ctx.save();
    ctx.translate(lx, ly); ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4;
    ctx.fillStyle = '#fff';

    if (isPct && span > 0.18) {
      // Show name on top line, % on bottom line
      ctx.font = `700 ${fs}px DM Sans,sans-serif`;
      ctx.fillText(label, 0, -fs * 0.6);
      ctx.font = `600 ${Math.max(8, fs * 0.78)}px DM Sans,sans-serif`;
      ctx.fillStyle = entry.color;
      ctx.fillText(`${entry.pct}%`, 0, fs * 0.7);
    } else {
      ctx.font = `700 ${fs}px DM Sans,sans-serif`;
      ctx.fillText(label, 0, 0);
    }
    ctx.restore();
  });

  // Hub
  const hR = Math.max(26, R * 0.13);
  ctx.beginPath(); ctx.arc(CX, CY, hR, 0, Math.PI * 2);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.strokeStyle = 'rgba(245,197,58,.4)'; ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(245,197,58,.5)'; ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(CX, CY, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,197,58,.7)'; ctx.fill();
}

/* ═══════════════
   SPIN ANIMATION
═══════════════ */

// Weighted random for pct mode, uniform otherwise
function pickWinner(active) {
  if (G.mode === 'pct') {
    const total = active.reduce((s, e) => s + (e.pct || 0), 0);
    let r = Math.random() * total;
    for (let i = 0; i < active.length; i++) {
      r -= (active[i].pct || 0);
      if (r <= 0) return i;
    }
    return active.length - 1;
  }
  return Math.floor(Math.random() * active.length);
}

// Get the arc start angle and span for a given segment index
function segInfo(active, idx) {
  const isPct = G.mode === 'pct';
  const total = isPct ? active.reduce((s, e) => s + (e.pct || 0), 0) : active.length;
  let offset = 0;
  for (let i = 0; i < idx; i++)
    offset += isPct ? (active[i].pct || 0) / total : 1 / active.length;
  const weight = isPct ? (active[idx].pct || 0) / total : 1 / active.length;
  return { start: offset * Math.PI * 2, span: weight * Math.PI * 2 };
}

function triggerSpin() {
  if (G.spinning) return;
  const active = getActive();
  if (active.length < 2) {
    if (active.length === 1) toast(`${active[0].name} is the last one!`);
    else toast('No entries to spin!');
    return;
  }

  const winIdx = pickWinner(active);
  const winner = active[winIdx];
  G.spinning   = true;

  const hub = document.getElementById('spin-hub');
  const ptr = document.getElementById('spin-ptr');
  hub.classList.add('busy'); hub.textContent = '·';
  ptr.classList.remove('bouncing');
  document.getElementById('btn-spin-go').disabled = true;

  const rs = document.getElementById('result-strip');
  rs.classList.remove('show'); rs.textContent = '';

  const { start: segStart, span: segSpan } = segInfo(active, winIdx);
  const wCenter = segStart + segSpan / 2;
  const extra   = (6 + Math.floor(Math.random() * 5)) * Math.PI * 2;
  const curMod  = ((G.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let needed    = ((-wCenter - curMod) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  if (needed < 0.5) needed += Math.PI * 2;

  const target = G.angle + extra + needed;
  const dur    = 3600 + Math.random() * 1400;
  const t0     = performance.now(), a0 = G.angle;
  const ease   = t => 1 - Math.pow(1 - t, 4.7);

  function frame(now) {
    const t = Math.min((now - t0) / dur, 1);
    G.angle = a0 + (target - a0) * ease(t);
    drawWheel();
    if (t < 1) { requestAnimationFrame(frame); return; }
    G.angle = target; G.spinning = false;
    hub.textContent = 'SPIN'; hub.classList.remove('busy');
    ptr.classList.add('bouncing');
    document.getElementById('btn-spin-go').disabled = false;
    onResult(winner);
  }
  requestAnimationFrame(frame);
}

/* ═══════════════
   RESULT HANDLING
═══════════════ */
function onResult(winner) {
  const name = winner.name;
  const rs   = document.getElementById('result-strip');
  rs.textContent = name;
  rs.classList.add('show');

  const isElimStyle = G.mode === 'elim' || (G.mode === 'pct' && G.pctSub === 'elim');

  if (!isElimStyle) {
    // Regular or pct-regular: just show winner, keep spinning
    showWin(name, true);
  } else {
    // Elimination style (plain elim or pct+elim)
    G.eliminated.add(name);
    const remaining = getActive();
    setTimeout(() => {
      drawWheel(); renderElimList();
      if (remaining.length === 1) {
        const last = remaining[0];
        rs.textContent = last.name;
        setTimeout(() => {
          document.getElementById('btn-spin-go').disabled = true;
          showWin(last.name, true);
        }, 500);
      } else if (remaining.length === 0) {
        showWin('Done!', false);
      } else {
        showWin(name, false);
      }
    }, 350);
  }
}

/* ═══════════════
   WIN OVERLAY
═══════════════ */
function showWin(name, confetti) {
  document.getElementById('win-name').textContent = name;
  document.getElementById('win-overlay').classList.add('show');
  if (confetti) fireConfetti();
}
function closeWin() {
  document.getElementById('win-overlay').classList.remove('show');
}
function fireConfetti() {
  const colors = ['#f5c53a', '#ffe878', '#fff', '#c49a00', '#e6b800', '#d4d4d4', '#000'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'cf';
    const s = 5 + Math.random() * 9;
    el.style.cssText = `
      left:${Math.random() * 100}vw;top:${-10 + Math.random() * 14}px;
      width:${s}px;height:${s}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > .5 ? '50%' : '2px'};
      animation-duration:${2 + Math.random() * 2.5}s;
      animation-delay:${Math.random() * .45}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }
}

/* ═══════════════
   ELIM LIST
═══════════════ */
function renderElimList() {
  const scroll = document.getElementById('elim-scroll');
  scroll.innerHTML = '';
  G.entries.forEach((e, i) => {
    const isOut = G.eliminated.has(e.name);
    const d = document.createElement('div');
    d.className = 'elim-entry ' + (isOut ? 'out' : 'in');
    d.innerHTML = `
      <span class="elim-n">${i + 1}</span>
      <span class="elim-dot" style="background:${isOut ? 'rgba(255,255,255,.08)' : e.color}"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.name)}</span>
    `;
    scroll.appendChild(d);
  });
}

function resetElim() {
  G.eliminated.clear(); G.angle = 0;
  resizeCanvas(); drawWheel(); renderElimList();
  const rs = document.getElementById('result-strip');
  rs.textContent = ''; rs.classList.remove('show');
  document.getElementById('btn-spin-go').disabled = false;
  toast('Reset!');
}

/* ═══════════════
   NEW WHEEL
═══════════════ */
function newWheel() {
  G.mode = null; G.pctSub = null; G.heading = ''; G.count = 6;
  G.entries = []; G.eliminated = new Set(); G.angle = 0; G.spinning = false;
  ['mode-regular','mode-elim','mode-pct','sub-regular','sub-elim']
    .forEach(id => document.getElementById(id).classList.remove('selected'));
  document.getElementById('pct-submode').style.display = 'none';
  document.getElementById('btn-1-next').disabled = true;
  document.getElementById('heading-input').value = '';
  document.getElementById('btn-2-next').disabled = true;
  document.getElementById('count-display').textContent = '6';
  goStep(1);
}

/* ═══════════════
   UTILS
═══════════════ */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
let toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 2400);
}

// Init
renderDots('dots-1', 1);
