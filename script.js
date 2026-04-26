// ── CONFIG ──
const API_BASE = 'https://data-veil-api.onrender.com';

// ── DOM ──
const inputText      = document.getElementById('inputText');
const encryptBtn     = document.getElementById('encryptBtn');
const charCountEl    = document.getElementById('charCount');
const statusDot      = document.getElementById('statusDot');
const statusTextEl   = document.getElementById('statusText');
const outputPanel    = document.getElementById('outputPanel');
const hexOutput      = document.getElementById('hexOutput');
const copyHexBtn     = document.getElementById('copyHexBtn');
const downloadLink   = document.getElementById('downloadLink');
const qrSection      = document.getElementById('qrSection');
const qrImage        = document.getElementById('qrImage');
const stepsSection   = document.getElementById('stepsSection');
const stepsContainer = document.getElementById('stepsContainer');
const toggleAllBtn   = document.getElementById('toggleAllBtn');
const statsGrid      = document.getElementById('statsGrid');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText    = document.getElementById('loadingText');
const loadingSub     = document.getElementById('loadingSub');
const toastEl        = document.getElementById('toast');
const navbar         = document.getElementById('navbar');
const navHamburger   = document.getElementById('navHamburger');
const navMobile      = document.getElementById('navMobile');

// ── MOBILE MENU ──
function toggleMenu() {
  navMobile.classList.toggle('open');
}

// ── NAVBAR SCROLL BEHAVIOUR ──
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
  highlightNavLink();
}, { passive: true });

function highlightNavLink() {
  const sections = ['hero', 'encrypt', 'about', 'algorithm', 'architecture'];
  let current = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 100) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + current);
  });
}

// ── CANVAS BACKGROUND ──
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let gridOff   = 0;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function makeParticle() {
  return {
    x:       Math.random() * canvas.width,
    y:       canvas.height + 10,
    vx:      (Math.random() - 0.5) * 0.28,
    vy:      -(Math.random() * 0.38 + 0.1),
    opacity: Math.random() * 0.36 + 0.1,
    char:    '0123456789ABCDEF'[Math.floor(Math.random() * 16)],
    life:    1,
    decay:   Math.random() * 0.0018 + 0.0008
  };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 55; i++) {
    const p = makeParticle();
    p.y = Math.random() * canvas.height;
    particles.push(p);
  }
}

function drawBg() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scrolling grid
  ctx.strokeStyle = 'rgba(0,220,255,0.026)';
  ctx.lineWidth   = 1;
  const gs = 60;
  gridOff  = (gridOff + 0.12) % gs;
  for (let x = gridOff - gs; x < canvas.width  + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = gridOff - gs; y < canvas.height + gs; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Floating hex particles
  ctx.font = '10px "Share Tech Mono", monospace';
  particles.forEach((p, i) => {
    p.x    += p.vx;
    p.y    += p.vy;
    p.life -= p.decay;
    if (p.life <= 0 || p.y < -20) { particles[i] = makeParticle(); return; }
    ctx.fillStyle = `rgba(0,255,140,${p.opacity * p.life})`;
    ctx.fillText(p.char, p.x, p.y);
    if (Math.random() < 0.008)
      p.char = '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
  });

  requestAnimationFrame(drawBg);
}

resizeCanvas(); initParticles(); drawBg();
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); }, { passive: true });

// ── SCROLL FADE-IN OBSERVER ──
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

// ── STATUS ──
function setStatus(msg, type = 'ready') {
  statusTextEl.textContent = msg;
  statusDot.className = 'status-dot';
  if (type === 'error')   statusDot.classList.add('error');
  if (type === 'working') statusDot.classList.add('working');
}

const idleMsgs = [
  'SYSTEM READY — AWAITING INPUT',
  'ALL SYSTEMS NOMINAL',
  'CIPHER ENGINE ONLINE',
  '16-STEP ALGORITHM LOADED'
];
let idleIdx = 0;
setInterval(() => {
  if (statusDot.className === 'status-dot') {
    idleIdx = (idleIdx + 1) % idleMsgs.length;
    setStatus(idleMsgs[idleIdx]);
  }
}, 4200);

// ── CHAR COUNT ──
inputText.addEventListener('input', () => {
  charCountEl.textContent = inputText.value.length;
});

// ── LOADING ──
const loadingStages = [
  ['CONNECTING',    'Reaching cipher engine on Render...'],
  ['FETCHING KEYS', 'Loading Supabase character mappings...'],
  ['PROCESSING',    'Running 16-step algorithm per character...'],
  ['FINALIZING',    'Generating hex output and QR code...'],
];
let loadingInterval;

function showLoading() {
  loadingOverlay.style.display = 'flex';
  let s = 0;
  loadingText.textContent = loadingStages[0][0];
  loadingSub.textContent  = loadingStages[0][1];
  loadingInterval = setInterval(() => {
    s = (s + 1) % loadingStages.length;
    loadingText.textContent = loadingStages[s][0];
    loadingSub.textContent  = loadingStages[s][1];
  }, 1500);
}

