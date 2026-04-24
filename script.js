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
      outputText.value = data.result;
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encrypted ${data.steps.length} character(s)`);

      // Build a detailed console table
      const rows = data.steps.map(s => ({
        Char: s.character,
        '1st3': s.first3,
        'mid2': s.next2,
        'last4': s.last4,
        'swapped (step12)': s.step12.swapped,
        'base10 (s13)': s.step13.base10.slice(0,20)+'…',
        'base4 (s14)': s.step14.base4.slice(0,20)+'…',
        'base9 (s15)': s.step15.base9.slice(0,20)+'…',
        'FINAL HEX': s.step16.finalHex
      }));
      console.table(rows);
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
