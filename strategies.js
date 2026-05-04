/** * OMNI-REAL V11 | FINAL INSTITUTIONAL ENGINE
 * UPDATED: May 5, 2026 - Enhanced JSON Extraction & 2.5 Logic
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// Strictly using the supported model from your Compatibility Report
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

// --- CORE ANALYSIS ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Tier Charts.");

    btn.innerText = "ALGO-SCALPING ACTIVE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));

        // THE ULTIMATE PROMPT - Updated for stricter formatting
        const prompt = `System: Expert Aggressive Scalper.
        Analyze using: SMC, ICT, Wyckoff, Price Action, VSA, Fibonacci.
        
        STRICT FORMATTING:
        Return ONLY a raw JSON object. NO markdown, NO backticks, NO prose.
        
        STRICT RULES:
        1. Accuracy is priority. 1M/5M liquidity traps only.
        2. MANDATORY RR: 1:2 or higher.
        3. If RR < 1:2, return bias: "WAIT" and provide "poi".
        4. "logic" MUST be 15-20 words on institutional footprint.
        
        JSON Structure: {"strategy":"STRAT_NAME","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"poi":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
             throw new Error("Invalid API Response Structure");
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // --- ROBUST JSON EXTRACTION ---
        let res;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("AI failed to output JSON");
        }

        // RR SECURITY CHECK
        const risk = Math.abs(res.entry - res.sl);
        const reward = Math.abs(res.tp - res.entry);
        const actualRR = risk > 0 ? (reward / risk) : 0;

        resultBox.classList.remove('hidden');

        // Logic Override for Low RR
        if (res.bias !== "WAIT" && actualRR < 1.98) {
            res.bias = "WAIT";
            res.logic = "Institutional setup identified but entry price requires retracement to POI to maintain professional 1:2 risk-to-reward ratio.";
            res.poi = res.bias === "BUY" ? (res.entry - (risk * 0.3)) : (res.entry + (risk * 0.3));
        }

        document.getElementById('logicText').innerText = res.logic;

        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "WAIT @ POI";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
            document.getElementById('tradeDetails').classList.add('hidden');
            document.getElementById('poiZone').classList.remove('hidden');
            document.getElementById('poiLevel').innerText = (res.poi || 0).toFixed(5);
            document.getElementById('strategyType').innerText = "RR OPTIMIZING";
        } else {
            document.getElementById('poiZone').classList.add('hidden');
            document.getElementById('tradeDetails').classList.remove('hidden');
            document.getElementById('strategyType').innerText = `${res.strategy} | RR 1:${actualRR.toFixed(1)}`;
            document.getElementById('actionText').innerText = res.bias;
            document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            
            const bal = parseFloat(document.getElementById('bal').value);
            const riskPct = parseFloat(document.getElementById('risk').value);
            const lotSize = (risk > 0) ? ((bal * (riskPct/100)) / (risk * 1000)).toFixed(2) : "0.10";

            document.getElementById('entText').innerText = res.entry.toFixed(5);
            document.getElementById('slText').innerText = res.sl.toFixed(5);
            document.getElementById('tpText').innerText = res.tp.toFixed(5);
            document.getElementById('lotText').innerText = Math.max(parseFloat(lotSize), 0.01);
            document.getElementById('supText').innerText = (res.support || 0).toFixed(5);
            document.getElementById('resText').innerText = (res.resistance || 0).toFixed(5);
        }
        
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        console.error("OMNI-ERROR:", e);
        alert(`TERMINAL ERROR: ${e.message || "Invalid AI Output"}`);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
