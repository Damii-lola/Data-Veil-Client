const API_BASE = 'https://data-veil-api.onrender.com';

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
  console.log(`📤 ${API_BASE}${endpoint}`, body);

  try {
    const res = await fetch(API_BASE + endpoint, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
    });
    console.log(`📥 status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);

    if (endpoint === '/api/encrypt') {
      outputText.value = data.result;
      console.log('🔑 Table Key:', data.tableKey);
      console.log(`✅ Encrypted ${data.steps.length} character(s)`);
      // Build a table showing every step
      const tableRows = data.steps.map(s => ({
        Char: s.character,
        '9-digit': s.code,
        'First3': s.first3,
        'Next2': s.next2,
        'Last4': s.last4,
        'Step3 carry': s.step3.carry,
        'Step4 result': s.step4.result,
        'Set1': s.step5.set1.join(', '),
        'Set2': s.step5.set2.join(', '),
        'Diffs': s.step5.diffs.join(', '),
        'Scramble Sum': s.step5.scrambleSum,
        'Step6 Quotient': s.step6.quotient,
        'Base5': s.step7.base5Str,
        'Base5 as dec': s.step7.base5AsDecimal,
        'Step7 product': s.step7.product
      }));
      console.table(tableRows);
    } else {
      outputText.value = data.result;
      console.log('✅ Decrypted');
    }
    setStatus('Success');
  } catch (err) {
    console.error('❌', err);
    setStatus(`Error: ${err.message}`, true);
    outputText.value = '';
  }
}

encryptBtn.addEventListener('click', () => {
  const text = inputText.value.trim();
  if (!text) { setStatus('Enter text', true); return; }
  callApi('/api/encrypt', { text });
});

decryptBtn.addEventListener('click', () => {
  const ciphertext = inputText.value.trim();
  if (!ciphertext || ciphertext.length%9!==0) { setStatus('Invalid ciphertext', true); return; }
  callApi('/api/decrypt', { ciphertext });
});
