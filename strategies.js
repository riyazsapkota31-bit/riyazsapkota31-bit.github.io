let API_KEY = localStorage.getItem('omni_api_v3') || "";
// CRITICAL: Added '-exp' to match the experimental 2.5 series
const MODEL = "gemini-2.5-flash-lite-exp"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- UI DYNAMICS ---
function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
    // Ensure inputs are interactive
    ['bal', 'risk', 'apiInput'].forEach(id => {
        const el = document.getElementById(id);
        if(el) { el.disabled = false; el.style.pointerEvents = 'auto'; }
    });
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val || val.includes("•")) return alert("Enter a valid key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

function lockUI() {
    const input = document.getElementById('apiInput');
    if(input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
    }
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
    }
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
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        const prompt = `Perform high-precision SMC/ICT analysis. 
        If HTF/LTF trend mismatch or consolidation, return bias 'WAIT'.
        Return ONLY raw JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"score":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        // ERROR-PROOFING: Handle the 429 error from your dashboard
        if (response.status === 429) {
            alert("QUOTA EXHAUSTED: Please wait 2-5 minutes for the API to reset.");
            return;
        }

        if (!response.ok) {
            const errData = await response.json();
            alert(`API ERROR: ${errData.error.message}`);
            return;
        }

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res);

    } catch (e) {
        console.error(e);
        alert("ENGINE ERROR: Model output was unreadable. Check your internet.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderOutput(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    
    resultBox.classList.remove('hidden');
    actionTxt.innerText = res.bias === "WAIT" ? "NO TRADE" : res.bias;
    document.getElementById('logicText').innerText = res.logic;

    if (res.bias === "WAIT") {
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
        ['entText','slText','tpText','lotText'].forEach(id => document.getElementById(id).innerText = "---");
    } else {
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        // Dynamic Math
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1;
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? ((bal * (risk/100)) / (slDist * 10)).toFixed(2) : "0.10";

        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = res.tp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
    }
    resultBox.scrollIntoView({ behavior: 'smooth' });
}
