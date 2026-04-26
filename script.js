// ── CONFIG ──
const API_BASE = 'https://data-veil-api.onrender.com';

// ── DOM REFS ──
const inputText = document.getElementById('inputText');
const encryptBtn = document.getElementById('encryptBtn');
const btnText = document.getElementById('btnText');
const charCountEl = document.getElementById('charCount');
const statusBar = document.getElementById('statusBar');
const statusDot = document.getElementById('statusDot');
const statusTextEl = document.getElementById('statusText');
const outputPanel = document.getElementById('outputPanel');
const hexOutput = document.getElementById('hexOutput');
const copyHexBtn = document.getElementById('copyHexBtn');
const downloadLink = document.getElementById('downloadLink');
const qrSection = document.getElementById('qrSection');
const qrImage = document.getElementById('qrImage');
const stepsSection = document.getElementById('stepsSection');
const stepsContainer = document.getElementById('stepsContainer');
const toggleAllBtn = document.getElementById('toggleAllBtn');
const statsGrid = document.getElementById('statsGrid');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const loadingSub = document.getElementById('loadingSub');

// ── CANVAS BACKGROUND (Particles + Grid) ──
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let gridOffset = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.4 - 0.1,
    size: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.4 + 0.1,
    char: '0123456789ABCDEF'[Math.floor(Math.random() * 16)],
    life: 1,
    decay: Math.random() * 0.002 + 0.001
  };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 60; i++) {
    const p = createParticle();
    p.y = Math.random() * canvas.height;
    particles.push(p);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  gridOffset = (gridOffset + 0.15) % gridSize;

  for (let x = -gridSize + gridOffset; x < canvas.width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = -gridSize + gridOffset; y < canvas.height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Particles
  ctx.font = '10px Share Tech Mono, monospace';
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0 || p.y < -20) {
      particles[i] = createParticle();
      particles[i].x = Math.random() * canvas.width;
      particles[i].y = canvas.height + 10;
    }

    ctx.fillStyle = `rgba(0, 255, 140, ${p.opacity * p.life})`;
    ctx.fillText(p.char, p.x, p.y);

    // Randomly change character
    if (Math.random() < 0.01) {
      p.char = '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
    }
  });

  requestAnimationFrame(drawBackground);
}

resizeCanvas();
initParticles();
drawBackground();
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

// ── STATUS ──
function setStatus(msg, type = 'ready') {
  statusTextEl.textContent = msg;
  statusDot.className = 'status-dot';
  if (type === 'error') statusDot.classList.add('error');
  if (type === 'working') statusDot.classList.add('working');
}

// ── CHAR COUNT ──
inputText.addEventListener('input', () => {
  charCountEl.textContent = inputText.value.length;
});

// ── LOADING ──
const loadingStages = [
  ['CONNECTING', 'Reaching cipher engine on Render...'],
  ['FETCHING KEYS', 'Loading Supabase character mappings...'],
  ['PROCESSING', 'Running 16-step algorithm...'],
  ['FINALIZING', 'Generating hex output and QR code...'],
];

let loadingInterval;

function showLoading() {
  loadingOverlay.style.display = 'flex';
  let stage = 0;
  loadingText.textContent = loadingStages[0][0];
  loadingSub.textContent = loadingStages[0][1];
  loadingInterval = setInterval(() => {
    stage = (stage + 1) % loadingStages.length;
    loadingText.textContent = loadingStages[stage][0];
    loadingSub.textContent = loadingStages[stage][1];
  }, 1400);
}

function hideLoading() {
  clearInterval(loadingInterval);
  loadingOverlay.style.display = 'none';
}

// ── TOAST ──
let toastEl = null;

function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ── HEX STREAM WITH ANIMATION ──
function animateHex(fullHex) {
  hexOutput.innerHTML = '';
  let i = 0;
  const chunkSize = 4;

  function addChunk() {
    if (i >= fullHex.length) return;
    const end = Math.min(i + chunkSize, fullHex.length);
    const chunk = fullHex.slice(i, end);

    const span = document.createElement('span');
    span.className = 'hex-char new';
    span.textContent = chunk;
    hexOutput.appendChild(span);

    i = end;
    setTimeout(addChunk, 18);
  }
  addChunk();
}

