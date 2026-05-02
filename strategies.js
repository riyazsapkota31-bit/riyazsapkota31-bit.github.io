/**
 * OMNI-REAL | PRECISION V11 (CORE ENGINE REPAIR)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// STABLE ENGINE: Using the 8b flash variant for maximum v1beta compatibility
const MODEL = "gemini-1.5-flash-8b"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DYNAMICS (TICK CONFIRMED) ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const fileInput = document.getElementById(`img${idx}`);
    
    if (fileInput && fileInput.files.length > 0) {
        box.classList.add('has-file');
        box.style.border = "2px solid #10b981";
        
        const content = box.querySelector('center') || box;
        content.innerHTML = `
            <div style="font-size:2.5rem; margin-bottom:10px;">✅</div>
            <p style="color:#10b981; font-weight:bold; font-size:0.8rem;">CHART LOADED</p>
        `;
    }
}

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    
    // API LIMIT: No fixed length, but prevents saving mask characters
    if (!val || val.includes("•")) return alert("Please enter a valid Terminal Key.");
    
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
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

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // CONFLUENCE PROMPT
        const prompt = `Act as an Institutional SMC Analyst. Analyze 4 charts. 
        If HTF/LTF mismatch, return bias 'WAIT'.
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"logic":"string"}`;

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

    if (res.bias === "WAIT") {
        actionTxt.innerText = "NO TRADE";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
        logicTxt.innerText = `WATCH LEVEL: ${res.entry || "Pending"} | ${res.logic}`;
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        // RISK MATH
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

// Side Drawer Helpers
function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}

function lockUI() {
    const input = document.getElementById('apiInput');
    if (input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
    }
}
