// ── CONFIG ──
const API_BASE = 'https://data-veil-api.onrender.com';

// ── DOM REFS ──
const $ = id => document.getElementById(id);
const inputText    = $('inputText');
const encryptBtn   = $('encryptBtn');
const btnLabel     = $('btnLabel');
const charCountEl  = $('charCount');
const outputPanel  = $('outputPanel');
const hexStream    = $('hexStream');
const hexMeta      = $('hexMeta');
const copyHexBtn   = $('copyHexBtn');
const resultsRow   = $('resultsRow');
const qrImg        = $('qrImg');
const dlQR         = $('dlQR');
const stepsZone    = $('stepsZone');
const stepsContainer = $('stepsContainer');
const expandAllBtn = $('expandAllBtn');
const statsGrid    = $('statsGrid');
const entropyVisual = $('entropyVisual');
const entropyScore  = $('entropyScore');
const statusPulse  = $('statusPulse');
const statusMsg    = $('statusMsg');
const statusTime   = $('statusTime');
const loadingOverlay = $('loadingOverlay');
const loaderStage  = $('loaderStage');
const loaderDetail = $('loaderDetail');
const loaderBar    = $('loaderBar');
const toastEl      = $('toast');
const navbar       = $('navbar');
const tickerText   = $('tickerText');
const mobileMenu   = $('mobileMenu');

// ── CURSOR ──
const cursorDot  = $('cursorDot');
const cursorRing = $('cursorRing');
let mouseX = -100, mouseY = -100;
let ringX = -100, ringY = -100;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

(function animateCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateCursor);
})();

// ── CANVAS BACKGROUND ──
const canvas = $('bgCanvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function makeP() {
  return {
    x: Math.random() * W,
    y: H + 20,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(Math.random() * 0.55 + 0.18),
    life: 1,
    decay: Math.random() * 0.002 + 0.001,
    ch: '0123456789ABCDEF'[Math.floor(Math.random() * 16)],
    size: Math.random() < 0.2 ? 11 : 9,
    alpha: Math.random() * 0.28 + 0.06
  };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 65; i++) {
    const p = makeP();
    p.y = Math.random() * H;
    particles.push(p);
  }
}

let gridOffset = 0;
function drawCanvas() {
  ctx.clearRect(0, 0, W, H);

  // Moving grid
  ctx.strokeStyle = 'rgba(0,229,255,0.022)';
  ctx.lineWidth = 1;
  const gs = 70;
  gridOffset = (gridOffset + 0.18) % gs;
  for (let x = -gs + gridOffset; x < W + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -gs + gridOffset; y < H + gs; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Spotlight under cursor
  if (mouseX > 0) {
    const grd = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280);
    grd.addColorStop(0, 'rgba(0,229,255,0.028)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  // Particles
  ctx.font = `9px "JetBrains Mono", monospace`;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0 || p.y < -20) { particles[i] = makeP(); continue; }
    ctx.fillStyle = `rgba(0,255,138,${p.alpha * p.life})`;
    ctx.fillText(p.ch, p.x, p.y);
    if (Math.random() < 0.01) p.ch = '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
  }

  requestAnimationFrame(drawCanvas);
}

resize(); initParticles(); drawCanvas();
window.addEventListener('resize', () => { resize(); initParticles(); });

// ── NAVBAR ──
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', scrollY > 30);
  updateActiveNav();
}, { passive: true });

function updateActiveNav() {
  const sections = ['hero','encrypt','about','algorithm','architecture'];
  let cur = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && scrollY >= el.offsetTop - 120) cur = id;
  });
  document.querySelectorAll('.nav-link[data-section]').forEach(l => {
    l.classList.toggle('active', l.dataset.section === cur);
  });
}

function toggleMobileMenu() {
  mobileMenu.classList.toggle('open');
}
function scrollToEncrypt() {
  document.getElementById('encrypt').scrollIntoView({ behavior: 'smooth' });
}

// ── INTERSECTION OBSERVER ──
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));

// ── HERO TICKER ──
const hexChars = '0123456789ABCDEF';
function randomHexString(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += hexChars[Math.floor(Math.random() * 16)];
  return s;
}
let tickerInterval;
function startTicker() {
  tickerInterval = setInterval(() => {
    tickerText.textContent = randomHexString(36) + '...';
  }, 1800);
}
startTicker();

