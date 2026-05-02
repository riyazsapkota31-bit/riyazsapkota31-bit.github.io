/**
 * OMNI-REAL | INFINITY SCALPER V8.2
 * FIXED: fileToPart undefined & Connection Protocol
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-1.5-flash-latest";

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI RECOVERY: PREVENTS DATA GAP ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const input = document.getElementById(`img${idx}`);
    const content = document.getElementById(`content${idx}`);
    
    if (input.files && input.files[0]) {
        box.classList.add('has-file');
        // Visual indicator that doesn't clear the input field
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                <span style="color:white; font-size:1.5rem; font-weight:bold;">✓</span>
            </div>
            <p style="color:#10b981; font-weight:bold; font-size:0.75rem; letter-spacing:1px;">CHART SYNCED</p>
        `;
    }
}

// --- MASTER CONTROL INTERFACE ---
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

// --- CORE SCAN ENGINE ---
// Explicitly defining fileToPart to fix the terminal error
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
    
    // Direct selection to ensure no "Data Gaps"
    const f0 = document.getElementById('img0').files[0];
    const f1 = document.getElementById('img1').files[0];
    const f2 = document.getElementById('img2').files[0];
    const f3 = document.getElementById('img3').files[0];
    
    if (!f0 || !f1 || !f2 || !f3) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "SYNCHRONIZING ANALYTICS...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all([f0, f1, f2, f3].map(fileToPart));
        
        const prompt = `Act as an expert technical analyst. Analyze 4 charts for SMC confluence. 
        If bias is not clear, return "WAIT". If "WAIT", provide a "Watch Level" price.
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Connection Failed");
        }

        const data = await response.json();
        const resText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(resText.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res, resultBox);
    } catch (e) {
        alert("TERMINAL ERROR: " + e.message); // Details connection errors
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
        actionTxt.innerText = "WAIT & WATCH"; //
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.support || res.entry} | ${res.logic}`;
        ['entText','slText','tpText','lotText','supText','resText'].forEach(id => document.getElementById(id).innerText = "---");
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
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
