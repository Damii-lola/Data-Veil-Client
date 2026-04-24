const API_BASE = 'https://data-veil-api.onrender.com';

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const statusEl = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? 'red' : 'gray';
}

async function callApi(endpoint, body) {
  setStatus('Contacting server...');
  console.log(`📤 Sending to ${API_BASE}${endpoint}:`, body);

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log(`📥 Response status: ${res.status}`);

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      const rawText = await res.text();
      console.error('❌ Response is not JSON:', rawText);
      throw new Error(`Server returned non‑JSON (status ${res.status}). Check backend logs.`);
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    // --- Success ---
    if (endpoint === '/api/encrypt') {
      outputText.value = data.result;

      // Show table key
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encryption successful – ${data.steps.length} character(s)`);

      // Build a console.table with full step‑by‑step details
      const tableData = data.steps.map(s => ({
        Character: s.character,
        '9‑Digit': s.code,
        'First 3': s.first3,
        'Next 2': s.next2,
        'Last 4': s.last4,
        'Step3 a,b,c': `${s.step3.a},${s.step3.b},${s.step3.c}`,
        'a+b': s.step3.sum_ab,
        '(a+b)*c': s.step3.prod,
        'b+c': s.step3.sum_bc,
        'mod1 (prod % sum_bc)': s.step3.mod1,
        'mod2 (sum_bc % prod)': s.step3.mod2,
        'Carry (mod1+mod2)': s.step3.carry,
        'Middle Value': s.step4.middle_value,
        'Step4 Result (carry * middle)': s.step4.result
      }));

      console.table(tableData);
    } else {
      // Decrypt
      outputText.value = data.result;
      console.log('✅ Decryption successful');
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
  if (!text) {
    setStatus('Please enter some text', true);
    return;
  }
  callApi('/api/encrypt', { text });
});

decryptBtn.addEventListener('click', () => {
  const ciphertext = inputText.value.trim();
  if (!ciphertext || ciphertext.length % 9 !== 0) {
    setStatus('Ciphertext must be only digits, length a multiple of 9', true);
    return;
  }
  callApi('/api/decrypt', { ciphertext });
});
