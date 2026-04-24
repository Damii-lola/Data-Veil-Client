const API_BASE = 'https://data-veil-api.onrender.com'; // your Render URL

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const statusEl = document.getElementById('status');

function setStatus(msg, isError=false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'red' : 'gray';
}

async function callApi(endpoint, body) {
  setStatus('Contacting server...');
  console.log(`📤 Sending to ${API_BASE}${endpoint}:`, body);

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    console.log(`📥 Response status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);

    if (endpoint === '/api/encrypt') {
      outputText.value = data.result;   // final hex after step 16
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encrypted ${data.charSteps.length} character(s)`);

      // Show per‑character steps
      console.table(data.charSteps.map(s => ({
        Char: s.character,
        '1st3': s.first3,
        'mid2': s.next2,
        'last4': s.last4,
        'carry': s.step3.carry,
        'step4': s.step4.step4res,
        'scramble': s.step5.scrambleSum,
        'step6': s.step6.quotient,
        'base5': s.step7.base5Str,
        'chainFinal': s.step8.chainFinal,
        'weaved': s.step9.weaved,
        'hex': s.step10.hex,
        'wrapped': s.step11.wrapped,
        'step12': s.step12.final
      })));

      // Show global steps 13‑16
      console.log('🌐 Global Steps 13‑16');
      const gs = data.globalSteps;
      console.log('Concatenated Step12 Hex:', gs.concatHexAfter12);
      console.table({
        'Step13 – Base10': gs.step13.base10,
        'Step14 – Base4': gs.step14.base4,
        'Step15 – Base9': gs.step15.base9,
        'Step16 – Final Hex': gs.step16.finalHex
      });
    } else {
      outputText.value = data.result;
      console.log('✅ Decrypted');
    }
    setStatus('Success');
  } catch (err) {
    console.error('❌ Request error:', err);
    setStatus(`Error: ${err.message}`, true);
    outputText.value = '';
  }
}

encryptBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { setStatus('Please enter some text', true); return; }
  callApi('/api/encrypt', { text });
});

decryptBtn.addEventListener('click', () => {
  const ciphertext = inputText.value.trim();
  if (!ciphertext || ciphertext.length%9!==0) { setStatus('Ciphertext must be digits, multiple of 9', true); return; }
  callApi('/api/decrypt', { ciphertext });
});