// ── STATUS ──
const idleMessages = [
  'CIPHER ENGINE READY — AWAITING INPUT',
  'ALL SYSTEMS NOMINAL · 16-STEP ALGORITHM LOADED',
  'SUPABASE CONNECTION ACTIVE · MAPPINGS CACHED',
  'TYPE A MESSAGE TO ENCRYPT'
];
let idleIdx = 0;
setInterval(() => {
  if (!statusPulse.classList.contains('working') && !statusPulse.classList.contains('error')) {
    idleIdx = (idleIdx + 1) % idleMessages.length;
    statusMsg.textContent = idleMessages[idleIdx];
  }
}, 4500);

function setStatus(msg, type = 'idle') {
  statusMsg.textContent = msg;
  statusPulse.className = 'status-pulse';
  if (type === 'error')   statusPulse.classList.add('error');
  if (type === 'working') statusPulse.classList.add('working');
  statusTime.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── CHAR COUNT ──
inputText.addEventListener('input', () => {
  charCountEl.textContent = inputText.value.length;
});

// ── LOADING ──
const loadingStages = [
  { stage: 'CONNECTING',    detail: 'Reaching cipher engine on Render...', pct: 15 },
  { stage: 'FETCHING KEYS', detail: 'Loading Supabase character mappings...', pct: 35 },
  { stage: 'PROCESSING',    detail: 'Running 16-step algorithm per character...', pct: 70 },
  { stage: 'FINALIZING',    detail: 'Generating hex output and QR code...', pct: 90 },
];
let loadInterval;

function showLoading() {
  loadingOverlay.style.display = 'flex';
  let s = 0;
  const update = () => {
    loaderStage.textContent  = loadingStages[s].stage;
    loaderDetail.textContent = loadingStages[s].detail;
    loaderBar.style.width    = loadingStages[s].pct + '%';
    s = (s + 1) % loadingStages.length;
  };
  update();
  loadInterval = setInterval(update, 1600);
}
function hideLoading() {
  clearInterval(loadInterval);
  loaderBar.style.width = '100%';
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 200);
}

