/**
 * OMNI-REAL | INFINITY SCALPER V8.2 (CORE REPAIR)
 * FIX: Data Gap Error & fileToPart undefined
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-1.5-flash-latest"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- FIXED UI DYNAMICS: PRESERVES INPUT DATA ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const input = document.getElementById(`img${idx}`);
    
    if (input.files && input.files[0]) {
        box.classList.add('has-file');
        // We update only the UI display, NOT the input element itself
        const contentDiv = document.getElementById(`content${idx}`);
        if(contentDiv) {
            contentDiv.innerHTML = `
                <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                    <span style="color:white; font-size:1.5rem; font-weight:bold;">✓</span>
                </div>
                <p style="color:#10b981; font-weight:bold; font-size:0.75rem; letter-spacing:1px;">CHART SYNCED</p>
            `;
        }
    }
}

// --- MASTER CONTROL & API ACCESS ---
function lockUI() {
    const input = document.getElementById('apiInput');
    const lockBtn = document.getElementById('lockBtn');
    const editBtn = document.getElementById('editBtn');
    if(lockBtn) lockBtn.classList.add('hidden');
    if(editBtn) editBtn.classList.remove('hidden');
    input.value = "••••••••••••••••••••";
    input.disabled = true;
    input.classList.add('opacity-40');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
    input.value = "";
    input.disabled = false;
    input.classList.remove('opacity-40');
    input.focus();
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
    
    // Select the actual input elements directly
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
        
        const prompt = `System: Expert Multi-Strategy SMC Analyst. Analyze 4 charts for Confluence. 
        If charts are unclear or DXY is conflicting, return bias "WAIT". 
        If waiting, identify a "Watch Level" price.
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "API Error");
        }

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res, resultBox);
    } catch (e) {
        alert("TERMINAL ERROR: " + e.message);
        console.error(e);
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
        actionTxt.innerText = "WAIT & WATCH";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.support || "Pending"} | ${res.logic}`;
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        const bal = parseFloat(document.getElementById('bal')?.value) || 10000;
        const risk = parseFloat(document.getElementById('risk')?.value) || 1.0;
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
