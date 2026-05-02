let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-exp"; 

window.onload = () => { if (API_KEY) lockUI(); };

async function executeScan() {
    if (!API_KEY) return alert("Terminal Link Required.");
    const btn = document.getElementById('scanBtn');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Upload all 4 Confluence Charts.");

    btn.innerText = "RUNNING MULTI-STRATEGY ENGINE...";
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
                        { text: `Perform a Multi-Strategy Institutional Scan on these charts. 
                        1. SMC: Identify Fair Value Gaps (FVG) and Order Blocks.
                        2. ICT: Check for Liquidity Sweeps (Buy-side/Sell-side) and Market Structure Shifts (MSS).
                        3. Price Action: Identify key Support/Resistance and Trend Confluence.
                        
                        Return ONLY raw JSON: {
                            "strategy_breakdown": {
                                "smc": "string",
                                "ict": "string",
                                "pa": "string"
                            },
                            "bias": "BUY|SELL|WAIT",
                            "score": number(1-10),
                            "entry": number, "sl": number, "tp": number,
                            "logic": "1 sentence confluence summary"
                        }` },
                        ...imageParts
                    ]
                }]
            })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/gi, '').trim());
        renderMultiStrategyResults(res);
    } catch (e) {
        console.error(e);
        alert("ENGINE ERROR: Model rejected the confluence scan.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderMultiStrategyResults(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    const card = document.getElementById('signalCard');
    
    resultBox.style.display = 'block';
    actionTxt.innerText = res.bias;
    document.getElementById('scoreBadge').innerText = `CONFLUENCE: ${res.score}/10`;
    
    // Combine the strategy breakdown into the logic view
    const breakdown = `[SMC: ${res.strategy_breakdown.smc}] [ICT: ${res.strategy_breakdown.ict}] [PA: ${res.strategy_breakdown.pa}]`;
    document.getElementById('logicText').innerText = `${res.logic} | ${breakdown}`;

    if (res.bias === 'WAIT') {
        document.getElementById('tradeGrid').style.display = 'none';
        document.getElementById('waitGrid').style.display = 'block';
        card.className = "signal-card wait-card";
        actionTxt.style.color = "#64748b";
        document.getElementById('watchLevel').innerText = res.entry || "---";
    } else {
        document.getElementById('tradeGrid').style.display = 'block';
        document.getElementById('waitGrid').style.display = 'none';
        card.className = res.bias === 'BUY' ? "signal-card" : "signal-card sell-card";
        actionTxt.style.color = res.bias === 'BUY' ? "#10b981" : "#ef4444";
        
        document.getElementById('entText').innerText = res.entry.toLocaleString();
        document.getElementById('slText').innerText = res.sl.toLocaleString();
        document.getElementById('tpText').innerText = res.tp.toLocaleString();

        // Calculate Position Size
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