// ── STATS ──
function renderStats(data) {
  const hex = data.encryptedHex;
  const chars = data.steps.length;
  const hexLen = hex.length;
  const uniqueChars = new Set(hex.toUpperCase()).size;
  const entropy = (uniqueChars / 16 * 100).toFixed(0);

  const stats = [
    { label: 'INPUT CHARS', value: chars },
    { label: 'HEX LENGTH', value: hexLen.toLocaleString() },
    { label: 'HEX PER CHAR', value: (hexLen / chars).toFixed(0) },
    { label: 'HEX ENTROPY', value: entropy + '%' },
  ];

  statsGrid.innerHTML = '';
  stats.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = (i * 0.08) + 's';
    card.innerHTML = `<div class="stat-label">${s.label}</div><div class="stat-value">${s.value}</div>`;
    statsGrid.appendChild(card);
  });
}

// ── STEP RENDERING ──
let allExpanded = false;

function renderSteps(steps) {
  stepsContainer.innerHTML = '';

  steps.forEach((s, idx) => {
    const block = document.createElement('div');
    block.className = 'step-block';
    block.style.animationDelay = (idx * 0.04) + 's';

    const displayChar = s.character === ' ' ? '·' : s.character === '\n' ? '↵' : s.character;

    block.innerHTML = `
      <div class="step-header" onclick="toggleStep(this)">
        <div class="step-char-badge">${escHtml(displayChar)}</div>
        <div class="step-header-info">
          <div class="step-char-label">CHARACTER #${idx + 1} — <span style="color:var(--accent);">'${escHtml(displayChar)}'</span></div>
          <div class="step-char-code">9-DIGIT CODE: ${s.code}</div>
        </div>
        <div class="step-final-hex">${s.step16.finalHex}</div>
        <div class="step-toggle">▼</div>
      </div>
      <div class="step-details">
        <table class="steps-table">
          <tr>
            <td>STEP 2</td>
            <td>Split → <span class="val-highlight">First 3:</span> ${s.first3} &nbsp;|&nbsp; <span class="val-highlight">Mid 2:</span> ${s.next2} &nbsp;|&nbsp; <span class="val-highlight">Last 4:</span> ${s.last4}</td>
          </tr>
          <tr>
            <td>STEP 3</td>
            <td>a=${s.step3.a}, b=${s.step3.b}, c=${s.step3.c} &nbsp;→&nbsp; (a+b)=${s.step3.sum_ab}, ×c=${s.step3.prod}, sum=${s.step3.sum_abc}<br>
            mod1=${s.step3.mod1}, mod2=${s.step3.mod2} &nbsp;→&nbsp; <span class="val-highlight">Carry=${s.step3.carry}</span></td>
          </tr>
          <tr>
            <td>STEP 4</td>
            <td>${s.step3.carry} × ${s.step4.midVal} = <span class="val-highlight">${s.step4.step4res}</span></td>
          </tr>
          <tr>
            <td>STEP 5</td>
            <td>Set1=[${s.step5.set1.join(', ')}] &nbsp; Set2=[${s.step5.set2.join(', ')}]<br>Diffs=[${s.step5.diffs.join(', ')}] &nbsp; <span class="val-highlight">ScrambleSum=${s.step5.scrambleSum}</span></td>
          </tr>
          <tr>
            <td>STEP 6</td>
            <td>${s.step5.scrambleSum} ÷ ${s.step4.step4res} = <span class="val-highlight">${s.step6.quotient}</span> (integer)</td>
          </tr>
          <tr>
            <td>STEP 7</td>
            <td>base5(${s.step6.quotient}) = '${s.step7.base5Str}' &nbsp;→&nbsp; treat as dec ${s.step7.base5AsDecimal} × ${s.first3} = <span class="val-highlight">${s.step7.product}</span></td>
          </tr>
          <tr>
            <td>STEP 8</td>
            <td>digitSum('${s.step7.base5Str}')=${s.step8.sumBase5} → divisor1=<span class="val-highlight">${s.step8.divisor1}</span><br>
            chainNums=[${s.step8.chainNumbers.join(', ')}] → chainSum=${s.step8.chainSum} → <span class="val-highlight">chainFinal=${s.step8.chainFinal}</span></td>
          </tr>
          <tr>
            <td>STEP 9</td>
            <td>weave(${s.step8.divisor1}, ${s.step8.chainFinal}, ${s.step8.div2_8}) = <span class="val-highlight">'${s.step9.weaved}'</span></td>
          </tr>
          <tr>
            <td>STEP 10</td>
            <td>→ base5: '${truncate(s.step10.base5_2, 30)}' → base7: '${truncate(s.step10.base7, 30)}' → <span class="val-highlight">hex: '${s.step10.hex}'</span></td>
          </tr>
          <tr>
            <td>STEP 11</td>
            <td>sig=${s.step11.sig} → wrapped: <span class="val-highlight">'${s.step11.wrapped}'</span></td>
          </tr>
          <tr>
            <td>STEP 12</td>
            <td>first4='${s.step12.first4}' ↔ last4='${s.step12.last4part}' → <span class="val-highlight">'${s.step12.swapped}'</span></td>
          </tr>
          <tr>
            <td>STEP 13</td>
            <td>0x${s.step12.swapped.slice(0,16)} → decimal: ${truncate(s.step13.base10, 40)}</td>
          </tr>
          <tr>
            <td>STEP 14</td>
            <td>→ base4: ${truncate(s.step14.base4, 40)}</td>
          </tr>
          <tr>
            <td>STEP 15</td>
            <td>→ base9: ${truncate(s.step15.base9, 40)}</td>
          </tr>
          <tr>
            <td>STEP 16</td>
            <td><span class="val-final">${s.step16.finalHex}</span></td>
          </tr>
        </table>
      </div>
    `;

    stepsContainer.appendChild(block);
  });
}

