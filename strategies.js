/**
 * OMNI-REAL | V8 INFINITY ENGINE 
 * INSTITUTIONAL ALGORITHM 2026
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-lite"; 

window.onload = () => {
    if (API_KEY) {
        document.getElementById('apiInput').value = "••••••••••••••••••••";
        lockUI();
    }
    document.getElementById('bal').value = localStorage.getItem('omni_bal') || 10000;
    document.getElementById('risk').value = localStorage.getItem('omni_risk') || 1.0;
};

// UI Toggles
function markFile(idx) {
    document.getElementById(`box${idx}`).classList.add('has-file');
    document.getElementById(`label${idx}`).classList.add('hidden');
    document.getElementById(`icon${idx}`).classList.remove('hidden');
}

function lockUI() {
    document.getElementById('apiInput').disabled = true;
    document.getElementById('apiInput').classList.add('opacity-40');
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

function enableEdit() {
    document.getElementById('apiInput').disabled = false;
    document.getElementById('apiInput').value = "";
    document.getElementById('apiInput').classList.remove('opacity-40');
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
function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

// THE SCANNING ENGINE
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Save Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Tier Charts.");

    btn.innerText = "ALGORITHMIC ANALYSIS ACTIVE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));

        // HIGH ACCURACY PROMPT
        const prompt = `System: Elite SMC Institutional Trader. 
        Analyze charts for: Change of Character (CHoCH), Order Blocks, and Liquidity Sweeps.
        1. IF alignment is not 80% perfect, return: {"bias":"WAIT", "watch_level": number, "logic": "Price is currently trapping retail liquidity; wait for a sweep of the [X] level (13 words)"}
        2. IF aligned, return JSON: {"strategy":"INFINITY-V11","bias":"BUY|SELL","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"Institutional sweep identified followed by structural shift, entering on the refined FVG (14 words)"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

        resultBox.classList.remove('hidden');
        document.getElementById('logicText').innerText = res.logic;

        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "WAIT & WATCH";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-amber-500 glow-text";
            document.getElementById('tradeDetails').classList.add('hidden');
            document.getElementById('waitZone').classList.remove('hidden');
            document.getElementById('watchLevel').innerText = res.watch_level.toFixed(5);
        } else {
            document.getElementById('waitZone').classList.add('hidden');
            document.getElementById('tradeDetails').classList.remove('hidden');
            document.getElementById('actionText').innerText = res.bias;
            document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            
            // MATH FOR LOT SIZE
            const bal = parseFloat(document.getElementById('bal').value);
            const risk = parseFloat(document.getElementById('risk').value);
            const slDist = Math.abs(res.entry - res.sl);
            
            // Formula: (Balance * Risk%) / (SL in Pips * 10)
            const lotSize = (slDist > 0) ? ((bal * (risk/100)) / (slDist * 1000)).toFixed(2) : "0.01";

            document.getElementById('entText').innerText = res.entry.toFixed(5);
            document.getElementById('slText').innerText = res.sl.toFixed(5);
            document.getElementById('tpText').innerText = res.tp.toFixed(5);
            document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
            document.getElementById('supText').innerText = res.support;
            document.getElementById('resText').innerText = res.resistance;
        }
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("TERMINAL ERROR: Invalid Key or System Timeout.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
