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
  // Clear old status
  setStatus('Contacting server...');

  // Show what we're about to send (for debugging)
  console.log(`📤 Sending to ${API_BASE}${endpoint}:`, body);

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Log the raw response status
    console.log(`📥 Response status: ${res.status}`);

    // Try to parse JSON, but handle non‑JSON responses gracefully
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      // If the server returned pure text or HTML
      const rawText = await res.text();
      console.error('❌ Response is not JSON:', rawText);
      throw new Error(`Server returned non‑JSON (status ${res.status}). Check backend logs.`);
    }

    if (!res.ok) {
      // The server sent a JSON error object
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    outputText.value = data.result;
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
