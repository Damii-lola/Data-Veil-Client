const API_BASE = 'https://data-veil-api.onrender.com';   // your Render URL

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const encryptBtn = document.getElementById('encryptBtn');
const statusEl = document.getElementById('status');
const qrImage = document.getElementById('qrImage');
const downloadLink = document.getElementById('downloadLink');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff6b6b' : '#aaa';
}

function displayQRCode(qrDataUrl) {
  qrImage.src = qrDataUrl;
  qrImage.style.display = 'block';
  downloadLink.href = qrDataUrl;
  downloadLink.style.display = 'block';
}

async function encrypt() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('Please enter some text', true);
    return;
  }

  // Reset output
  outputText.value = '';
  qrImage.style.display = 'none';
  downloadLink.style.display = 'none';
  setStatus('Encrypting...');

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
    outputText.value = data.encryptedHex;

    if (data.qrCodeDataUrl) {
      displayQRCode(data.qrCodeDataUrl);
    }

    setStatus('Success');
  } catch (err) {
    setStatus(`Error: ${err.message}`, true);
  }
}

encryptBtn.addEventListener('click', encrypt);
