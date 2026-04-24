const API_BASE = 'https://data-veil-api.onrender.com';   // <-- YOUR RENDER URL

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const workingArea = document.getElementById('workingArea');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const statusEl = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff6b6b' : '#aaa';
}

// Display step details in the Working Area
function printToWorkingArea(text) {
  workingArea.value += text + '\n';
  workingArea.scrollTop = workingArea.scrollHeight;
}

async function callApi(endpoint, body) {
  workingArea.value = '';  // clear working area
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

    // ---- Encryption success ----
    if (endpoint === '/api/encrypt') {
      outputText.value = data.result;
      printToWorkingArea(`🔑 Table Key: ${data.tableKey}`);
      printToWorkingArea(`✅ Encryption complete – ${data.steps.length} character(s)\n`);

      // Print each character's step‑by‑step
      data.steps.forEach((s, idx) => {
        printToWorkingArea(`\n--- Character #${idx+1}: '${s.character}' ---`);
        printToWorkingArea(`  9‑Digit Code: ${s.code}`);
        printToWorkingArea(`  First 3: ${s.first3}   Next 2: ${s.next2}   Last 4: ${s.last4}`);
        printToWorkingArea(`  Step3: a=${s.step3.a} b=${s.step3.b} c=${s.step3.c}   a+b=${s.step3.sum_ab}   (a+b)*c=${s.step3.prod}   a+b+c=${s.step3.sum_abc}`);
        printToWorkingArea(`         prod%sum_abc=${s.step3.mod1}   sum_abc%prod=${s.step3.mod2}   carry=${s.step3.carry}`);
        printToWorkingArea(`  Step4: carry * mid2 = ${s.step3.carry} * ${s.step4.midVal} = ${s.step4.step4res}`);
        printToWorkingArea(`  Step5: Set1=[${s.step5.set1}] Set2=[${s.step5.set2}]  Diffs=[${s.step5.diffs}]  Sum=${s.step5.scrambleSum}`);
        printToWorkingArea(`  Step6: ${s.step5.scrambleSum} ÷ ${s.step4.step4res} = ${s.step6.quotient} (drop decimal)`);
        printToWorkingArea(`  Step7: base5(${s.step6.quotient})='${s.step7.base5Str}' → treat as decimal ${s.step7.base5AsDecimal} × ${s.first3} = ${s.step7.product}`);
        printToWorkingArea(`  Step8: sumDigits(base5)=${s.step8.sumBase5} -> chain: divisor1=${s.step8.divisor1} mod1=${s.step8.mod1_8} div1_8=${s.step8.div1_8} mod2=${s.step8.mod2_8} div2_8=${s.step8.div2_8} divisor2=${s.step8.divisor2} mod3=${s.step8.mod3_8}  chainSum=${s.step8.chainSum} chainFinal=${s.step8.chainFinal}`);
        printToWorkingArea(`  Step9: weave(start=${s.step8.divisor1}, ${s.step8.chainFinal}, ${s.step8.div2_8}) = ${s.step9.weaved}`);
        printToWorkingArea(`  Step10: weaved→base5: ${s.step10.base5_2} → treat as dec→base7: ${s.step10.base7} → treat as dec→hex: ${s.step10.hex}`);
        printToWorkingArea(`  Step11: sig=${s.step11.sig}   wrapped: ${s.step11.wrapped}`);
        printToWorkingArea(`  Step12: first4=${s.step12.first4} last4=${s.step12.last4part}   swapped: ${s.step12.swapped}`);
        printToWorkingArea(`  Step13: '0x${s.step12.swapped}' as hex → base10: ${s.step13.base10.slice(0,40)}…`);
        printToWorkingArea(`  Step14: base10 → base4: ${s.step14.base4.slice(0,40)}…`);
        printToWorkingArea(`  Step15: base4 string treated as decimal → base9: ${s.step15.base9.slice(0,40)}…`);
        printToWorkingArea(`  Step16: base9 string treated as decimal → hex: ${s.step16.finalHex}`);
        printToWorkingArea(`  >>> FINAL PIECE: ${s.step16.finalHex}`);
      });

      printToWorkingArea(`\n🔒 FULL ENCRYPTED OUTPUT:\n${data.result}`);
    } else if (endpoint === '/api/decrypt') {
      outputText.value = data.result;
      printToWorkingArea('✅ Decrypted (old method)');
    }

    setStatus('Success');
  } catch (err) {
    printToWorkingArea(`❌ Error: ${err.message}`);
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
  if (!ciphertext || ciphertext.length % 9 !== 0) {
    setStatus('Old decrypt requires 9‑digit codes.', true);
    return;
  }
  callApi('/api/decrypt', { ciphertext });
});
