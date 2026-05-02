// --- CONFIGURATION ---
let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash-exp"; // 2.5 is currently exp, ensure ID matches your dashboard

// --- UI CONTROLS ---
function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    d.classList.toggle('open');
    o.classList.toggle('show');
    
    // UI FIX: Ensure fields are clickable when drawer opens
    const inputs = ['bal', 'risk', 'apiInput'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.disabled = false;
            el.style.pointerEvents = 'auto';
        }
    });
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val) return alert("Please enter a valid API key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    alert("Terminal Synchronized Successfully.");
    toggleDrawer();
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
    }
}

// --- MULTI-STRATEGY ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("Terminal not linked. Enter API Key in Master Control.");
    
    const btn = document.getElementById('scanBtn');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Upload all 4 chart timeframes for confluence.");

    btn.innerText = "RUNNING MULTI-STRATEGY SCAN...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: `Institutional Confluence Scan:
                        1. SMC: Check Order Blocks & FVGs.
                        2. ICT: Detect Liquidity Sweeps & MSS.
                        3. Price Action: Analyze Trend & S/R.
                        
                        Return ONLY JSON: {
                            "bias": "BUY|SELL|WAIT",
                            "score": number,
                            "entry": number,
                            "sl": number,
                            "tp": number,
                            "logic": "Confluence summary including SMC/ICT/PA data"
                        }` },
                        ...imageParts
                    ]
                }]
            })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(rawText.replace(/```json|```/gi, '').trim());
        
        renderResults(res);
    } catch (e) {
        console.error("Scan Error:", e);
        alert("ENGINE ERROR: Verify API Key and Model permissions.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderResults(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    const card = document.getElementById('signalCard');
    
    resultBox.style.display = 'block';
    actionTxt.innerText = res.bias;
    document.getElementById('scoreBadge').innerText = `CONFLUENCE ${res.score}/10`;
    document.getElementById('logicText').innerText = res.logic;

    if (res.bias === 'WAIT') {
        document.getElementById('tradeGrid').style.display = 'none';
        document.getElementById('waitGrid').style.display = 'block';
        card.className = "signal-card wait-card";
        actionTxt.style.color = "#64748b";
        document.getElementById('watchLevel').innerText = res.entry || "---";
    } else {
        document.getElementById('tradeGrid').style.display = 'block';
        document.getElementById('waitGrid').style.display = 'none';
        card.className = (res.bias === 'BUY') ? "signal-card" : "signal-card sell-card";
        actionTxt.style.color = (res.bias === 'BUY') ? "#10b981" : "#ef4444";
        
        document.getElementById('entText').innerText = res.entry.toLocaleString();
        document.getElementById('slText').innerText = res.sl.toLocaleString();
        document.getElementById('tpText').innerText = res.tp.toLocaleString();

        // Position Sizing Logic
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1;
        const pips = Math.abs(res.entry - res.sl);
        const mult = res.entry > 1000 ? 100 : 10;
        const lots = pips > 0 ? (bal * (risk/100)) / (pips * mult) : 0;
        
        document.getElementById('lotText').innerText = lots.toFixed(2);
        document.getElementById('rrText').innerText = `1:${(Math.abs(res.tp - res.entry)/pips).toFixed(1)}`;
    }
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

async function processImage(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = e => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 1000 / Math.max(img.width, img.height);
                canvas.width = img.width * scale; canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({ inlineData: { mimeType: "image/jpeg", data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1] } });
            };
        };
    });
}
