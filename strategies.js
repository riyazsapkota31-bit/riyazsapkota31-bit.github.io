/**
 * OMNI-REAL ENGINE | FLASH LITE 2.5
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// Optimized for your confirmed Flash Lite logs
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
    
    // Save locally
    localStorage.setItem('omni_api_v3', keyValue);
    API_KEY = keyValue;
    
    // UI feedback without refreshing
    alert("KEY LOCKED: Flash Lite Engine is now online.");
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
    if (files.some(f => !f)) return alert("Upload all 4 chart tiers for analysis.");

    btn.innerText = "EXTRACTING PIXEL DATA...";
    btn.classList.add('scanning');
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `Professional Institutional Analysis. Analyze HTF, LTF, Entry, and DXY. 
        Determine strategy (SMC/ICT/Wyckoff) and bias.
        Return ONLY this JSON:
        {"strategy":"SMC|WYCKOFF|ICT","bias":"BUY|SELL","entry":number,"sl":number,"support":number,"resistance":number,"logic":"10-word technical insight"}`;

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

        // Position Sizing
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const riskAmt = bal * (risk / 100);
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? (riskAmt / (slDist * 10)).toFixed(2) : "0.01";
        const tp = res.bias === 'BUY' ? (res.entry + (slDist * 3)) : (res.entry - (slDist * 3));

        // Update UI results
        document.getElementById('strategyType').innerText = `${res.strategy} ENGINE`;
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
