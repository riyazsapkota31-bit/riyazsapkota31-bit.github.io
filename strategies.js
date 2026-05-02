/** * OMNI-REAL | INFINITY SCALPER V8.2
 * SMART ROUTER: Automatic API Failover
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// Prioritized list of stable model identifiers
const MODEL_POOL = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-pro-vision",
    "gemini-1.5-pro"
];

let marketData = [null, null, null, null]; 

window.onload = () => { if (API_KEY) lockUI(); };

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const input = document.getElementById(`img${idx}`);
    const content = document.getElementById(`content${idx}`);
    
    if (input.files && input.files[0]) {
        marketData[idx] = input.files[0]; 
        box.classList.add('has-file');
        
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">
                <i class="fa-solid fa-check text-white text-xl"></i>
            </div>
            <p style="color:#10b981; font-weight:800; font-size:0.7rem; letter-spacing:1px; text-transform:uppercase;">Chart Synced</p>
        `;
    }
}

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            inlineData: { mimeType: file.type, data: reader.result.split(',')[1] }
        });
    });
}

// --- SMART CONNECTION ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    const btn = document.getElementById('scanBtn');
    
    if (marketData.some(f => f === null)) {
        return alert("Data Gap: Upload all 4 Market Tiers."); //
    }

    btn.innerText = "ROUTING CONNECTION...";
    btn.disabled = true;

    const imageParts = await Promise.all(marketData.map(fileToPart));
    const prompt = `System: Expert SMC Analyst. Analyze 4 charts for structural confluence. 
    Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

    let success = false;
    let lastError = "";

    // Loop through all models until one connects
    for (const modelName of MODEL_POOL) {
        try {
            console.log(`Attempting connection via: ${modelName}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const rawResponse = data.candidates[0].content.parts[0].text;
                const res = JSON.parse(rawResponse.replace(/```json/g, '').replace(/```/g, '').trim());
                
                renderOutput(res, document.getElementById('resultBox'));
                success = true;
                break; // Connection established, exit loop
            } else {
                const errData = await response.json();
                lastError = errData.error?.message || "Unknown Routing Failure";
            }
        } catch (e) {
            lastError = e.message;
        }
    }

    if (!success) {
        alert("TERMINAL ERROR: All routing attempts failed. Final Error: " + lastError); //
    }

    btn.innerText = "Perform Multi-Chart Scan";
    btn.disabled = false;
}

// Rendering Logic
function renderOutput(res, resultBox) {
    resultBox.classList.remove('hidden');
    const actionTxt = document.getElementById('actionText');
    
    if (res.bias === "WAIT") {
        actionTxt.innerText = "WAIT & WATCH";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
        document.getElementById('logicText').innerText = `WATCH LEVEL: ${res.support || '---'} | ${res.logic}`;
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        
        const bal = parseFloat(document.getElementById('bal').value) || 10000; 
        const risk = parseFloat(document.getElementById('risk').value) || 1; 
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? ((bal * (risk/100)) / (slDist * 10)).toFixed(2) : "0.10";

        document.getElementById('entText').innerText = res.entry;
        document.getElementById('slText').innerText = res.sl;
        document.getElementById('tpText').innerText = res.tp;
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('supText').innerText = res.support || "---";
        document.getElementById('resText').innerText = res.resistance || "---";
        document.getElementById('logicText').innerText = res.logic;
    }
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

// Terminal Controls
function lockUI() {
    const apiInput = document.getElementById('apiInput');
    apiInput.value = "••••••••••••••••••••";
    apiInput.disabled = true;
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
    if (val) {
        localStorage.setItem('omni_api_v3', val);
        API_KEY = val;
        lockUI();
        toggleDrawer();
    }
}

function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}
