/**
 * OMNI-REAL | PRECISION V11 (DYNAMIC RR + NO-TRADE + LOCK/EDIT + TICK UI)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

window.onload = function() {
    if (API_KEY) lockUI(); 
};

// --- TICK UI LOGIC ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const label = document.getElementById(`label${idx}`);
    const icon = document.getElementById(`icon${idx}`);

    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        label.classList.add('hidden'); // Hide the "Upload" label
        icon.classList.remove('hidden'); // Show the green checkmark
    }
}

// --- MASTER CONTROL UI ---
function lockUI() {
    const input = document.getElementById('apiInput');
    const lockBtn = document.getElementById('lockBtn');
    const editBtn = document.getElementById('editBtn');

    input.value = "********************";
    input.disabled = true;
    input.classList.add('opacity-50');
    lockBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    const lockBtn = document.getElementById('lockBtn');
    const editBtn = document.getElementById('editBtn');

    input.value = ""; // Clear for new entry
    input.disabled = false;
    input.classList.remove('opacity-50');
    input.focus();
    lockBtn.classList.remove('hidden');
    editBtn.classList.add('hidden');
}

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    if (val === "" || val.includes("****")) return alert("Please enter a valid API key.");
    
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    alert("SYSTEM LOCKED: Key Synced.");
    lockUI();
    toggleDrawer();
}

// --- CORE UTILS ---
function toggleDrawer() { 
    document.getElementById('sideDrawer').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('hidden'); 
}
function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

// --- CORE SCAN ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("Security Error: Sync Key in Master Control.");
    
    const bal = parseFloat(document.getElementById('bal').value) || 10000;
    const riskPercent = parseFloat(document.getElementById('risk').value) || 1.0;
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Upload all 4 chart tiers for analysis.");

    btn.innerText = "EVALUATING MARKET QUALITY...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // Institutional Bias Prompt with No-Trade Logic
        const prompt = `Act as an Institutional Trader. Analyze these 4 charts.
        1. If market is sideways, choppy, or lacks clear trend alignment, return: {"bias":"WAIT","logic":"Market in consolidation"}
        2. If setup exists, align with 1H/15M Trend. Target logical Draw on Liquidity.
        3. Min 1.5x expansion, up to 8.0x structural extension.
        Return ONLY JSON: {"strategy":"OMNI-V11","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // --- SAFETY FILTER (NO TRADE LOGIC) ---
        if (res.bias === "WAIT") {
            document.getElementById('strategyType').innerText = "SAFETY FILTER ACTIVE";
            document.getElementById('actionText').innerText = "NO TRADE";
            document.getElementById('actionText').className = "text-4xl font-black italic text-slate-500 uppercase tracking-tighter";
            document.getElementById('logicText').innerText = res.logic;
            ['entText','slText','tpText','lotText'].forEach(id => document.getElementById(id).innerText = "---");
            resultBox.classList.remove('hidden');
            return; 
        }

        // --- DYNAMIC RR CALCULATION ---
        const slDist = Math.abs(res.entry - res.sl);
        const riskCash = bal * (riskPercent / 100);
        let finalTp = res.tp;

        const currentRR = Math.abs(res.entry - res.tp) / slDist;
        if (currentRR < 1.5) {
            finalTp = res.bias === 'BUY' ? (res.entry + (slDist * 1.5)) : (res.entry - (slDist * 1.5));
        }

        const lotSize = slDist > 0 ? (riskCash / (slDist * 10)).toFixed(2) : "0.10";

        // Update UI Results
        document.getElementById('strategyType').innerText = res.strategy;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic uppercase tracking-tighter ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = finalTp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('supText').innerText = res.support.toFixed(2);
        document.getElementById('resText').innerText = res.resistance.toFixed(2);
        document.getElementById('logicText').innerText = res.logic;

        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("ENGINE ERROR: " + e.message);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.disabled = false;
    }
}