function hideLoading() {
  clearInterval(loadingInterval);
  loadingOverlay.style.display = 'none';
}

// ── TOAST ──
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// ── HEX STREAM ANIMATION ──
function animateHex(fullHex) {
  hexOutput.innerHTML = '';
  let i = 0;
  function addChunk() {
    if (i >= fullHex.length) return;
    const end  = Math.min(i + 4, fullHex.length);
    const span = document.createElement('span');
    span.className   = 'hex-char new';
    span.textContent = fullHex.slice(i, end);
    hexOutput.appendChild(span);
    i = end;
    setTimeout(addChunk, 16);
  }
  addChunk();
}

// ── STATS ──
function renderStats(data) {
  const hex    = data.encryptedHex;
  const chars  = data.steps.length;
  const hexLen = hex.length;
  const unique  = new Set(hex.toUpperCase()).size;
  const entropy = Math.round(unique / 16 * 100);
  const items = [
    { label: 'INPUT CHARS',  value: chars },
    { label: 'HEX LENGTH',   value: hexLen.toLocaleString() },
    { label: 'HEX PER CHAR', value: Math.round(hexLen / chars) },
    { label: 'HEX ENTROPY',  value: entropy + '%' },
  ];
  statsGrid.innerHTML = '';
  items.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = (i * 0.07) + 's';
    card.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div>`;
    statsGrid.appendChild(card);
  });
}

// ── STEP RENDERING ──
let allExpanded = false;

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function trunc(s, n) {
  const str = String(s == null ? '—' : s);
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function renderSteps(steps) {
  stepsContainer.innerHTML = '';
  steps.forEach((s, idx) => {
    const dc = s.character === ' ' ? '·' : s.character === '\n' ? '↵' : s.character;
    const block = document.createElement('div');
    block.className = 'step-block';
    block.style.animationDelay = Math.min(idx * 0.035, 0.6) + 's';
    block.innerHTML = `
      <div class="step-header" onclick="toggleStep(this)">
        <div class="step-char-badge">${escHtml(dc)}</div>
        <div class="step-header-info">
          <div class="step-char-label">CHARACTER #${idx + 1} — <span style="color:var(--accent)">'${escHtml(dc)}'</span></div>
          <div class="step-char-code">9-DIGIT CODE: ${escHtml(s.code)}</div>
        </div>
        <div class="step-final-hex">${escHtml(s.step16.finalHex)}</div>
        <div class="step-toggle">▼</div>
      </div>
      <div class="step-details">
        <table class="steps-table">
          <tr>
            <td>STEP 2</td>
            <td>Split → <span class="val-highlight">First3:</span> ${escHtml(s.first3)} &nbsp;|&nbsp;
                <span class="val-highlight">Mid2:</span> ${escHtml(s.next2)} &nbsp;|&nbsp;
                <span class="val-highlight">Last4:</span> ${escHtml(s.last4)}</td>
          </tr>
          <tr>
            <td>STEP 3</td>
            <td>a=${s.step3.a}, b=${s.step3.b}, c=${s.step3.c} →
                (a+b)=${s.step3.sum_ab}, ×c=${s.step3.prod}, sum=${s.step3.sum_abc}<br>
                mod1=${s.step3.mod1}, mod2=${s.step3.mod2} →
                <span class="val-highlight">Carry=${s.step3.carry}</span></td>
          </tr>
          <tr>
            <td>STEP 4</td>
            <td>${s.step3.carry} × ${s.step4.midVal} = <span class="val-highlight">${s.step4.step4res}</span></td>
          </tr>
          <tr>
            <td>STEP 5</td>
            <td>Set1=[${s.step5.set1.join(', ')}] &nbsp; Set2=[${s.step5.set2.join(', ')}]<br>
                Diffs=[${s.step5.diffs.join(', ')}] → <span class="val-highlight">ScrambleSum=${s.step5.scrambleSum}</span></td>
          </tr>
          <tr>
            <td>STEP 6</td>
            <td>${s.step5.scrambleSum} ÷ ${s.step4.step4res} = <span class="val-highlight">${s.step6.quotient}</span> (integer)</td>
          </tr>
          <tr>
            <td>STEP 7</td>
            <td>base5(${s.step6.quotient}) = '${escHtml(s.step7.base5Str)}' → dec ${s.step7.base5AsDecimal} × ${s.first3} =
                <span class="val-highlight">${s.step7.product}</span></td>
          </tr>
          <tr>
            <td>STEP 8</td>
            <td>digitSum='${s.step8.sumBase5}' → divisor1=<span class="val-highlight">${s.step8.divisor1}</span> &nbsp;|&nbsp;
                last4Sum=${s.step8.last4Sum} → divisor2=${s.step8.divisor2}<br>
                chainNums=[${s.step8.chainNumbers.join(', ')}] → sum=${s.step8.chainSum} →
                <span class="val-highlight">chainFinal=${s.step8.chainFinal}</span></td>
          </tr>
          <tr>
            <td>STEP 9</td>
            <td>weave(${s.step8.divisor1}, ${s.step8.chainFinal}, ${s.step8.div2_8}) =
                <span class="val-highlight">'${trunc(s.step9.weaved, 30)}'</span></td>
          </tr>
          <tr>
            <td>STEP 10</td>
            <td>→ base5: '${trunc(s.step10.base5_2, 24)}' → base7: '${trunc(s.step10.base7, 24)}' →
                <span class="val-highlight">hex: '${escHtml(s.step10.hex)}'</span></td>
          </tr>
          <tr>
            <td>STEP 11</td>
            <td>sig=${escHtml(s.step11.sig)} → wrapped: <span class="val-highlight">'${trunc(s.step11.wrapped, 30)}'</span></td>
          </tr>
          <tr>
            <td>STEP 12</td>
            <td>first4='${escHtml(s.step12.first4)}' ↔ last4='${escHtml(s.step12.last4part)}' →
                <span class="val-highlight">'${trunc(s.step12.swapped, 28)}'</span></td>
          </tr>
          <tr>
            <td>STEP 13</td>
            <td>hex → decimal: ${trunc(s.step13.base10, 42)}</td>
          </tr>
          <tr>
            <td>STEP 14</td>
            <td>→ base4: ${trunc(s.step14.base4, 42)}</td>
          </tr>
          <tr>
            <td>STEP 15</td>
            <td>→ base9: ${trunc(s.step15.base9, 42)}</td>
          </tr>
          <tr>
            <td>STEP 16</td>
            <td><span class="val-final">${escHtml(s.step16.finalHex)}</span></td>
          </tr>
        </table>
      </div>`;
    stepsContainer.appendChild(block);
  });
}

function toggleStep(header) {
  header.nextElementSibling.classList.toggle('open');
  header.querySelector('.step-toggle').classList.toggle('open');
}

toggleAllBtn.addEventListener('click', () => {
  allExpanded = !allExpanded;
  stepsContainer.querySelectorAll('.step-details').forEach(d => d.classList.toggle('open', allExpanded));
  stepsContainer.querySelectorAll('.step-toggle').forEach(t => t.classList.toggle('open', allExpanded));
  toggleAllBtn.textContent = allExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL';
});

// ── ENCRYPT ──
async function encrypt() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('⚠ ENTER A MESSAGE TO ENCRYPT', 'error');
    inputText.focus();
    return;
  }

  outputPanel.style.display  = 'none';
  qrSection.style.display    = 'none';
  stepsSection.style.display = 'none';
  encryptBtn.disabled = true;
  setStatus('PROCESSING — RUNNING 16-STEP ALGORITHM', 'working');
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/api/encrypt`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    hideLoading();

    // Hex output
    outputPanel.style.display = 'block';
    outputPanel.classList.remove('reveal');
    void outputPanel.offsetWidth;
    outputPanel.classList.add('reveal');
    animateHex(data.encryptedHex);

    // QR + stats
    if (data.qrCodeDataUrl) {
      qrImage.src                = data.qrCodeDataUrl;
      downloadLink.href          = data.qrCodeDataUrl;
      downloadLink.style.display = 'inline-flex';
      qrSection.style.display    = 'grid';
      qrSection.classList.remove('reveal');
      void qrSection.offsetWidth;
      qrSection.classList.add('reveal');
      renderStats(data);
    }

    // Steps
    if (data.steps && data.steps.length > 0) {
      stepsSection.style.display = 'block';
      stepsSection.classList.remove('reveal');
      void stepsSection.offsetWidth;
      stepsSection.classList.add('reveal');
      renderSteps(data.steps);
      allExpanded = false;
      toggleAllBtn.textContent = 'EXPAND ALL';
    }

    setStatus(`✓ ENCRYPTION COMPLETE — ${data.steps.length} CHARACTER(S) PROCESSED`);
    setTimeout(() => outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);

  } catch (err) {
    hideLoading();
    setStatus(`✗ ERROR: ${err.message.toUpperCase()}`, 'error');
  } finally {
    encryptBtn.disabled = false;
  }
}

// ── EVENTS ──
encryptBtn.addEventListener('click', encrypt);

inputText.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') encrypt();
});

copyHexBtn.addEventListener('click', () => {
  const hex = hexOutput.textContent;
  if (!hex) return;
  navigator.clipboard.writeText(hex)
    .then(() => showToast('HEX COPIED TO CLIPBOARD'))
    .catch(() => showToast('COPY FAILED — TRY MANUALLY'));
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-mobile .nav-link').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});
