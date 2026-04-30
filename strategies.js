/**
 * OMNI-REAL ENGINE | SCALPER V3 (FLASH LITE)
 * Optimized for: M1/M5/M15 entries and 1.5x RR Scalping
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// Corrected Model ID based on your successful usage logs
const MODEL = "gemini-2.5-flash-lite"; 

window.onload = function() {
    if (API_KEY) {
        document.getElementById('apiInput').value = "********************";
    }
};

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const keyValue = input.value.trim();
    if (keyValue === "" || keyValue.includes("****")) return alert("Please enter a valid Security Key.");
    
    localStorage.setItem('omni_api_v3', keyValue);
    API_KEY = keyValue;
    
    alert("KEY LOCKED: Scalper Engine is now online.");
    input.value = "********************";
    toggleDrawer();
}

function markFile(idx) {
    document.getElementById(`box${idx}`).classList.add('has-file');
}

function toggleDrawer() { 
    document.getElementById('sideDrawer').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('hidden'); 
}

function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("Security Error: Key not found. Sync Key in Master Control.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Please upload all 4 chart tiers.");

    btn.innerText = "SCALPING PIXEL DATA...";
    btn.classList.add('scanning');
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // MODIFIED PROMPT: Directs the AI to look for scalping setups on lower timeframes
        const prompt = `Act as an expert High-Frequency Scalper. Analyze these 4 charts for a QUICK trade setup (Hold time 1-60 mins). 
        Prioritize M1/M5 liquidity sweeps, FVG fills, and immediate volume momentum. Ignore long-term swing targets. 
        Return ONLY this JSON format:
        {"strategy":"SCALP|SMC","bias":"BUY|SELL","entry":number,"sl":number,"support":number,"resistance":number,"logic":"Identify 5-word immediate catalyst"}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] 
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Connection Error");

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(jsonStr);

        // MODIFIED CALCULATION: Adjusted Risk-to-Reward for fast scalping exits
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const riskAmt = bal * (risk / 100);
        const slDist = Math.abs(res.entry - res.sl);
        
        // Target set to 1.5x risk for higher probability fast exits
        const tp = res.bias === 'BUY' ? (res.entry + (slDist * 1.5)) : (res.entry - (slDist * 1.5));
        const lotSize = slDist > 0 ? (riskAmt / (slDist * 10)).toFixed(2) : "0.01";

        // UI Injection
        document.getElementById('strategyType').innerText = `QUICK ${res.strategy}`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic uppercase leading-none ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = tp.toFixed(5);
        document.getElementById('supText').innerText = res.support.toFixed(5);
        document.getElementById('resText').innerText = res.resistance.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('logicText').innerText = res.logic;

        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("TERMINAL ERROR: " + e.message);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.classList.remove('scanning');
        btn.disabled = false;
    }
}
