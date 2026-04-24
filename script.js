// CHANGE THIS TO YOUR ACTUAL RENDER URL
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

      // Step 2: Show table key and step‑by‑step breakdown in console
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encryption successful – ${data.steps.length} character(s)`);
      console.table(data.steps.map(s => ({
        Character: s.character,
        '9‑Digit Code': s.code,
        'First 3': s.first3,
        'Next 2': s.next2,
        'Last 4': s.last4
      })));
    } else {
      // Decrypt – just shows the result in the output box
      outputText.value = data.result;
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
