let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash-exp"; 

window.onload = () => { if (API_KEY) lockUI(); };

function toggleDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('overlay');
    if (drawer && overlay) {
        drawer.classList.toggle('open');
        overlay.classList.toggle('hidden');
    }
}

function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const label = document.getElementById(`label${idx}`);
    const icon = document.getElementById(`icon${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        label.classList.add('hidden');
        icon.classList.remove('hidden');
    }
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
    if (!val || val.includes("•")) return alert("Invalid Terminal Key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

// --- NEW: IMAGE OPTIMIZATION (Fixes Timeout) ---
async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resizing to 1024px preserves technical chart details while cutting data size by 70%
                const scale = 1024 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve({ inlineData: { mimeType: "image/jpeg", data: dataUrl.split(',')[1] } });
            };
        };
    });
}

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "AGGREGATING STRATEGIES...";
    btn.disabled = true;

    try {
        // Optimized processing to prevent AbortError
        const imageParts = await Promise.all(files.map(processImage));
        
        const prompt = `Analyze these 4 market charts using SMC, Price Action, and Volatility models.
        Select the best strategy for the current regime. 
        If sideways, return "WAIT" with breakoutPoint.
        Return ONLY JSON: {"strategy":"string","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string","breakoutPoint":number}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // Update Dashboard UI
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
        alert("TERMINAL ERROR: Connection timed out. Ensure your internet is stable.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
