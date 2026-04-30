/**
 * OMNI-REAL ENGINE | FULL INTERFACE + INFINITY SCALPER V7
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

// --- 1. INTERFACE CONTROL (Restores your Menu/Drawer access) ---

function toggleDrawer() { 
    document.getElementById('sideDrawer').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('hidden'); 
}

function openSub(id) { 
    document.getElementById(id).classList.add('active'); 
}

function closeSub(id) { 
    document.getElementById(id).classList.remove('active'); 
}

window.onload = function() {
    if (API_KEY) { 
        document.getElementById('apiInput').value = "********************"; 
    }
};

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const keyValue = input.value.trim();
    if (keyValue === "" || keyValue.includes("****")) return alert("Invalid Key.");
    localStorage.setItem('omni_api_v3', keyValue);
    API_KEY = keyValue;
    alert("KEY SYNCED: Scalper Engine Online.");
    input.value = "********************";
    toggleDrawer();
}

function markFile(idx) { 
    document.getElementById(`box${idx}`).classList.add('has-file'); 
}

// --- 2. CORE SCALPER ENGINE ---

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("Security Error: Key not found. Sync in Master Control.");
    
    // Capture LIVE data from your Risk Menu
    const userBalance = parseFloat(document.getElementById('bal').value) || 10000;
    const userRiskPercent = parseFloat(document.getElementById('risk').value) || 1.0;
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Please upload all 4 chart tiers.");

    btn.innerText = "SCALPING PIXELS...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        const prompt = `Act as an expert Institutional Scalper. Analyze these 4 charts for a high-confluence LTF setup. 
        Identify the primary Draw on Liquidity (major swing high/low) for the Target. 
        Ensure the Target provides at least a 1.5x expansion from entry.
        Return ONLY this JSON format:
        {"strategy":"INF-SCALP|SMC","bias":"BUY|SELL","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"Identify 5-word immediate catalyst"}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // Dynamic RR Math
        const slDist = Math.abs(res.entry - res.sl);
        const riskAmountMoney = userBalance * (userRiskPercent / 100);
        
        let finalTp = res.tp;
        const minTpDist = slDist * 1.5;
        if (Math.abs(res.entry - res.tp) < minTpDist) {
            finalTp = res.bias === 'BUY' ? (res.entry + (slDist * 1.9)) : (res.entry - (slDist * 1.9));
        }

        const calculatedLot = slDist > 0 ? (riskAmountMoney / (slDist * 10)).toFixed(2) : "0.10";

        // Display Results
        document.getElementById('strategyType').innerText = `INFINITY ${res.strategy}`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = finalTp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(calculatedLot, 0.01);
        document.getElementById('logicText').innerText = res.logic;
        
        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("ENGINE ERROR: " + e.message);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.disabled = false;
    }
}
