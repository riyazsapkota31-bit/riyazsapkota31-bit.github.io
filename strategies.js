/**
 * OMNI-REAL | PRECISION V11 (COMPLETE SYSTEM REPAIR)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// CORE FIX: This ID is verified for the v1beta endpoint
const MODEL = "gemini-1.5-flash-latest"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DYNAMICS (REF: 1000040692.jpg) ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const fileInput = document.getElementById(`img${idx}`);
    
    if (fileInput && fileInput.files.length > 0) {
        // Apply the "Uploaded" aesthetic from your picture
        box.classList.add('has-file');
        box.style.border = "2px solid #10b981";
        box.style.background = "rgba(16, 185, 129, 0.05)";
        
        const content = box.querySelector('center') || box;
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:10px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                <span style="color:white; font-size:1.5rem; font-weight:bold;">✓</span>
            </div>
            <p style="color:#10b981; font-weight:bold; font-size:0.75rem; letter-spacing:1px;">CHART SYNCED</p>
        `;
    }
}

// --- MASTER CONTROL ---
function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    if (!val || val.includes("•")) return alert("Invalid Terminal Key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

function lockUI() {
    const input = document.getElementById('apiInput');
    if (input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
    }
}

// --- TRADING ENGINE (REPAIRED) ---

// This function was missing, causing the "not defined" error
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ 
            inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } 
        });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `Act as an SMC Analyst. Analyze 4 charts for structural alignment. 
        If mismatch, return bias 'WAIT'. 
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message); // Catches "Model Not Found"
        }

        const data = await response.json();
        const rawJson = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(rawJson);

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

    if (res.bias === "WAIT") {
        actionTxt.innerText = "NO TRADE";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.entry || "Pending"} | ${res.logic}`;
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1;
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? ((bal * (risk/100)) / (slDist * 10)).toFixed(2) : "0.10";

        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = res.tp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        logicTxt.innerText = res.logic;
    }
    resultBox.scrollIntoView({ behavior: 'smooth' });
}
