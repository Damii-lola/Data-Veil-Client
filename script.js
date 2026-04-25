const API_BASE = 'https://data-veil-api.onrender.com';   // your Render URL

const inputText = document.getElementById('inputText');
const encryptBtn = document.getElementById('encryptBtn');
const statusEl = document.getElementById('status');
const resultCard = document.getElementById('resultCard');
const hexOutput = document.getElementById('hexOutput');
const qrImage = document.getElementById('qrImage');
const downloadLink = document.getElementById('downloadLink');
const stepsCard = document.getElementById('stepsCard');
const stepsContainer = document.getElementById('stepsContainer');
const copyHexBtn = document.getElementById('copyHexBtn');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'var(--danger)' : 'var(--success)';
}

function renderSteps(steps) {
  stepsContainer.innerHTML = '';
  steps.forEach((s, idx) => {
    const block = document.createElement('div');
    block.className = 'step-block';
    block.innerHTML = `
      <h3 onclick="this.nextElementSibling.classList.toggle('hidden')">
        🔤 Character #${idx+1}: '${s.character}' (9‑digit: ${s.code})
      </h3>
      <div class="step-details">
        <p><span>Step 2:</span> Split → First 3: ${s.first3}, Next 2: ${s.next2}, Last 4: ${s.last4}</p>
        <p><span>Step 3:</span> a=${s.step3.a}, b=${s.step3.b}, c=${s.step3.c} | a+b = ${s.step3.sum_ab}, (a+b)*c = ${s.step3.prod}, a+b+c = ${s.step3.sum_abc}</p>
        <p>   Modulo: ${s.step3.prod} % ${s.step3.sum_abc} = ${s.step3.mod1}, ${s.step3.sum_abc} % ${s.step3.prod} = ${s.step3.mod2} → <span>Carry = ${s.step3.carry}</span></p>
        <p><span>Step 4:</span> ${s.step3.carry} * ${s.step4.midVal} = <span>${s.step4.step4res}</span></p>
        <p><span>Step 5:</span> Set1 = [${s.step5.set1}], Set2 = [${s.step5.set2}], Diffs = [${s.step5.diffs}], Sum = ${s.step5.scrambleSum}</p>
        <p><span>Step 6:</span> ${s.step5.scrambleSum} ÷ ${s.step4.step4res} = ${s.step6.quotient} (drop decimal)</p>
        <p><span>Step 7:</span> base5(${s.step6.quotient}) = '${s.step7.base5Str}' → treat as decimal ${s.step7.base5AsDecimal} × ${s.first3} = <span>${s.step7.product}</span></p>
        <p><span>Step 8:</span> sumDigits('${s.step7.base5Str}') = ${s.step8.sumBase5} → divisor1=${s.step8.divisor1}</p>
        <p>   ${s.step7.product} % ${s.step8.divisor1}=${s.step8.mod1_8}, ÷${s.step8.divisor1}=${s.step8.div1_8}, %${s.step8.divisor1}=${s.step8.mod2_8}, ÷${s.step8.divisor1}=${s.step8.div2_8}</p>
        <p>   last4Sum = ${s.step8.last4Sum} → divisor2=${s.step8.divisor2}, div2_8 % divisor2 = ${s.step8.mod3_8}</p>
        <p>   Chain numbers [${s.step8.chainNumbers}] sum = ${s.step8.chainSum}, chainFinal = <span>${s.step8.chainFinal}</span></p>
        <p><span>Step 9:</span> weave(start=${s.step8.divisor1}, ${s.step8.chainFinal}, ${s.step8.div2_8}) = '${s.step9.weaved}'</p>
        <p><span>Step 10:</span> weaved → base5 = '${s.step10.base5_2}' → treat as dec → base7 = '${s.step10.base7}' → treat as dec → hex = '${s.step10.hex}'</p>
        <p><span>Step 11:</span> Signature: ${s.step11.sig} → wrapped: '${s.step11.wrapped}'</p>
        <p><span>Step 12:</span> swap first4('${s.step12.first4}') & last4('${s.step12.last4part}') → '${s.step12.swapped}'</p>
        <p><span>Step 13:</span> 0x${s.step12.swapped} as hex → base10: ${s.step13.base10.slice(0,40)}…</p>
        <p><span>Step 14:</span> base10 → base4: ${s.step14.base4.slice(0,40)}…</p>
        <p><span>Step 15:</span> base4 string treated as decimal → base9: ${s.step15.base9.slice(0,40)}…</p>
        <p><span>Step 16:</span> base9 string treated as decimal → hex: <b style="color: #4ade80;">${s.step16.finalHex}</b></p>
      </div>
    `;
    stepsContainer.appendChild(block);
  });
}

async function encrypt() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('⚠️ Please enter some text', true);
    return;
  }

  resultCard.style.display = 'none';
  stepsCard.style.display = 'none';
  qrImage.style.display = 'none';
  downloadLink.style.display = 'none';
  hexOutput.textContent = '';
  setStatus('⏳ Encrypting...');

  try {
    const res = await fetch(`${API_BASE}/api/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server error ${res.status}`);
    }

    const data = await res.json();

    // Show hex result
    hexOutput.textContent = data.encryptedHex;
    resultCard.style.display = 'block';

    // Show QR
    if (data.qrCodeDataUrl) {
      qrImage.src = data.qrCodeDataUrl;
      qrImage.style.display = 'block';
      downloadLink.href = data.qrCodeDataUrl;
      downloadLink.style.display = 'inline-block';
    }

    // Show steps
    if (data.steps && data.steps.length > 0) {
      stepsCard.style.display = 'block';
      renderSteps(data.steps);
    }

    setStatus('✅ Encryption successful');
  } catch (err) {
    setStatus(`❌ Error: ${err.message}`, true);
  }
}

// Copy hex to clipboard
copyHexBtn.addEventListener('click', () => {
  const hex = hexOutput.textContent;
  if (!hex) return;
  navigator.clipboard.writeText(hex).then(() => {
    copyHexBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyHexBtn.textContent = '📋 Copy Hex'; }, 2000);
  });
});

encryptBtn.addEventListener('click', encrypt);
