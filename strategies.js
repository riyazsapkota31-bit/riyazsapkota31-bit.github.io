/** * OMNI-REAL | CORE V9.0
 * ARCHITECTURE: Multi-Tier Confluence Engine
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
let marketData = [null, null, null, null]; 
const MODEL_POOL = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

window.onload = () => { 
    if (API_KEY) {
        lockUI(); 
        document.getElementById('statusDot').className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]";
    }
};

function markFile(idx) {
    const file = document.getElementById(`img${idx}`).files[0];
    if (file) {
        marketData[idx] = file; 
        const box = document.getElementById(`box${idx}`);
        box.classList.add('has-file');
        document.getElementById(`content${idx}`).innerHTML = `
            <div class="bg-emerald-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto">
                <i class="fa-solid fa-check text-emerald-500 text-xl"></i>
            </div>
            <p class="text-[10px] font-black text-emerald-500 tracking-widest">SYNCED</p>
        `;
    }
}

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: file.type, data: reader.result.split(',')[1] } });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("CRITICAL: Terminal Disconnected. Connect API Key.");
    const pair = document.getElementById('pairName').value || "Global Market";
    if (marketData.some(f => f === null)) return alert("DATA GAP: Please upload all 4 required timeframe tiers.");

    const btn = document.getElementById('scanBtn');
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> AGGREGATING DATA...`;
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(marketData.map(fileToPart));
        
        // WORLD-CLASS PROMPT ENGINEERING
        const prompt = `Act as a Top 1% Institutional SMC Trader. 
        Analyze these 4 charts for ${pair} confluence: 1H Bias, 15M Structure, 1M Entry, and DXY Strength.
        
        RULES:
        1. STRATEGY: Use Smart Money Concepts (SMC), Order Blocks, FVG, and Liquidity Grab.
        2. ACCURACY: If the charts contradict each other, return "WAIT".
        3. DXY: Factor in USD strength/weakness into the final bias.
        4. CONSOLIDATION: If price is ranging without BOS/CHoCH, return "WAIT" with a trigger price.

        OUTPUT JSON ONLY:
        {
            "bias": "BUY|SELL|WAIT",
            "entry": number,
            "sl": number,
            "tp": number,
            "trigger": number,
            "logic": "Step-by-step institutional reasoning"
        }`;

        let success = false;
        for (const modelName of MODEL_POOL) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imageParts] }] })
            });

            if (response.ok) {
                const data = await response.json();
                const raw = data.candidates[0].content.parts[0].text;
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    renderOutput(JSON.parse(jsonMatch[0]));
                    success = true;
                    break;
                }
            }
        }
        if (!success) throw new Error("Connection timed out. Re-sync key.");
    } catch (e) { alert("SYSTEM ALERT: " + e.message); }
    finally { 
        btn.innerHTML = "PERFORM MULTI-CHART SCAN"; 
        btn.disabled = false; 
    }
}

function renderOutput(res) {
    const box = document.getElementById('resultBox');
    box.classList.remove('hidden');
    const act = document.getElementById('actionText');
    act.innerText = res.bias;
    
    // Premium Color Logic
    if (res.bias === 'BUY') act.className = "text-7xl font-black italic mb-6 glow-text text-emerald-400";
    else if (res.bias === 'SELL') act.className = "text-7xl font-black italic mb-6 glow-text text-rose-500";
    else act.className = "text-7xl font-black italic mb-6 glow-text text-amber-400";

    document.getElementById('entText').innerText = res.entry || "---";
    document.getElementById('slText').innerText = res.sl || "---";
    document.getElementById('tpText').innerText = res.tp || "---";
    
    // Institutional Position Sizing (Fixed 1% Risk)
    const slDist = Math.abs(res.entry - res.sl);
    document.getElementById('lotText').innerText = slDist > 0 ? ((1000 * 0.01) / (slDist * 10)).toFixed(2) + " Lots" : "ADAPTIVE";

    let logicFinal = res.logic;
    if (res.bias === "WAIT" && res.trigger) {
        logicFinal = `<span class="text-amber-400 font-black uppercase">TRIGGER ALERT:</span> Break ${res.trigger} to confirm entry.<br><br>${res.logic}`;
    }
    document.getElementById('logicText').innerHTML = logicFinal;
    box.scrollIntoView({ behavior: 'smooth' });
}

// UI HANDLERS
function lockUI() {
    const inp = document.getElementById('apiInput');
    inp.disabled = true; inp.value = "••••••••••••••••";
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
    document.getElementById('statusDot').className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]";
}
function enableEdit() {
    document.getElementById('apiInput').disabled = false;
    document.getElementById('apiInput').value = "";
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
    document.getElementById('statusDot').className = "w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]";
}
function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (val) { localStorage.setItem('omni_api_v3', val); API_KEY = val; lockUI(); toggleDrawer(); }
}
function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('translate-x-full');
    document.getElementById('overlay').classList.toggle('hidden');
}
