const API_BASE = 'https://data-veil-api.onrender.com';   // your Render backend

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

    // Parse JSON (if possible)
    let data;
    try {
      data = await res.json();
    } catch {
      const rawText = await res.text();
      console.error('❌ Response is not JSON:', rawText);
      throw new Error(`Server returned non‑JSON (status ${res.status}). Check backend logs.`);
    }

    if (!res.ok) {
      // Use the error message from the server, if present
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    // ---- Success ----
    if (endpoint === '/api/encrypt') {
      // Show the final encrypted hex in the output box
      outputText.value = data.result;

      // Log the table key and steps for debugging
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encryption complete – ${data.steps.length} character(s)`);

      // Build a nice console table of the key intermediate results
      if (data.steps && data.steps.length > 0) {
        const rows = data.steps.map(s => ({
          Char: s.character,
          '1st3': s.first3,
          'mid2': s.next2,
          'last4': s.last4,
          'carry': s.step3.carry,
          'scramble': s.step5.scrambleSum,
          'step6q': s.step6.quotient,
          'base5': s.step7.base5Str,
          'weaved': s.step9.weaved,
          'hex (step10)': s.step10.hex,
          'wrapped': s.step11.wrapped,
          'swapped': s.step12.swapped,
          'base10 (s13)': s.step13.base10.slice(0, 20) + '…',
          'base4 (s14)': s.step14.base4.slice(0, 20) + '…',
          'base9 (s15)': s.step15.base9.slice(0, 20) + '…',
          'FINAL HEX': s.step16.finalHex
        }));
        console.table(rows);
      }
    } else if (endpoint === '/api/decrypt') {
      // Decrypt endpoint (currently works with old 9-digit format)
      outputText.value = data.result;
      console.log('✅ Decryption complete');
    }

    setStatus('Success');
  } catch (err) {
    console.error('❌ Request error:', err);
    setStatus(`Error: ${err.message}`, true);
    outputText.value = '';
  }
}

// ---- Button listeners ----
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
  // This decrypt still only works with the old 9‑digit code format.
  // For the new 16‑step encryption, decryption must be rebuilt later.
  if (!ciphertext || ciphertext.length % 9 !== 0) {
    setStatus('Decrypt currently only works with 9‑digit codes. Update coming soon.', true);
    return;
  }
  callApi('/api/decrypt', { ciphertext });
});
