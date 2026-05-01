let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash-exp"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- DRAWER CONTROLS ---
function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    if (d && o) { d.classList.toggle('open'); o.classList.toggle('hidden'); }
}
function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

// --- UI FEEDBACK ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const icon = document.getElementById(`icon${idx}`);
    const label = document.getElementById(`label${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        label.classList.add('hidden');
        icon.classList.remove('hidden');
    }
}

// --- SECURITY ---
function lockUI() {
    const input = document.getElementById('apiInput');
    input.value = "••••••••••••••••••••";
    input.disabled = true;
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}
function enableEdit() {
    const input = document.getElementById('apiInput');
    input.value = ""; input.disabled = false;
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}
function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val || val.includes("•")) return alert("Invalid Key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val; lockUI(); toggleDrawer();
}

// --- OPTIMIZED IMAGE COMPRESSION (Prevents Timeout) ---
async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Target 800px to ensure rapid API processing without losing candle detail
                const scale = 800 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Lower quality to 0.6 for maximum speed/stability
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                resolve({ inlineData: { mimeType: "image/jpeg", data: dataUrl.split(',')[1] } });
            };
        };
    });
}

// --- CORE AGGREGATOR ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("Terminal Offline: Enter Key.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "RUNNING OMNI-STRATEGY SCAN...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        
        const prompt = `Analyze these 4 market charts. 
        Utilize: SMC/ICT, Trend Following, Price Action, Volatility (RSI/Bollinger), and Quant/DXY.
        Identify the current regime and use the most effective strategy classification.
        If consolidated, return "WAIT" with a breakoutPoint.
        Return ONLY JSON: {"strategy":"string","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string","breakoutPoint":number}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // Update UI
        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "NO TRADE";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
            document.getElementById('entText').innerText = res.breakoutPoint ? `WATCH ${res.breakoutPoint.toFixed(2)}` : "---";
            ['slText','tpText','lotText'].forEach(id => document.getElementById(id).innerText = "---");
            document.getElementById('strategyType').innerText = "FILTER: CONSOLIDATION";
        } else {
            const slDist = Math.abs(res.entry - res.sl);
            const bal = parseFloat(document.getElementById('bal').value) || 10000;
            const riskVal = bal * (parseFloat(document.getElementById('risk').value) / 100);
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
        alert("TERMINAL ERROR: Connection timed out. Ensure API key is valid and internet is active.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
