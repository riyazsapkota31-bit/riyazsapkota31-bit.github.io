/**
 * OMNI-REAL | INFINITY SCALPER V8.2
 * FIXED: Data Gap Protection & Missing fileToPart Function
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-1.5-flash-latest"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DYNAMICS (FIXED TO PREVENT DATA GAP) ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const input = document.getElementById(`img${idx}`);
    const content = document.getElementById(`content${idx}`);
    
    if (input.files && input.files[0]) {
        box.classList.add('has-file');
        // We update ONLY the content span to avoid deleting the <input> element
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                <span style="color:white; font-size:1.5rem; font-weight:bold;">✓</span>
            </div>
            <p style="color:#10b981; font-weight:bold; font-size:0.75rem; letter-spacing:1px;">CHART SYNCED</p>
        `;
    }
}

// --- MASTER CONTROL (RECOVERY MODE) ---
function lockUI() {
    const apiInput = document.getElementById('apiInput');
    apiInput.value = "••••••••••••••••••••";
    apiInput.disabled = true;
    apiInput.classList.add('opacity-40');
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

function enableEdit() {
    const apiInput = document.getElementById('apiInput');
    apiInput.value = "";
    apiInput.disabled = false;
    apiInput.classList.remove('opacity-40');
    apiInput.focus();
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
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
}

// --- CORE ENGINE (FIXED CRITICAL DEFINITIONS) ---
// This function fixes the "fileToPart is not defined" error
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: file.type, data: reader.result.split(',')[1] } });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    
    // Selecting files directly by ID to ensure no data loss
    const files = [
        document.getElementById('img0').files[0],
        document.getElementById('img1').files[0],
        document.getElementById('img2').files[0],
        document.getElementById('img3').files[0]
    ];
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING MULTI-STRATEGY...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `System: Expert Multi-Strategy Analyst. Analyze 4 charts for structural confluence. 
        1. If HTF/LTF/DXY disagree, return bias "WAIT". 
        2. If "WAIT", identify a "Watch Level" price in the logic string.
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) throw new Error("API Connection Failed");

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res, resultBox);
    } catch (e) {
        alert("TERMINAL ERROR: " + e.message);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderOutput(res, resultBox) {
    resultBox.classList.remove('hidden');
    const actionTxt = document.getElementById('actionText');
    const logicTxt = document.getElementById('logicText');

    if (res.bias === "WAIT") {
        actionTxt.innerText = "WAIT & WATCH"; // Implements Watch Level
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.support || res.entry} | ${res.logic}`;
        ['entText','slText','tpText','lotText','supText','resText'].forEach(id => document.getElementById(id).innerText = "---");
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        // Auto-Risk Calculation
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? ((bal * (risk/100)) / (slDist * 10)).toFixed(2) : "0.10";

        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = res.tp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('supText').innerText = res.support?.toFixed(2) || "---";
        document.getElementById('resText').innerText = res.resistance?.toFixed(2) || "---";
        logicTxt.innerText = res.logic;
    }
    resultBox.scrollIntoView({ behavior: 'smooth' });
}
