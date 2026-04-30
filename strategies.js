/**
 * OMNI-REAL | INFINITY SCALPER V8 (STABLE)
 * Features: Dynamic RR (1.5 - 6.0+), Auto-Risk Calc, Gemini 2.5 Flash Lite Fix
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

// --- INTERFACE CONTROLS ---
function toggleDrawer() { 
    document.getElementById('sideDrawer').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('hidden'); 
}

function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

window.onload = function() {
    if (API_KEY) document.getElementById('apiInput').value = "********************";
};

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    if (val === "" || val.includes("****")) return alert("Please enter a valid key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    alert("SYSTEM SYNCED: Scalper Engine Online.");
    input.value = "********************";
    toggleDrawer();
}

function markFile(idx) { document.getElementById(`box${idx}`).classList.add('has-file'); }

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

// --- ANALYSIS ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("Security Error: Sync Key in Master Control.");
    
    // Capture Dynamic User Risk Data
    const bal = parseFloat(document.getElementById('bal').value) || 10000;
    const riskPercent = parseFloat(document.getElementById('risk').value) || 1.0;
    
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

        // Dynamic Calculations
        const slDist = Math.abs(res.entry - res.sl);
        const riskCash = bal * (riskPercent / 100);
        
        // Ensure RR is 1.5 or above
        let finalTp = res.tp;
        if (Math.abs(res.entry - res.tp) < (slDist * 1.5)) {
            finalTp = res.bias === 'BUY' ? (res.entry + (slDist * 1.9)) : (res.entry - (slDist * 1.9));
        }

        const lotSize = slDist > 0 ? (riskCash / (slDist * 10)).toFixed(2) : "0.10";

        // UI Injection
        document.getElementById('strategyType').innerText = `INFINITY ${res.strategy}`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = finalTp.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('logicText').innerText = res.logic;
        document.getElementById('supText').innerText = res.support.toFixed(2);
        document.getElementById('resText').innerText = res.resistance.toFixed(2);

        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("ENGINE ERROR: " + e.message);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.disabled = false;
    }
}
