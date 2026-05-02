/** * OMNI-REAL INFINITY V9.0 | GLOBAL STRATEGY AGGREGATOR
 * MODELS: Gemini 2.5 Flash / Lite
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
    if (document.getElementById(`img${idx}`).files[0]) {
        marketData[idx] = document.getElementById(`img${idx}`).files[0]; 
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
    if (!API_KEY) return alert("System Offline: Connect Gemini API.");
    const pair = document.getElementById('pairName').value || "Asset";
    if (marketData.some(f => f === null)) return alert("Data Deficit: Please upload 4-Tier Chart Set.");

    const btn = document.getElementById('scanBtn');
    btn.innerHTML = `<i class="fa-solid fa-microchip fa-spin mr-2"></i> AGGREGATING STRATEGIES...`;
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(marketData.map(fileToPart));
        
        // THE UNIVERSAL CONFLUENCE PROMPT
        const prompt = `System: Quantitative Market Strategist. Asset: ${pair}.
        Evaluate 4 charts (1H Bias, 15M Structure, 1M Entry, DXY Index) for universal confluence.
        
        TASK:
        1. STRATEGY CHECK: Run analysis for SMC/ICT, Wyckoff (Accum/Dist), Price Action (Trend/BOS), and Supply & Demand.
        2. DXY FILTER: Confirm move direction against Dollar strength.
        3. CONSOLIDATION: If price is ranging or strategies conflict, return bias "WAIT" with a trigger price.
        4. ACCURACY: Choose the SINGLE strategy providing the highest RR (Risk:Reward).

        OUTPUT JSON ONLY:
        {
            "bias": "BUY|SELL|WAIT",
            "entry": number,
            "sl": number,
            "tp": number,
            "trigger": number,
            "logic": "1. CHOSEN STRATEGY: [Explain why this strategy won] \\n2. THE STORY (Mentorship): [Simple breakdown for beginner/intermediate] \\n3. THE TRAP (Liquidity): [Target zones] \\n4. THE TRIGGER: [Breakout level]"
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
        if (!success) throw new Error("API Sync Error. Verify your key.");
    } catch (e) { alert("SYSTEM ALERT: " + e.message); }
    finally { btn.innerHTML = "PERFORM UNIVERSAL SCAN"; btn.disabled = false; }
}

function renderOutput(res) {
    document.getElementById('resultBox').classList.remove('hidden');
    const act = document.getElementById('actionText');
    act.innerText = res.bias;
    
    // Sentiment Glow Effects
    if (res.bias === 'BUY') act.className = "text-7xl font-black italic mb-6 glow-text text-emerald-400";
    else if (res.bias === 'SELL') act.className = "text-7xl font-black italic mb-6 glow-text text-rose-500";
    else act.className = "text-7xl font-black italic mb-6 glow-text text-amber-400";

    document.getElementById('entText').innerText = res.entry || "---";
    document.getElementById('slText').innerText = res.sl || "---";
    document.getElementById('tpText').innerText = res.tp || "---";
    
    // Adaptive Lot Size (1% Risk Management)
    const slDist = Math.abs(res.entry - res.sl);
    document.getElementById('lotText').innerText = slDist > 0 ? ((1000 * 0.01) / (slDist * 10)).toFixed(2) + " Lots" : "ADAPTIVE";

    let finalLogic = res.logic;
    if (res.bias === "WAIT" && res.trigger) {
        finalLogic = `<span class="text-amber-400 font-black">MARKET PAUSE:</span> Do not execute until price triggers ${res.trigger}.\\n\\n${res.logic}`;
    }
    document.getElementById('logicText').innerText = finalLogic;
    document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth' });
}

// TERMINAL CONTROLS
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
