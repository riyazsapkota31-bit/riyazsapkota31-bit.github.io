// --- OMNI-REAL INFINITY V8.2 ENGINE ---
let API_KEY = localStorage.getItem('omni_api_v3') || "";

/**
 * MODEL: Gemini 2.5 Flash Lite
 * Optimized for rapid multi-chart confluence scanning.
 */
const MODEL = "gemini-2.5-flash-lite-exp"; 

window.onload = () => { 
    if (API_KEY) lockUI(); 
};

// --- UI & DRAWER CONTROLS ---
function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    d.classList.toggle('open');
    o.classList.toggle('show');
    
    // FIX: Explicitly unfreeze inputs when drawer opens
    const inputs = ['bal', 'risk', 'apiInput'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
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
    lockUI();
    toggleDrawer();
    alert("Terminal Linked Successfully.");
}

function lockUI() {
    const input = document.getElementById('apiInput');
    if(input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
    }
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file'); // Triggers the green checkmark UI
    }
}

// --- MULTI-STRATEGY CONFLUENCE ENGINE ---
async function executeScan() {
    // 1. Validation & Quota Check
    if (!API_KEY) return alert("Terminal not linked. Enter API Key in Master Control.");
    
    const btn = document.getElementById('scanBtn');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Upload all 4 timeframe charts (1H, 15M, 1M, DXY).");

    btn.innerText = "ENGINE: RUNNING MULTI-STRATEGY SCAN...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        
        // 2. Multi-Strategy Prompting (SMC + ICT + Price Action)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: `Institutional Grade Analysis: 
                        Analyze the 4 provided charts for confluence across these strategies:
                        1. SMC: Identify Order Blocks, Fair Value Gaps (FVG), and liquidity pools.
                        2. ICT: Detect Liquidity Sweeps, Market Structure Shifts (MSS), and Displacements.
                        3. Price Action: Confirm Trend direction, Support/Resistance, and Chart Patterns.
                        
                        If market is consolidating or DXY contradicts, return 'WAIT'.
                        
                        Return ONLY valid JSON: {
                            "bias": "BUY|SELL|WAIT",
                            "score": number(1-10),
                            "entry": number,
                            "sl": number,
                            "tp": number,
                            "logic": "Detailed summary of SMC/ICT/PA alignment"
                        }` },
                        ...imageParts
                    ]
                }]
            })
        });

        // 3. Error Handling for Rate Limits (429)
        if (response.status === 429) {
            throw new Error("Quota Exhausted. Wait 2-5 minutes and try again.");
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(rawText.replace(/```json|```/gi, '').trim());
        
        renderResults(res);
    } catch (e) {
        console.error("Analysis Failed:", e);
        alert("ENGINE ERROR: " + e.message + "");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

// --- DYNAMIC UI RENDERING ---
function renderResults(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    const card = document.getElementById('signalCard');
    const tradeGrid = document.getElementById('tradeGrid');
    const waitGrid = document.getElementById('waitGrid');
    
    resultBox.classList.remove('hidden');
    resultBox.style.display = 'block';
    
    // Set Logic & Score
    document.getElementById('scoreBadge').innerText = `CONFLUENCE ${res.score}/10`;
    document.getElementById('logicText').innerText = res.logic;
    actionTxt.innerText = res.bias;

    // WAIT (No-Trade) State
    if (res.bias === 'WAIT') {
        tradeGrid.classList.add('hidden');
        tradeGrid.style.display = 'none';
        waitGrid.classList.remove('hidden');
        waitGrid.style.display = 'block';
        
        card.className = "signal-card wait-card p-6 mb-3";
        actionTxt.style.color = "#64748b"; // Neutral Grey
        document.getElementById('watchLevel').innerText = res.entry || "CONSIDER WAITING";
    } 
    // BUY/SELL State
    else {
        tradeGrid.classList.remove('hidden');
        tradeGrid.style.display = 'block';
        waitGrid.classList.add('hidden');
        waitGrid.style.display = 'none';
        
        card.className = (res.bias === 'BUY') ? "signal-card p-6 mb-3" : "signal-card sell-card p-6 mb-3";
        actionTxt.style.color = (res.bias === 'BUY') ? "#10b981" : "#ef4444";
        
        document.getElementById('entText').innerText = res.entry.toLocaleString();
        document.getElementById('slText').innerText = res.sl.toLocaleString();
        document.getElementById('tpText').innerText = res.tp.toLocaleString();

        // Position Sizing (Risk Management)
        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1;
        const pips = Math.abs(res.entry - res.sl);
        
        // Multiplier adjustment for different asset classes
        const mult = res.entry > 1000 ? 100 : 10; 
        const lots = pips > 0 ? (bal * (risk/100)) / (pips * mult) : 0;
        
        document.getElementById('lotText').innerText = lots.toFixed(2);
        document.getElementById('rrText').innerText = `1:${(Math.abs(res.tp - res.entry)/pips).toFixed(1)}`;
    }
    
    resultBox.scrollIntoView({ behavior: 'smooth' });
}

// --- IMAGE PRE-PROCESSING ---
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
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to Base64 for Gemini API
                const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                resolve({
                    inlineData: {
                        mimeType: "image/jpeg",
                        data: base64Data
                    }
                });
            };
        };
    });
}