// ── TOAST ──
function showToast(msg, type = 'info') {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ── HEX STREAM ANIMATION ──
function animateHexStream(hex) {
  hexStream.innerHTML = '';
  let i = 0;
  const chunk = 3;
  function next() {
    if (i >= hex.length) return;
    const end  = Math.min(i + chunk, hex.length);
    const span = document.createElement('span');
    span.className   = 'hex-char-new';
    span.textContent = hex.slice(i, end);
    hexStream.appendChild(span);
    i = end;
    setTimeout(next, 14);
  }
  next();
}

// ── ENTROPY RING ──
function renderEntropy(hex) {
  const unique  = new Set(hex.toUpperCase()).size;
  const pct     = Math.round(unique / 16 * 100);
  const angle   = pct / 100 * 283; // circumference ≈ 283
  entropyVisual.innerHTML = `
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,229,255,0.08)" stroke-width="6"/>
      <circle cx="50" cy="50" r="45" fill="none"
        stroke="url(#entGrad)" stroke-width="6"
        stroke-dasharray="${angle} 283"
        stroke-dashoffset="0"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        style="transition:stroke-dasharray 1s ease"/>
      <defs>
        <linearGradient id="entGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00e5ff"/>
          <stop offset="100%" stop-color="#39ff8a"/>
        </linearGradient>
      </defs>
      <text x="50" y="44" text-anchor="middle" fill="rgba(0,229,255,0.4)"
        font-family="JetBrains Mono" font-size="8">UNIQUE</text>
      <text x="50" y="58" text-anchor="middle" fill="#e8f4f8"
        font-family="Bebas Neue" font-size="20">${unique}/16</text>
    </svg>
  `;
  entropyScore.textContent = pct + '%';
}

// ── STATS ──
function renderStats(data) {
  const hex = data.encryptedHex;
  const n   = data.steps.length;
  statsGrid.innerHTML = '';
  const items = [
    { label: 'INPUT CHARS',  val: n },
    { label: 'HEX LENGTH',   val: hex.length.toLocaleString() },
    { label: 'HEX PER CHAR', val: Math.round(hex.length / n) },
    { label: 'UNIQUE HEX',   val: new Set(hex.toUpperCase()).size + '/16' },
  ];
  items.forEach((item, i) => {
    const d = document.createElement('div');
    d.className = 'stat-item';
    d.style.animationDelay = (i * 0.08) + 's';
    d.innerHTML = `<div class="stat-item-label">${item.label}</div><div class="stat-item-val">${item.val}</div>`;
    statsGrid.appendChild(d);
  });
}

// ── STEPS ──
function escH(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function tr(s, n) {
  const str = String(s == null ? '—' : s);
  return str.length > n ? str.slice(0, n) + '…' : str;
}

let allExpanded = false;

function renderSteps(steps) {
  stepsContainer.innerHTML = '';
  steps.forEach((s, idx) => {
    const dc = s.character === ' ' ? '·' : s.character === '\n' ? '↵' : s.character;
    const block = document.createElement('div');
    block.className = 'step-block';
    block.style.animationDelay = Math.min(idx * 0.03, 0.5) + 's';
    block.innerHTML = `
      <div class="step-header" onclick="toggleStepBlock(this)">
        <div class="step-badge">${escH(dc)}</div>
        <div class="step-info">
          <div class="step-char-name">CHARACTER #${idx+1} — <span style="color:var(--accent)">'${escH(dc)}'</span></div>
          <div class="step-char-code">CODE: ${escH(s.code)}</div>
        </div>
        <div class="step-hex-badge">${escH(s.step16.finalHex)}</div>
        <div class="step-toggle">▼</div>
      </div>
      <div class="step-details">
        <table class="step-table">
          <tr><td>STEP 2</td><td>
            <span class="vhi">First3:</span> ${escH(s.first3)} &nbsp;
            <span class="vhi">Mid2:</span> ${escH(s.next2)} &nbsp;
            <span class="vhi">Last4:</span> ${escH(s.last4)}
          </td></tr>
          <tr><td>STEP 3</td><td>
            a=${s.step3.a}, b=${s.step3.b}, c=${s.step3.c} →
            (a+b)=${s.step3.sum_ab} ×c=${s.step3.prod} sum=${s.step3.sum_abc}<br>
            mod1=${s.step3.mod1} mod2=${s.step3.mod2} →
            <span class="vhi">carry=${s.step3.carry}</span>
          </td></tr>
          <tr><td>STEP 4</td><td>
            ${s.step3.carry} × ${s.step4.midVal} = <span class="vhi">${s.step4.step4res}</span>
          </td></tr>
          <tr><td>STEP 5</td><td>
            Set1=[${s.step5.set1.join(', ')}] Set2=[${s.step5.set2.join(', ')}]<br>
            Diffs=[${s.step5.diffs.join(', ')}] → <span class="vhi">ScrambleSum=${s.step5.scrambleSum}</span>
          </td></tr>
          <tr><td>STEP 6</td><td>
            ${s.step5.scrambleSum} ÷ ${s.step4.step4res} = <span class="vhi">${s.step6.quotient}</span> (floor)
          </td></tr>
          <tr><td>STEP 7</td><td>
            base5(${s.step6.quotient})='${escH(s.step7.base5Str)}' → dec ${s.step7.base5AsDecimal} × ${s.first3} =
            <span class="vhi">${s.step7.product}</span>
          </td></tr>
          <tr><td>STEP 8</td><td>
            divisor1=<span class="vhi">${s.step8.divisor1}</span> divisor2=${s.step8.divisor2}<br>
            chain=[${s.step8.chainNumbers.join(', ')}] → sum=${s.step8.chainSum} →
            <span class="vhi">chainFinal=${s.step8.chainFinal}</span>
          </td></tr>
          <tr><td>STEP 9</td><td>
            weave(${s.step8.divisor1}, ${s.step8.chainFinal}, ${s.step8.div2_8}) =
            <span class="vhi">'${tr(s.step9.weaved,32)}'</span>
          </td></tr>
          <tr><td>STEP 10</td><td>
            →base5:'${tr(s.step10.base5_2,22)}' →base7:'${tr(s.step10.base7,22)}' →
            <span class="vhi">hex:'${escH(s.step10.hex)}'</span>
          </td></tr>
          <tr><td>STEP 11</td><td>
            sig=${escH(s.step11.sig)} →
            <span class="vhi">'${tr(s.step11.wrapped,30)}'</span>
          </td></tr>
          <tr><td>STEP 12</td><td>
            first4='${escH(s.step12.first4)}' ↔ last4='${escH(s.step12.last4part)}' →
            <span class="vhi">'${tr(s.step12.swapped,28)}'</span>
          </td></tr>
          <tr><td>STEP 13</td><td>hex→dec: ${tr(s.step13.base10,44)}</td></tr>
          <tr><td>STEP 14</td><td>→base4: ${tr(s.step14.base4,44)}</td></tr>
          <tr><td>STEP 15</td><td>→base9: ${tr(s.step15.base9,44)}</td></tr>
          <tr><td>STEP 16</td><td><span class="vfin">${escH(s.step16.finalHex)}</span></td></tr>
        </table>
      </div>`;
    stepsContainer.appendChild(block);
  });
}

function toggleStepBlock(header) {
  const details = header.nextElementSibling;
  const arrow   = header.querySelector('.step-toggle');
  details.classList.toggle('open');
  arrow.classList.toggle('open');
}

expandAllBtn.addEventListener('click', () => {
  allExpanded = !allExpanded;
  stepsContainer.querySelectorAll('.step-details').forEach(d => d.classList.toggle('open', allExpanded));
  stepsContainer.querySelectorAll('.step-toggle').forEach(t => t.classList.toggle('open', allExpanded));
  expandAllBtn.textContent = allExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL';
});

// ── BUTTON PARTICLES ──
function burstParticles() {
  const container = $('btnParticles');
  container.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const dot = document.createElement('div');
    const angle = (i / 14) * 360;
    const dist  = 40 + Math.random() * 30;
    dot.style.cssText = `
      position:absolute; width:4px; height:4px; border-radius:50%;
      background:${Math.random()>0.5?'#00e5ff':'#39ff8a'};
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      animation:particleBurst 0.6s ease-out ${i*0.03}s forwards;
      --dx:${Math.cos(angle*Math.PI/180)*dist}px;
      --dy:${Math.sin(angle*Math.PI/180)*dist}px;
    `;
    container.appendChild(dot);
  }
}

// Add keyframe dynamically
const style = document.createElement('style');
style.textContent = `@keyframes particleBurst{to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy)));opacity:0;}}`;
document.head.appendChild(style);

// ── ENCRYPT ──
async function encrypt() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('⚠ ENTER A MESSAGE FIRST', 'error');
    inputText.focus();
    inputText.style.borderColor = 'var(--accent3)';
    setTimeout(() => { inputText.style.borderColor = ''; }, 1500);
    return;
  }

  // Reset
  outputPanel.style.opacity = '0';
  outputPanel.style.pointerEvents = 'none';
  resultsRow.style.display  = 'none';
  stepsZone.style.display   = 'none';
  encryptBtn.disabled = true;
  btnLabel.textContent = 'ENCRYPTING…';
  setStatus('PROCESSING — RUNNING 16-STEP ALGORITHM', 'working');
  burstParticles();
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/api/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    hideLoading();

    // Show output panel
    outputPanel.style.pointerEvents = 'all';
    outputPanel.style.opacity = '1';
    animateHexStream(data.encryptedHex);
    hexMeta.textContent = `${data.encryptedHex.length} hex characters · ${data.steps.length} chars processed`;

    // QR + stats
    if (data.qrCodeDataUrl) {
      qrImg.src   = data.qrCodeDataUrl;
      dlQR.href   = data.qrCodeDataUrl;
      dlQR.style.display = 'inline-flex';
      resultsRow.style.display = 'grid';
      renderStats(data);
      renderEntropy(data.encryptedHex);
    }

    // Steps
    if (data.steps?.length) {
      stepsZone.style.display = 'block';
      renderSteps(data.steps);
      allExpanded = false;
      expandAllBtn.textContent = 'EXPAND ALL';
    }

    setStatus(`✓ COMPLETE — ${data.steps.length} CHAR(S) PROCESSED · ${data.encryptedHex.length} HEX CHARS`);
    clearInterval(tickerInterval);
    tickerText.textContent = data.encryptedHex.slice(0, 36) + '...';
    setTimeout(startTicker, 6000);

    setTimeout(() => {
      outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);

  } catch (err) {
    hideLoading();
    setStatus(`✗ ERROR: ${err.message.toUpperCase()}`, 'error');
    showToast('CONNECTION FAILED — CHECK NETWORK');
  } finally {
    encryptBtn.disabled = false;
    btnLabel.textContent = 'ENCRYPT & GENERATE QR';
  }
}

