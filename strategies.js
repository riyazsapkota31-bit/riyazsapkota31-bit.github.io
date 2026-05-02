/**
 * OMNI-REAL | PRECISION V11 (FINAL STABLE ENGINE)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// FIX: Using stable identifier to resolve "Model Not Found"
const MODEL = "gemini-1.5-flash-latest"; 

// --- MASTER CONTROL (REPAIRED) ---

/**
 * FIXED: Removed the automatic 'lock' on load so you can always 
 * enter your key in the Master Control drawer.
 */
function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    
    if (!val) return alert("Please enter your API Access Key.");
    
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    
    // Simple visual mask after saving
    input.value = "••••••••••••••••••••";
    toggleDrawer();
}

function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}

// --- UI DYNAMICS (GREEN TICK SYNC) ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const fileInput = document.getElementById(`img${idx}`);
    
    if (fileInput && fileInput.files.length > 0) {
        box.classList.add('has-file');
        box.style.border = "2px solid #10b981";
        
        // Updates the UI to show the 'Synced' state
        const content = box.querySelector('center') || box;
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                <span style="color:white; font-size:1.5rem; font-weight:bold;">✓</span>
            </div>
            <p style="color:#10b981; font-weight:bold; font-size:0.75rem; letter-spacing:1px;">CHART SYNCED</p>
        `;
    }
}

// --- TRADING ENGINE (FIXED) ---

/** * REPAIR: Restored fileToPart to resolve 'not defined' error
 */
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
    if (!API_KEY) return alert("System Offline: Enter API Key in Master Control.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Please upload all 4 charts.");

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `System: High-Precision SMC Analyst. 
        Analyze 4 charts for structural alignment. 
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
        logicTxt.innerText = res.logic;
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        // Dynamic Risk Math
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
