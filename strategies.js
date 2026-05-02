/* OMNI-BLACK SCALPER CORE V18
   MODE: High-Frequency Scalping (1M/5M)
   LOGIC: Liquidity Inducement -> MSS -> FVG Entry
   ACCURACY: Forced 100% Confluence Filter
*/

let KEY = localStorage.getItem('omni_key_v18') || "";
let BAL = parseFloat(localStorage.getItem('omni_bal_v18')) || 1000;
let RSK = parseFloat(localStorage.getItem('omni_risk_v18')) || 1;
let files = [null, null, null, null];

// Sync UI on load
if (KEY) {
    document.getElementById('statusDot').className = "w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_20px_#10b981] animate-pulse";
    document.getElementById('riskDisp').innerText = `SCALP MODE ACTIVE | ${RSK}% RISK`;
}

function saveConfig() {
    localStorage.setItem('omni_key_v18', document.getElementById('kIn').value.trim());
    localStorage.setItem('omni_bal_v18', document.getElementById('bIn').value || 1000);
    localStorage.setItem('omni_risk_v18', document.getElementById('rIn').value || 1);
    location.reload();
}

function sync(i) {
    files[i] = document.getElementById(`i${i}`).files[0];
    document.getElementById(`box${i}`).classList.add('has-file');
    document.getElementById(`ic${i}`).className = "fa-solid fa-bolt-lightning text-indigo-500 text-5xl mb-2";
}

async function executeSurgicalScan() {
    if (!KEY || files.includes(null)) return alert("Connect All 4 Tiers for A+ Precision.");
    const btn = document.getElementById('goBtn'); 
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> HUNTING LIQUIDITY...`;
    
    try {
        const parts = await Promise.all(files.map(f => {
            return new Promise(r => {
                const rd = new FileReader(); rd.readAsDataURL(f);
                rd.onload = () => r({ inlineData: { mimeType: f.type, data: rd.result.split(',')[1] } });
            });
        }));

        // SCALPING-SPECIFIC EINSTEIN PROMPT
        const prompt = `Act as an Elite 1-Minute Scalper. 
        1. STRATEGY AUDIT: Check for Supply/Demand zones, S&R Flips, and SMC Liquidity Sweeps.
        2. SCALP FILTER: Look for "Retail Traps" (Inducement). Only trigger if 1M timeframe shows a Market Structure Shift (MSS) after a sweep.
        3. GLOBAL SYNC: 1H Context must match 1M direction. DXY must confirm.
        4. ACCURACY: 100% precision. Use Y-axis price data. Reject if spread is too high or setup is messy.
        5. LOGIC: Exactly 12 words. 
        Format: S: [Strategy] C: [Context] T: [Trigger]
        JSON: {"p": "PAIR", "b": "BUY|SELL|WAIT", "e": number, "s": number, "t": number, "tr": number, "l": "S: ... C: ... T: ..."}`;

        const req = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...parts] }] })
        });

        const raw = await req.json();
        const res = JSON.parse(raw.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/)[0]);
        
        renderResults(res);

    } catch (e) {
        alert("Neural Sync Error. Check API/Data.");
    } finally {
        btn.innerText = "Execute A+ Global Scan";
    }
}

function renderResults(d) {
    document.getElementById('outPanel').classList.remove('hidden');
    const b = document.getElementById('biasTxt'); 
    const w = document.getElementById('waitMsg');
    
    b.innerText = d.b;
    if (d.b === "WAIT") {
        w.classList.remove('hidden'); 
        w.innerText = `READY AT TRIGGER: ${d.tr || '--'}`;
        b.className = "glow-bias text-amber-500";
    } else {
        w.classList.add('hidden');
        b.className = d.b === 'BUY' ? "glow-bias text-emerald-500" : "glow-bias text-rose-500";
    }

    document.getElementById('pairDisp').innerText = d.p;
    document.getElementById('entVal').innerText = d.e || "--";
    document.getElementById('slVal').innerText = d.s || "--";
    document.getElementById('tpVal').innerText = d.t || "--";
    document.getElementById('logicSummary').innerText = d.l;

    // SCALPING RISK CALCULATION
    const dist = Math.abs(d.e - d.s);
    const riskCash = BAL * (RSK / 100);
    // Scalping lot sizing: account for small moves
    document.getElementById('lotVal').innerText = dist > 0 ? (riskCash / (dist * 10)).toFixed(2) : "0.01";
    document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
}