encryptBtn.addEventListener('click', encrypt);
inputText.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') encrypt();
});

copyHexBtn.addEventListener('click', () => {
  const hex = hexStream.textContent;
  if (!hex) return;
  navigator.clipboard.writeText(hex)
    .then(() => showToast('✓ HEX COPIED TO CLIPBOARD'))
    .catch(() => showToast('COPY FAILED — SELECT MANUALLY'));
});

// ── ALGORITHM STEPS DATA ──
const ALGO_STEPS = [
  {
    n: '01',
    title: 'Retrieve from Database',
    body: 'Look up the character in <code>encryptMap</code> loaded from Supabase at startup. Each printable ASCII character maps to a unique random 9-digit code containing only digits 1–9.',
    example: 'A → <span class="ex-v">517782813</span> &nbsp;|&nbsp; table_key = <span class="ex-v">9148</span>'
  },
  {
    n: '02',
    title: 'Split the 9-Digit Code',
    body: 'The code is divided into three segments that each drive a different part of the calculation pipeline.',
    example: '<span class="ex-l">First 3:</span> <span class="ex-v">517</span> &nbsp;|&nbsp; <span class="ex-l">Middle 2:</span> <span class="ex-v">78</span> &nbsp;|&nbsp; <span class="ex-l">Last 4:</span> <span class="ex-v">2813</span>'
  },
  {
    n: '03',
    title: 'Math on the First 3 Digits',
    body: 'Using digits a=5, b=1, c=7, a series of arithmetic and modulo operations produces a <strong>carry value</strong> that seeds the rest of the chain.',
    example: '(a+b)×c = 6×7 = 42 &nbsp;|&nbsp; a+b+c = 13<br>mod1 = 42%13 = 3 &nbsp;|&nbsp; mod2 = 13%42 = 13<br><span class="ex-l">Carry =</span> <span class="ex-v">3 + 13 = 16</span>'
  },
  {
    n: '04',
    title: 'Multiply with the Middle 2 Digits',
    body: 'The carry value is multiplied by the middle 2-digit integer to amplify the number into a useful range.',
    example: 'carry × midVal = 16 × 78 = <span class="ex-v">1248</span>'
  },
  {
    n: '05',
    title: 'Scramble the Last 4 Digits',
    body: 'Two rotation sets are generated from the last 4 digits. Set1 rotates left 3 times; Set2 rotates right 3 times. Pairwise absolute differences are summed into a <strong>scramble sum</strong>.',
    example: 'last4 = 2813<br>Set1 (left): [8132, 1328, 3281]<br>Set2 (right): [3281, 1328, 8132]<br><span class="ex-l">Scramble Sum =</span> <span class="ex-v">Σ |Set1ᵢ − Set2ᵢ|</span>'
  },
  {
    n: '06',
    title: 'Divide and Drop the Decimal',
    body: 'Scramble sum divided by the Step 4 result. Only the integer part is kept — the remainder is permanently discarded. <em>This is one of the lossy steps that makes reversal impossible.</em>',
    example: 'floor(scrambleSum ÷ step4result) = <span class="ex-v">quotient</span>'
  },
  {
    n: '07',
    title: 'Base-5 Conversion → Decimal → Multiply',
    body: 'The Step 6 quotient is converted to base-5 notation, then that base-5 string is reinterpreted as a plain decimal number and multiplied by the original first-3 integer.',
    example: 'base5(quotient) = <span class="ex-v">\'X\'</span> → treat as decimal → × <span class="ex-v">517</span> = <span class="ex-v">product</span>'
  },
  {
    n: '08',
    title: 'Chain of Calculations',
    body: 'A chain of modulo and division operations uses two divisors — one from the digit-sum of the base-5 string, one from the digit-sum of the last 4 digits. The chain numbers are summed then multiplied to produce <strong>chainFinal</strong>.',
    example: 'digitSum(base5Str) → divisor1 &nbsp;|&nbsp; last4Sum → divisor2<br>chainNums = [divisor1, mod1, mod2, mod3]<br>chainFinal = sum × divisor1 = <span class="ex-v">chainFinal</span>'
  },
  {
    n: '09',
    title: 'Weave Two Numbers Together',
    body: 'A custom interleave function weaves digits from chainFinal and div2_8 in a 1:3 ratio, prefixed by divisor1, producing an expanded numeric string.',
    example: 'weave(start=divisor1, chainFinal, div2_8) = <span class="ex-v">\'weaved string\'</span>'
  },
  {
    n: '10',
    title: 'Triple Base Conversion',
    body: 'The weaved string undergoes three successive base conversions using BigInt arithmetic to handle arbitrary precision throughout.',
    example: 'decimal → <span class="ex-l">base5</span> → treat as decimal → <span class="ex-l">base7</span> → treat as decimal → <span class="ex-v">HEX</span>'
  },
  {
    n: '11',
    title: 'Wrap with Table Signature',
    body: 'The table key is split into two 2-character halves which are prepended and appended to the hex string, embedding a unique table signature in the output.',
    example: 'sig = 9148 → last2=<span class="ex-v">48</span>, first2=<span class="ex-v">91</span><br>wrapped = <span class="ex-v">"48"</span> + hex + <span class="ex-v">"91"</span>'
  },
  {
    n: '12',
    title: 'Swap First 4 and Last 4 Characters',
    body: 'The first and last 4 characters of the wrapped string swap positions, with the middle section intact — a final positional scramble.',
    example: '"<span class="ex-v">AAAA</span>BBBBBB<span class="ex-v">CCCC</span>" → "<span class="ex-v">CCCC</span>BBBBBB<span class="ex-v">AAAA</span>"'
  },
  {
    n: '13',
    title: 'Read as Hex → Base 10',
    body: 'The swapped string is interpreted as a hexadecimal number and converted to decimal. The result is typically a 30+ digit number, requiring BigInt throughout.',
    example: '0xSWAPPED → <span class="ex-v">huge decimal</span> (30+ digits)'
  },
  {
    n: '14',
    title: 'Convert to Base 4',
    body: 'That huge base-10 number is represented in base 4 (digits 0–3). The result is a very long string of 0s, 1s, 2s, and 3s.',
    example: 'huge decimal → <span class="ex-v">base4 string</span> (very long)'
  },
  {
    n: '15',
    title: 'Treat as Decimal → Base 9',
    body: 'The base-4 string (valid as decimal since it only contains 0–3) is reinterpreted as a decimal number, then converted to base 9.',
    example: 'base4 string (as decimal) → <span class="ex-v">base9 string</span>'
  },
  {
    n: '16',
    title: 'Final: Treat as Decimal → Hex',
    body: 'The base-9 string is parsed as a decimal number and converted to <strong>hexadecimal</strong>. This is the final output for that character. Hex digits may include 0–9 and A–F.',
    example: 'base9 string (as decimal) → <span class="ex-fin ex-v">FINAL HEX OUTPUT</span>',
    final: true
  }
];

function buildAlgoPipeline() {
  const pipe = $('algoPipeline');
  ALGO_STEPS.forEach((step, i) => {
    const item = document.createElement('div');
    item.className = 'algo-step-item fade-up';
    item.style.transitionDelay = (i * 0.04) + 's';
    item.innerHTML = `
      <div class="algo-step-node">${step.n}</div>
      <div class="algo-step-body">
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        <div class="algo-example-box">${step.example}</div>
      </div>
    `;
    pipe.appendChild(item);
  });
  // re-observe newly added fade-ups
  pipe.querySelectorAll('.fade-up').forEach(el => revealObs.observe(el));
}
buildAlgoPipeline();

// ── ADD FADE-UP TO STATIC ELEMENTS ──
document.querySelectorAll('.about-card, .dep-card, .arch-node, .security-block, .algo-example-banner').forEach(el => {
  el.classList.add('fade-up');
  revealObs.observe(el);
});
