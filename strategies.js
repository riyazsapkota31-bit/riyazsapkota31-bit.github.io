/** * OMNI-REAL | MASTER TERMINAL V8.2
 * AUTO-ROUTING ENGINE & MULTI-MODEL SCANNER
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
let marketData = [null, null, null, null]; 

// FULL COMPATIBILITY LIST: 2.5, 2.0, and 1.5 Models
const MODEL_POOL = [
    "gemini-2.5-flash", 
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash-exp",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-thinking-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
];

window.onload = () => { if (API_KEY) lockUI(); };

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const input = document.getElementById(`img${idx}`);
    const content = document.getElementById(`content${idx}`);
    if (input.files && input.files[0]) {
        marketData[idx] = input.files[0]; 
        box.classList.add('has-file');
        content.innerHTML = `<div style="background:#10b981;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5px;"><i class="fa-solid fa-check text-white text-xs"></i></div><p style="color:#10b981;font-size:0.6rem;font-weight:bold;">SYNCED</p>`;
    }
}

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: file.type, data: reader.result.split(',')[1] } });
    });
}

// --- DIAGNOSTIC: Test which models your key supports ---
async function runModelDiagnostic() {
    if (!API_KEY) return alert("No API Key found. Sync Terminal first.");
    let report = "MODEL COMPATIBILITY REPORT:\n\n";
    const btn = document.getElementById('debugBtn');
    btn.innerText = "TESTING CONNECTIVITY...";

    for (const m of MODEL_POOL) {
        try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
            });
            if (r.ok) report += `✅ ${m}: SUPPORTED\n`;
            else {
                const e = await r.json();
                report += `❌ ${m}: ${e.error.message.includes("not found") ? "VERSION MISMATCH" : "RESTRICTED"}\n`;
            }
        } catch (err) { report += `❌ ${m}: FAILED\n`; }
    }
    alert(report);
    btn.innerText = "DEBUG: TEST API COMPATIBILITY";
}

// --- MAIN ENGINE: Auto-Router ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Save API Key.");
    const btn = document.getElementById('scanBtn');
    if (marketData.some(f => f === null)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "ROUTING CONNECTION...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(marketData.map(fileToPart));
        const prompt = `Act as SMC Expert. Analyze 4 charts for confluence. Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        let success = false;
        let lastError = "";

        for (const modelName of MODEL_POOL) {
            console.log(`Trying model: ${modelName}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imageParts] }] })
            });

            if (response.ok) {
                const data = await response.json();
                const raw = data.candidates[0].content.parts[0].text;
                const res = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
                renderOutput(res);
                success = true;
                break; 
            } else {
                const errData = await response.json();
                lastError = errData.error?.message || "Routing Error";
            }
        }
        if (!success) throw new Error(lastError);
    } catch (e) { alert("TERMINAL ERROR: " + e.message); }
    finally { btn.innerText = "PERFORM MULTI-CHART SCAN"; btn.disabled = false; }
}

function renderOutput(res) {
    const box = document.getElementById('resultBox');
    box.classList.remove('hidden');
    const action = document.getElementById('actionText');
    action.innerText = res.bias;
    action.className = `text-5xl font-black italic mb-6 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : res.bias === 'SELL' ? 'text-rose-500' : 'text-amber-500'}`;
    document.getElementById('entText').innerText = res.entry || "---";
    document.getElementById('slText').innerText = res.sl || "---";
    document.getElementById('tpText').innerText = res.tp || "---";
    document.getElementById('logicText').innerText = res.logic;
    box.scrollIntoView({ behavior: 'smooth' });
}

// System Drawer Controls
function lockUI() {
    document.getElementById('apiInput').disabled = true;
    document.getElementById('apiInput').value = "••••••••••••••••";
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}
function enableEdit() {
    document.getElementById('apiInput').disabled = false;
    document.getElementById('apiInput').value = "";
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}
function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (val) { localStorage.setItem('omni_api_v3', val); API_KEY = val; lockUI(); toggleDrawer(); }
}
function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('translate-x-full');
    document.getElementById('overlay').classList.toggle('hidden');
}
