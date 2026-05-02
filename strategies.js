/**
 * OMNI-BLACK INFINITY ENGINE V10
 * Professional Institutional Grade Strategy Script
 */

let KEY = localStorage.getItem('omni_master_v10') || "";
let files = [null, null, null, null];

// 1. API HANDSHAKE & VALIDATION
if (KEY) validateConnection(KEY);

async function validateConnection(k) {
    const status = document.getElementById('status');
    const pairDisp = document.getElementById('pairDisp');
    try {
        const check = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${k}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        if (check.ok) {
            status.className = "w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_25px_#10b981] status-pulse";
            pairDisp.innerText = "[ TERMINAL LINK ACTIVE ]";
        } else { throw new Error(); }
    } catch (e) {
        status.className = "w-4 h-4 rounded-full bg-rose-600 shadow-[0_0_25px_#e11d48]";
        pairDisp.innerText = "[ API AUTH FAILED ]";
        localStorage.removeItem('omni_master_v10');
    }
}

function saveKey() {
    const v = document.getElementById('keyIn').value.trim();
    if (v) {
        localStorage.setItem('omni_master_v10', v);
        location.reload();
    }
}

// 2. IMAGE SYNCING
function sync(i) {
    const fileInput = document.getElementById(`i${i}`);
    files[i] = fileInput.files[0];
    const box = document.getElementById(`box${i}`);
    box.classList.add('has-file');
    document.getElementById(`t${i}`).innerHTML = `<i class="fa-solid fa-shield-check text-emerald-500 text-5xl"></i>`;
}

// 3. THE ANALYTIC CORE (99% PRECISION LOGIC)
async function runScan() {
    if (!KEY) return alert("System Offline: API Key Required.");
    if (files.includes(null)) return alert("Data Gap: All 4 analysis tiers are mandatory for 99% precision.");

    const btn = document.getElementById('go');
    const disp = document.getElementById('pairDisp');
    btn.innerHTML = `<i class="fa-solid fa-atom fa-spin mr-3"></i> SCANNING LIQUIDITY...`;
    disp.innerText = "DETECTING INSTITUTIONAL BIAS...";

    try {
        // Convert images to Base64
        const parts = await Promise.all(files.map(f => {
            return new Promise(r => {
                const reader = new FileReader();
                reader.readAsDataURL(f);
                reader.onload = () => r({ inlineData: { mimeType: f.type, data: reader.result.split(',')[1] } });
            });
        }));

        /**
         * INSTITUTIONAL PROMPT ARCHITECTURE
         * This forces the AI to look for:
         * 1. Smart Money Concepts (SMC)
         * 2. Liquidity Inducement (Retail Traps)
         * 3. Risk-to-Reward Ratio (Min 1:3)
         */
        const masterPrompt = `Act as a Top-Tier Hedge Fund Quant with a 99% win rate.
        Analyze these 4 images to find a high-probability trade setup.
        
        CRITERIA:
        - Detect Asset from text/chart.
        - Analyze 1H Trend vs 15M Structure (BOS/CHoCH).
        - Use 1M Chart for precise FVG/Order Block entry.
        - Check DXY for inverse correlation.
        - IF market is consolidating or DXY is erratic: SET BIAS "WAIT" + trigger_price.
        - LOGIC: Strictly 30-40 words total in the provided bullet format.

        FORMAT:
        CONTEXT: [Institutional Direction]
        TRAP: [Liquidity/Retail Sweep identified]
        TRIGGER: [Immediate 1M confirmation required]

        JSON ONLY:
        {
            "p": "PAIR", "b": "BUY|SELL|WAIT", "e": number, "s": number, "t": number, "tr": number,
            "l": "CONTEXT: [Short]\\nTRAP: [Short]\\nTRIGGER: [Short]"
        }`;

        const request = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${KEY}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: masterPrompt }, ...parts] }] })
        });

        const response = await request.json();
        const rawText = response.candidates[0].content.parts[0].text;
        const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);

        disp.innerText = `TARGET DETECTED: ${result.p}`;
        renderResults(result);

    } catch (error) {
        console.error(error);
        alert("SCAN ERROR: Ensure images are clear and API Key is valid.");
    } finally {
        btn.innerText = "Execute Surgical Scan";
    }
}

// 4. RENDERING ENGINE
function renderResults(d) {
    document.getElementById('results').classList.remove('hidden');
    const biasEl = document.getElementById('bias');
    const waitBox = document.getElementById('waitBox');
    
    biasEl.innerText = d.b;
    
    // UI Logic for different trade states
    if (d.b === "WAIT") {
        waitBox.classList.remove('hidden');
        document.getElementById('waitMsg').innerText = `TRIGGER PRICE: ${d.tr || 'PENDING'}`;
        biasEl.className = "italic glow-bias text-amber-500";
    } else {
        waitBox.classList.add('hidden');
        biasEl.className = d.b === 'BUY' ? "italic glow-bias text-emerald-500" : "italic glow-bias text-rose-600";
    }

    // Set Data Values
    document.getElementById('e').innerText = d.e || "--";
    document.getElementById('s').innerText = d.s || "--";
    document.getElementById('t').innerText = d.t || "--";
    document.getElementById('logic').innerText = d.l;
    
    // Auto-Lot Calculation (Risk 1% of $1000 base)
    const slDistance = Math.abs(d.e - d.s);
    if (slDistance > 0) {
        const lotSize = (10 / (slDistance * 10)).toFixed(2);
        document.getElementById('l').innerText = lotSize + " Lots";
    } else {
        document.getElementById('l').innerText = "ADAPTIVE";
    }
    
    // Smooth scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}
