let API_KEY = localStorage.getItem('omni_api_v3') || "";
// UPDATED: Using Gemini 2.0 Flash for maximum speed and logic accuracy
const MODEL = "gemini-2.0-flash"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DRAWER CONTROLS ---
function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    if (d && o) { d.classList.toggle('open'); o.classList.toggle('hidden'); }
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        const icon = document.getElementById(`icon${idx}`);
        const label = document.getElementById(`label${idx}`);
        if(icon) icon.classList.remove('hidden');
        if(label) label.classList.add('hidden');
    }
}

function lockUI() {
    const input = document.getElementById('apiInput');
    input.value = "••••••••••••••••••••";
    input.disabled = true;
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    input.value = ""; input.disabled = false;
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val) return alert("Enter key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val; lockUI(); toggleDrawer();
}

// --- IMAGE PROCESSING (Prevents Timeouts) ---
async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 1000 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({ inlineData: { mimeType: "image/jpeg", data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1] } });
            };
        };
    });
}

// --- MAIN EXECUTION ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("Enter API Key in Settings.");
    const btn = document.getElementById('scanBtn');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Upload all 4 charts (1H, 15M, 1M, DXY).");

    btn.innerText = "RUNNING MULTI-STRATEGY ENGINE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        
        // Institutional Prompt based on Claude conversation
        const prompt = `Act as a Senior Institutional Quant. Evaluate these 4 charts using 4 concurrent strategies:
        1. SMC: CHoCH, BOS, Order Blocks, FVGs.
        2. Supply/Demand: Locate fresh 1H zones and 15M confirmations.
        3. Trend: HH/HL on 1H, EMA/Pullback on 15M.
        4. Breakout: 15M range consolidation with 1M retest.

        SCORING RULES (0-10):
        +2 if DXY Correlation confirms.
        +2 if 1H and 15M Timeframes align.
        -3 if price is inside a major HTF counter-trend zone.
        
        MANDATORY: If the highest strategy score is less than 4, you MUST return "WAIT".
        
        JSON FORMAT ONLY: {"strategy":"name","bias":"BUY|SELL|WAIT","entry":num,"sl":num,"tp":num,"score":num,"logic":"max 2 sentences"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(cleanJson);

        renderResults(res);

    } catch (e) {
        alert("TERMINAL ERROR: " + e.message);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

// --- UI RENDERING & RISK CALCULATION ---
function renderResults(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    const scoreBar = document.getElementById('scoreBar');

    // 1. Handle "WAIT" Condition (Reset Data)
    if (res.bias === 'WAIT' || res.score < 4) {
        actionTxt.innerText = "WAIT";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 uppercase";
        document.getElementById('entText').innerText = "---";
        document.getElementById('slText').innerText = "---";
        document.getElementById('tpText').innerText = "---";
        document.getElementById('lotText').innerText = "---";
    } else {
        // 2. Handle Active Signal
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text uppercase ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        document.getElementById('entText').innerText = res.entry.toFixed(2);
        document.getElementById('slText').innerText = res.sl.toFixed(2);
        document.getElementById('tpText').innerText = res.tp.toFixed(2);

        // 3. Dynamic Risk Math (Claude's Pip-Fix)
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const riskPercent = parseFloat(document.getElementById('risk').value) || 1;
        const instrument = document.getElementById('instrument').value;

        let pipMultiplier = 10; // Default Forex
        if (instrument === 'GOLD') pipMultiplier = 100;
        if (instrument === 'BTC') pipMultiplier = 1;

        const pipsAtRisk = Math.abs(res.entry - res.sl);
        const riskAmount = bal * (riskPercent / 100);
        const lotSize = pipsAtRisk > 0 ? (riskAmount / (pipsAtRisk * pipMultiplier)) : 0;

        document.getElementById('lotText').innerText = lotSize.toFixed(2);
    }

    // 4. Update Strategy & Score Bar
    document.getElementById('strategyText').innerText = res.strategy;
    document.getElementById('logicText').innerText = res.logic;
    
    if (scoreBar) {
        const scorePercent = (res.score * 10);
        scoreBar.style.width = scorePercent + "%";
        // Color coding: High = Green, Medium = Amber, Low = Red
        scoreBar.style.backgroundColor = res.score >= 7 ? "#10b981" : (res.score >= 4 ? "#f59e0b" : "#ef4444");
    }

    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth' });
}
