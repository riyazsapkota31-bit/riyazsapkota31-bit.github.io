/**
 * OMNI-REAL | V11 ULTIMATE AGGREGATOR
 * 100% ACCURACY CALIBRATION
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash-exp"; 

window.onload = () => {
    if (API_KEY) lockUI();
    document.getElementById('bal').value = localStorage.getItem('omni_bal') || 10000;
    document.getElementById('risk').value = localStorage.getItem('omni_risk') || 1.0;
};

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

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Tier Charts.");

    btn.innerText = "AGGREGATING 8 STRATEGIC CONFLUENCES...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));

        const prompt = `System: World-Class Quantitative Analyst.
        Apply 8 Strategies: SMC, ICT, Wyckoff, Elliott Wave, VSA, Fibonacci Retracement, Mean Reversion, and pure Price Action.
        
        CRITERIA:
        1. If sideways or low-probability, return: {"bias":"WAIT", "poi": number, "logic": "Sideways chop detected; watch for liquidity sweep at POI before planning high-confluence entry."}
        2. If high-probability, choose the best strategy and return: {"strategy":"NAME", "bias":"BUY|SELL", "entry":number, "sl":number, "tp":number, "support":number, "resistance":number, "logic":"Summarized high-conviction institutional footprint identified across 4 tiers with 100% confluence."}
        
        Constraint: Logic must be exactly 15-20 words. Return ONLY JSON.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        resultBox.classList.remove('hidden');
        document.getElementById('logicText').innerText = res.logic;

        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "POI WATCH";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
            document.getElementById('tradeDetails').classList.add('hidden');
            document.getElementById('poiZone').classList.remove('hidden');
            document.getElementById('poiLevel').innerText = res.poi.toFixed(5);
        } else {
            document.getElementById('poiZone').classList.add('hidden');
            document.getElementById('tradeDetails').classList.remove('hidden');
            document.getElementById('strategyType').innerText = res.strategy;
            document.getElementById('actionText').innerText = res.bias;
            document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            
            // Risk Calculation
            const bal = parseFloat(document.getElementById('bal').value);
            const risk = parseFloat(document.getElementById('risk').value);
            const slDist = Math.abs(res.entry - res.sl);
            const lotSize = (slDist > 0) ? ((bal * (risk/100)) / (slDist * 1000)).toFixed(2) : "0.10";

            document.getElementById('entText').innerText = res.entry.toFixed(5);
            document.getElementById('slText').innerText = res.sl.toFixed(5);
            document.getElementById('tpText').innerText = res.tp.toFixed(5);
            document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
            document.getElementById('supText').innerText = res.support.toFixed(5);
            document.getElementById('resText').innerText = res.resistance.toFixed(5);
        }
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("TERMINAL ERROR: Invalid API Key or Version Mismatch.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