function toggleStep(header) {
  const details = header.nextElementSibling;
  const toggle = header.querySelector('.step-toggle');
  details.classList.toggle('open');
  toggle.classList.toggle('open');
}

toggleAllBtn.addEventListener('click', () => {
  allExpanded = !allExpanded;
  const details = stepsContainer.querySelectorAll('.step-details');
  const toggles = stepsContainer.querySelectorAll('.step-toggle');
  details.forEach(d => d.classList.toggle('open', allExpanded));
  toggles.forEach(t => t.classList.toggle('open', allExpanded));
  toggleAllBtn.textContent = allExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL';
});

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── ENCRYPT ──
async function encrypt() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('⚠ ENTER A MESSAGE TO ENCRYPT', 'error');
    inputText.focus();
    return;
  }

  // Reset UI
  outputPanel.style.display = 'none';
  qrSection.style.display = 'none';
  stepsSection.style.display = 'none';
  encryptBtn.disabled = true;

  setStatus('PROCESSING — RUNNING 16-STEP ALGORITHM', 'working');
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/api/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error ${res.status}`);
    }

    const data = await res.json();

    hideLoading();

    // ── Show hex output panel
    outputPanel.style.display = 'block';
    outputPanel.classList.add('reveal');
    animateHex(data.encryptedHex);

    // ── Show QR
    if (data.qrCodeDataUrl) {
      qrImage.src = data.qrCodeDataUrl;
      downloadLink.href = data.qrCodeDataUrl;
      downloadLink.style.display = 'inline-flex';
      qrSection.style.display = 'grid';
      qrSection.classList.add('reveal');
      renderStats(data);
    }

    // ── Show steps
    if (data.steps && data.steps.length > 0) {
      stepsSection.style.display = 'block';
      stepsSection.classList.add('reveal');
      renderSteps(data.steps);
      allExpanded = false;
      toggleAllBtn.textContent = 'EXPAND ALL';
    }

    setStatus(`✓ ENCRYPTION COMPLETE — ${data.steps.length} CHARACTER(S) PROCESSED`, 'ready');

    // Scroll to results
    setTimeout(() => {
      outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

  } catch (err) {
    hideLoading();
    setStatus(`✗ ERROR: ${err.message.toUpperCase()}`, 'error');
  } finally {
    encryptBtn.disabled = false;
  }
}

// ── COPY HEX ──
copyHexBtn.addEventListener('click', () => {
  const hex = hexOutput.textContent;
  if (!hex) return;
  navigator.clipboard.writeText(hex).then(() => {
    showToast('HEX COPIED TO CLIPBOARD');
  }).catch(() => {
    showToast('COPY FAILED — TRY MANUALLY');
  });
});

// ── ENCRYPT BUTTON ──
encryptBtn.addEventListener('click', encrypt);

// ── ENTER KEY (Ctrl+Enter) ──
inputText.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    encrypt();
  }
});

// ── KEYBOARD HINT ──
const isMac = navigator.platform.toUpperCase().includes('MAC');
btnText.textContent = `ENCRYPT & GENERATE QR`;
document.querySelector('.encrypt-btn').title = `${isMac ? '⌘' : 'Ctrl'}+Enter to encrypt`;

// ── TYPEWRITER EFFECT on STATUS ON LOAD ──
const readyMessages = [
  'SYSTEM READY — AWAITING INPUT',
  'ALL SYSTEMS NOMINAL',
  'CIPHER ENGINE ONLINE',
];
let rmIdx = 0;
setInterval(() => {
  rmIdx = (rmIdx + 1) % readyMessages.length;
  if (statusDot.className === 'status-dot') {
    setStatus(readyMessages[rmIdx], 'ready');
  }
}, 4000);
