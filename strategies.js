/**
 * OMNI-REAL | PRECISION V11 (ULTRA-DYNAMIC ENGINE)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// STABLE MODEL: Fixed to bypass naming errors
const MODEL = "gemini-1.5-flash"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DYNAMICS ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const label = document.getElementById(`label${idx}`);
    const icon = document.getElementById(`icon${idx}`);

    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        if (label) label.classList.add('hidden');
        if (icon) icon.classList.remove('hidden');
    }
}

function lockUI() {
    const input = document.getElementById('apiInput');
    const lockBtn = document.getElementById('lockBtn');
    const editBtn = document.getElementById('editBtn');
    if (input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
        input.classList.add('opacity-40');
    }
    if (lockBtn) lockBtn.classList.add('hidden');
    if (editBtn) editBtn.classList.remove('hidden');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    const lockBtn = document.getElementById('lockBtn');
    const editBtn = document.getElementById('editBtn');
    if (input) {
        input.value = "";
        input.disabled = false;
        input.classList.remove('opacity-40');
        input.focus();
    }
    if (lockBtn) lockBtn.classList.remove('hidden');
    if (editBtn) editBtn.classList.add('hidden');
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val || val.includes("•")) return alert("Invalid Terminal Key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
    
    // FIX: Ensures Master Control fields are editable
    ['bal', 'risk', 'apiInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;
            el.style.pointerEvents = 'auto';
        }
    });
}

// --- TRADING ENGINE ---
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING INSTITUTIONAL BIAS...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        // MULTI-STRATEGY PROMPT: Includes SMC, ICT, and Price Action
        const prompt = `System: High-Precision SMC Analyst. 
        Analyze 4 charts for structural alignment. 
        1. If HTF/LTF trend mismatch or low volatility, return: {"bias":"WAIT","logic":"Market in consolidation"}
        2. If aligned, identify SMC/ICT POI.
        Return ONLY JSON: {"strategy":"INFINITY-V11","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message);
        }

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res, resultBox);

    } catch (e) {
        console.error(e);
        alert(`TERMINAL ERROR: ${e.message}`);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderOutput(res, resultBox) {
    const actionTxt = document.getElementById('actionText');
    const logicTxt = document.getElementById('logicText');
    
    resultBox.classList.remove('hidden');

    // --- WAIT / WATCH FEATURE ---
    if (res.bias === "WAIT") {
        actionTxt.innerText = "NO TRADE";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.entry || "Pending Setup"} | ${res.logic}`;
        ['entText','slText','tpText','lotText','supText','resText'].forEach(id => document.getElementById(id).innerText = "---");
        return;
    }

    // --- TRADE EXECUTION FEATURE ---
    const slDist = Math.abs(res.entry - res.sl);
    const bal = parseFloat(document.getElementById('bal').value) || 10000;
    const riskVal = bal * (parseFloat(document.getElementById('risk').value) / 100);
    
    // Auto RR Correction for safety
    let tpVal = res.tp;
    if (slDist > 0 && Math.abs(res.entry - tpVal) / slDist < 1.5) {
        tpVal = res.bias === 'BUY' ? res.entry + (slDist * 1.5) : res.entry - (slDist * 1.5);
    }

    const lotSize = slDist > 0 ? (riskVal / (slDist * 10)).toFixed(2) : "0.10";

    document.getElementById('strategyType').innerText = res.strategy;
    actionTxt.innerText = res.bias;
    actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entText').innerText = res.entry.toFixed(5);
    document.getElementById('slText').innerText = res.sl.toFixed(5);
    document.getElementById('tpText').innerText = tpVal.toFixed(5);
    document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
    document.getElementById('supText').innerText = res.support?.toFixed(2) || "---";
    document.getElementById('resText').innerText = res.resistance?.toFixed(2) || "---";
    logicTxt.innerText = res.logic;

    resultBox.scrollIntoView({ behavior: 'smooth' });
}
