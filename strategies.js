/**
 * OMNI-REAL ENGINE | SCALPER V3 (FLASH LITE)
 * Hold Time: 1m - 60m
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

window.onload = function() {
    if (API_KEY) { document.getElementById('apiInput').value = "********************"; }
};

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const keyValue = input.value.trim();
    if (keyValue === "" || keyValue.includes("****")) return alert("Invalid Key.");
    localStorage.setItem('omni_api_v3', keyValue);
    API_KEY = keyValue;
    alert("SCALPER ENGINE SYNCED.");
    input.value = "********************";
    toggleDrawer();
}

function markFile(idx) { document.getElementById(`box${idx}`).classList.add('has-file'); }
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
    if (!API_KEY) return alert("Key Missing.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Upload all 4 tiers.");

    btn.innerText = "SCALPING PIXELS...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // CUSTOM SCALPER PROMPT: Focuses on M1/M5 liquidity and quick exits
        const prompt = `Act as a High-Frequency Scalper. Analyze these 4 charts for a QUICK TRADE (1-60m duration). 
        Prioritize: M5 Liquidity sweeps, FVG fills on M1/M5, and immediate volume.
        Ignore long-term swing targets. Provide TIGHT exit levels for a 1:1.5 or 1:2 Risk-to-Reward.
        Return ONLY this JSON:
        {"strategy":"SCALP|SMC","bias":"BUY|SELL","entry":number,"sl":number,"support":number,"resistance":number,"logic":"Identify 5-word immediate catalyst"}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

        // POSITION CALCULATION (NARROW SL)
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const riskAmt = bal * (risk / 100);
        const slDist = Math.abs(res.entry - res.sl);
        
        // SCALPER TARGET: Target is reduced to 1.5x risk for high strike-rate quick exits
        const tp = res.bias === 'BUY' ? (res.entry + (slDist * 1.5)) : (res.entry - (slDist * 1.5));
        const lotSize = slDist > 0 ? (riskAmt / (slDist * 10)).toFixed(2) : "0.10";

        // UI UPDATE
        document.getElementById('strategyType').innerText = `QUICK ${res.strategy}`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = tp.toFixed(5);
        document.getElementById('lotText').innerText = lotSize;
        document.getElementById('logicText').innerText = res.logic;

        resultBox.classList.remove('hidden');
    } catch (e) {
        alert("ENGINE ERROR: " + e.message);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.disabled = false;
    }
}
