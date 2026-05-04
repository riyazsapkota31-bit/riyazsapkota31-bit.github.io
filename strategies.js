/** * OMNI-REAL V11 | FINAL INSTITUTIONAL ENGINE
 * FEATURES: Aggressive Scalping, 1:2 RR Guard, 8-Strategy Confluence
 * UPDATED: May 5, 2026 - Final Stability Patch
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

        const prompt = `System: Expert Aggressive Scalper.
        Analyze using: SMC, ICT, Wyckoff, Price Action, VSA.
        
        STRICT RULES:
        1. Return ONLY raw JSON. No markdown code blocks.
        2. MANDATORY RR: Must be 1:2 or higher. 
        3. "logic" MUST be 15-20 words describing institutional footprint.
        
        JSON Structure: {"strategy":"STRAT_NAME","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"poi":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawResponse = data.candidates[0].content.parts[0].text;
        
        // Robust Extraction Logic
        let res;
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("AI output was not in JSON format.");
        }

        // RR SECURITY CHECK
        const risk = Math.abs(res.entry - res.sl);
        const reward = Math.abs(res.tp - res.entry);
        const actualRR = risk > 0 ? (reward / risk) : 0;

        resultBox.classList.remove('hidden');

        if (res.bias !== "WAIT" && actualRR < 1.98) {
            res.bias = "WAIT";
            res.logic = "Institutional setup identified but entry price requires retracement to POI to maintain 1:2 risk-to-reward ratio.";
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
        console.error(e);
        alert("TERMINAL ERROR: " + e.message);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
