/**
 * OMNI-REAL CORE LOGIC
 * Zero-Refresh Lock Engine
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-preview-09-2025";

// Check if key is already stored on load
window.onload = function() {
    if (API_KEY) {
        document.getElementById('apiInput').value = "********************";
        console.log("Key successfully loaded from secure storage.");
    }
};

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const keyValue = input.value.trim();
    
    if (keyValue === "" || keyValue.includes("****")) return alert("Please enter a new key.");
    
    // Save to browser memory
    localStorage.setItem('omni_api_v3', keyValue);
    
    // Update active variable WITHOUT refreshing the page
    API_KEY = keyValue;
    
    alert("Key Locked & Active! The app will not refresh to preserve your charts.");
    
    // Mask UI and close drawer
    document.getElementById('apiInput').value = "********************";
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
    if (!API_KEY) return alert("Open settings and enter your API Key first.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Upload all 4 live charts before scanning.");

    btn.innerText = "EXTRACTING PIXEL DATA...";
    btn.classList.add('scanning');
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `Act as a High-Accuracy Trading Engine. Analyze 4 charts for a high-confluence setup using SMC, Wyckoff, or ICT. Provide precise price levels. 
        Output ONLY this JSON format:
        {"strategy":"SMC|WYCKOFF|ICT","bias":"BUY|SELL","entry":number,"sl":number,"support":number,"resistance":number,"logic":"15-word professional insight"}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] 
            })
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || "AI Connection Failed");

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(jsonStr);

        // Professional Risk Calculations
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const riskAmt = bal * (risk / 100);
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? (riskAmt / (slDist * 10)).toFixed(2) : "0.01";
        const tp = res.bias === 'BUY' ? (res.entry + (slDist * 3)) : (res.entry - (slDist * 3));

        // Update UI
        document.getElementById('strategyType').innerText = `${res.strategy} ENGINE`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic uppercase ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
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
        alert("ENGINE ERROR: " + e.message);
        console.error(e);
    } finally {
        btn.innerText = "PERFORM MULTI-CHART SCAN";
        btn.classList.remove('scanning');
        btn.disabled = false;
    }
}
