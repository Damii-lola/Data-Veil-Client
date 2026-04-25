const API_BASE = 'https://data-veil-api.onrender.com';   // <-- YOUR RENDER URL

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const workingArea = document.getElementById('workingArea');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const statusEl = document.getElementById('status');
const qrImage = document.getElementById('qrImage');
const downloadLink = document.getElementById('downloadLink');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff6b6b' : '#aaa';
}

function printToWorkingArea(text) {
  workingArea.value += text + '\n';
  workingArea.scrollTop = workingArea.scrollHeight;
}

function displayQRCode(qrDataUrl) {
  qrImage.src = qrDataUrl;
  qrImage.style.display = 'block';
  downloadLink.href = qrDataUrl;
  downloadLink.style.display = 'block';
}

async function callApi(endpoint, body) {
  workingArea.value = '';
  outputText.value = '';
  qrImage.style.display = 'none';
  downloadLink.style.display = 'none';
  setStatus('Contacting server...');
  printToWorkingArea(`📤 Sending to ${API_BASE}${endpoint}: ${JSON.stringify(body)}`);

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    printToWorkingArea(`📥 Response status: ${res.status}`);

    let data;
    try {
      data = await res.json();
    } catch {
      const rawText = await res.text();
      printToWorkingArea(`❌ Non-JSON response: ${rawText}`);
      throw new Error(`Server returned non‑JSON (status ${res.status})`);
    }

    if (!res.ok) {
      printToWorkingArea(`❌ Server error: ${data.error || 'Unknown'}`);
      throw new Error(data.error || `Status ${res.status}`);
    }

    if (endpoint === '/api/encrypt') {
      // Show double-encrypted hex in the textarea
      outputText.value = data.doubleEncryptedHex;

      // Display QR code
      if (data.qrCodeDataUrl) {
        displayQRCode(data.qrCodeDataUrl);
      }

      // Print working steps for both passes
      printToWorkingArea(`🔑 Table Key: ${data.tableKey}`);
      printToWorkingArea(`\n=== FIRST PASS ===`);
      printToWorkingArea(`Result: ${data.firstPassResult}`);
      data.firstPassSteps.forEach((s, idx) => {
        printToWorkingArea(`\n--- First Pass Char #${idx+1}: '${s.character}' ---`);
        printToWorkingArea(`  9‑Digit Code: ${s.code}`);
        printToWorkingArea(`  First 3: ${s.first3}   Next 2: ${s.next2}   Last 4: ${s.last4}`);
        // ... You can optionally print all step details like before ...
        printToWorkingArea(`  Step16 finalHex: ${s.step16.finalHex}`);
      });

      printToWorkingArea(`\n=== SECOND PASS (on first pass hex) ===`);
      printToWorkingArea(`Double‑encrypted result: ${data.doubleEncryptedHex}`);
      data.secondPassSteps.forEach((s, idx) => {
        printToWorkingArea(`\n--- Second Pass Char #${idx+1}: '${s.character}' ---`);
        printToWorkingArea(`  9‑Digit Code: ${s.code}`);
        printToWorkingArea(`  Step16 finalHex: ${s.step16.finalHex}`);
      });
    } else if (endpoint === '/api/decrypt') {
      outputText.value = data.result;
      printToWorkingArea('✅ Decrypted (old method)');
    }

    setStatus('Success');
  } catch (err) {
    printToWorkingArea(`❌ Error: ${err.message}`);
    setStatus(`Error: ${err.message}`, true);
  }
}

encryptBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { setStatus('Please enter some text', true); return; }
  callApi('/api/encrypt', { text });
});

decryptBtn.addEventListener('click', () => {
  const ciphertext = inputText.value.trim();
  if (!ciphertext || ciphertext.length % 9 !== 0) {
    setStatus('Old decrypt requires 9‑digit codes.', true);
    return;
  }
  callApi('/api/decrypt', { ciphertext });
});
