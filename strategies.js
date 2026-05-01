// --- TERMINAL CONFIGURATION ---
let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash-exp"; // Optimized for complex multi-strategy reasoning

window.onload = () => { 
    if (API_KEY) lockUI(); 
};

// --- MASTER CONTROL: DRAWER LOGIC ---
// Fixes the non-clickable menu button issue
function toggleDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('overlay');
    if (drawer && overlay) {
        drawer.classList.toggle('open');
        overlay.classList.toggle('hidden');
    }
}

function openSub(id) { 
    document.getElementById(id).classList.add('active'); 
}

function closeSub(id) { 
    document.getElementById(id).classList.remove('active'); 
}

// --- FILE UPLOAD FEEDBACK ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const label = document.getElementById(`label${idx}`);
    const icon = document.getElementById(`icon${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        label.classList.add('hidden');
        icon.classList.remove('hidden');
    }
}

// --- SECURITY & API MANAGEMENT ---
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
    if (!val || val.includes("•")) return alert("Invalid Terminal Key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

// --- DATA PREPARATION ---
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ 
            inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } 
        });
    });
}

// --- HYBRID MULTI-STRATEGY ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    // Update UI state for processing
    btn.innerText = "AGGREGATING ALL STRATEGIES...";
    btn.disabled = true;

    // STABILITY UPGRADE: Prevents permanent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); 

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // DYNAMIC STRATEGY PROMPT
        const prompt = `System: Master Quant Analyst. Analyze 4 charts for structural alignment. 
        STRATEGIES TO UTILIZE: 
        1. SMC/ICT (Order Blocks, FVG, Liquidity Sweeps)
        2. Trend Following & Pullbacks (Fibonacci, EMA)
        3. Price Action & Patterns (H&S, Wedges, Triangles)
        4. Mean Reversion & Volatility (RSI Divergence, Bollinger)
        5. Quant/Macro (DXY Correlation)

        TASK: 
        - Determine the market regime and select the most effective strategy.
        - If sideways, return "WAIT" with a specific breakoutPoint.
        - If trending/reversing, provide BUY/SELL with target 1.5x+ RR.
        Return ONLY JSON: {"strategy":"STRATEGY_NAME","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string","breakoutPoint":number}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] }),
            signal: controller.signal
        });

        clearTimeout(timeoutId); 
        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // --- RENDER LOGIC ---
        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "NO TRADE";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
            
            // Injects the tactical wait point into Entry
            document.getElementById('entText').innerText = res.breakoutPoint ? `WATCH ${res.breakoutPoint.toFixed(2)}` : "---";
            
            ['slText','tpText','lotText'].forEach(id => document.getElementById(id).innerText = "---");
            document.getElementById('strategyType').innerText = "FILTER: CONSOLIDATION";
        } else {
            // RISK MANAGEMENT CALCULATION
            const slDist = Math.abs(res.entry - res.sl);
            const bal = parseFloat(document.getElementById('bal').value) || 10000;
            const riskVal = bal * (parseFloat(document.getElementById('risk').value) / 100);
            
            // Lot Sizing for Crypto/Forex
            const lotSize = slDist > 0 ? (riskVal / (slDist * 10)).toFixed(2) : "0.10";

            document.getElementById('strategyType').innerText = res.strategy;
            document.getElementById('actionText').innerText = res.bias;
            document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            document.getElementById('entText').innerText = res.entry.toFixed(5);
            document.getElementById('slText').innerText = res.sl.toFixed(5);
            document.getElementById('tpText').innerText = res.tp.toFixed(5);
            document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        }

        document.getElementById('logicText').innerText = res.logic;
        document.getElementById('supText').innerText = res.support ? res.support.toFixed(2) : "---";
        document.getElementById('resText').innerText = res.resistance ? res.resistance.toFixed(2) : "---";
        
        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        // Targeted error messaging
        if (e.name === 'AbortError') {
            alert("STABILITY ALERT: Analysis took too long. Try lower-resolution chart captures.");
        } else {
            alert("TERMINAL ERROR: Connection timed out or API busy. Re-run scan.");
        }
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
