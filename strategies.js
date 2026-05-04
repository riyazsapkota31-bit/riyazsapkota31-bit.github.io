/** * OMNI-REAL V18 | ULTIMATE SURGICAL CONFLUENCE
 * STRATEGIES: SMC, ICT, VSA, Price Action, Wyckoff
 * FEATURES: Auto-Asset Detection, Profit Prioritization, Sentry POI Mode
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

window.onload = () => {
    if (API_KEY) lockUI();
    document.getElementById('bal').value = localStorage.getItem('omni_bal') || 10000;
    document.getElementById('risk').value = localStorage.getItem('omni_risk') || 1.0;
};

// --- UI HANDLERS ---
function markFile(idx) {
    document.getElementById(`box${idx}`).classList.add('has-file');
    document.getElementById(`label${idx}`).classList.add('hidden');
    document.getElementById(`icon${idx}`).classList.remove('hidden');
}

function lockUI() {
    const input = document.getElementById('apiInput');
    input.value = "••••••••••••••••••••";
    input.disabled = true;
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    input.value = "";
    input.disabled = false;
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val) return alert("System requires Terminal Key.");
    localStorage.setItem('omni_api_v3', val);
    localStorage.setItem('omni_bal', document.getElementById('bal').value);
    localStorage.setItem('omni_risk', document.getElementById('risk').value);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

// --- CORE SURGICAL ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: 4 Tier Charts Required.");

    btn.innerText = "ALGO-CONFLUENCE ACTIVE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));

        const prompt = `System: Institutional Quantitative Analyst. 
        1. ASSET: Detect the ticker from chart text (e.g., BTCUSDT, SOLUSDT).
        2. CONFLUENCE: Evaluate using SMC, ICT, VSA, Price Action, and Wyckoff.
        3. MODE: Prioritize high-confluence Day Trades (15m+) over Scalps for maximum profit.
        4. SENTRY: If market is sideways/choppy, return bias: "WAIT". Provide "poi" (Price of Interest) and explain why in 10-15 words.
        5. RISK: Stop Loss MUST be structural (beyond sweep high/lows). 
        
        Return ONLY RAW JSON: {"asset":"STRING","type":"SCALP|DAY_TRADE","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"poi":number,"conf":"X/8","logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
                safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawResponse = data.candidates[0].content.parts[0].text;
        let res = JSON.parse(rawResponse.match(/\{[\s\S]*\}/)[0]);

        resultBox.classList.remove('hidden');
        
        const stratType = document.getElementById('strategyType');
        const actionDisplay = document.getElementById('actionText');
        const logicDisplay = document.getElementById('logicText');

        // Asset-Aware Header
        stratType.innerText = `${res.asset || "CRYPTO"} | ${res.type || "MARKET"} | ${res.conf || "0/8"} CONF`;

        if (res.bias === "WAIT") {
            // SIDELINES MODE
            actionDisplay.innerText = "WAIT";
            actionDisplay.className = "text-8xl font-black italic tracking-tighter text-amber-500 opacity-80";
            
            document.getElementById('tradeDetails').classList.add('hidden');
            document.getElementById('poiZone').classList.remove('hidden');
            document.getElementById('poiLevel').innerText = res.poi ? res.poi.toFixed(2) : "WATCHING";
            
            logicDisplay.innerText = res.logic;
            logicDisplay.className = "text-[10px] text-amber-400 italic max-w-[200px] text-right leading-tight";
        } else {
            // SURGICAL TRADE MODE
            document.getElementById('poiZone').classList.add('hidden');
            document.getElementById('tradeDetails').classList.remove('hidden');
            
            actionDisplay.innerText = res.bias;
            actionDisplay.className = `text-8xl font-black italic tracking-tighter ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            
            // Asset-Aware Lot Calculation
            const riskAmount = Math.abs(res.entry - res.sl);
            const bal = parseFloat(document.getElementById('bal').value);
            const riskPct = parseFloat(document.getElementById('risk').value);
            
            // Automatic Multiplier Adjuster
            let multiplier = 1000; 
            if (res.asset && res.asset.includes("BTC")) multiplier = 1;
            if (res.asset && res.asset.includes("SOL")) multiplier = 10;
            if (res.asset && res.asset.includes("ETH")) multiplier = 100;
            
            const lotSize = (riskAmount > 0) ? ((bal * (riskPct/100)) / (riskAmount * multiplier)).toFixed(3) : "0.01";

            document.getElementById('entText').innerText = res.entry.toFixed(2);
            document.getElementById('slText').innerText = res.sl.toFixed(2);
            document.getElementById('tpText').innerText = res.tp.toFixed(2);
            document.getElementById('lotText').innerText = lotSize;
            
            logicDisplay.innerText = res.logic;
            logicDisplay.className = "text-[10px] text-slate-400 italic max-w-[200px] text-right leading-tight";
        }

        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        console.error("OMNI-ERROR:", e);
        alert("TERMINAL ERROR: " + e.message);
    } finally {
        btn.innerText = "EXECUTE COMMAND";
        btn.disabled = false;
    }
}
