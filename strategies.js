/**
 * OMNI-BLACK: STRATEGIC AGGREGATOR (V40)
 * Logic: Scans 8 Strategies, Picks the Dominant Confluence, Calculates Risk.
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Minimum 2 timeframe layers required.");
        return;
    }

    btn.innerText = "AGGREGATING STRATEGIES...";
    btn.disabled = true;

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        const b64Images = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        renderOutput(analysis);
        out.classList.remove('hidden');
    } catch (err) {
        alert("SCAN ERROR: " + err.message);
    } finally {
        btn.innerText = "EXECUTE COMMAND";
        btn.disabled = false;
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_STRATEGY_AGGREGATOR_V40
        
        MANDATE: Analyze charts using 8 core frameworks:
        1. SMC (Liquidity/Mitigation)
        2. S&R (Support/Resistance)
        3. S&D (Supply/Demand Zones)
        4. ICT (FVG/Silver Bullet)
        5. Wyckoff (Phases)
        6. Elliott Wave (Counts)
        7. Price Action (Candle Patterns)
        8. Correlation (DXY Influence)

        EXECUTION:
        - Scan all 8 strategies. 
        - Identify the "Dominant Strategy" for the current market state (Trend vs Range).
        - If 3+ strategies converge, provide a signal. 
        - Do not be overly conservative; prioritize High-Probability Momentum.

        RETURN JSON:
        {
          "assetName": "Detected Ticker",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "Name of the winning strategy",
          "bias": "BUY"|"SELL"|"NO TRADE",
          "entry": number, "sl": number, "tp": number,
          "logic": "Explain why the chosen strategy is best for this specific setup."
        }
    `;

    const inlineData = images.filter(img => img).map(b => ({ 
        inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } 
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...inlineData] }],
            generationConfig: { 
                response_mime_type: "application/json", 
                temperature: 0.2, // Low enough for math, high enough for strategic flexibility
                top_p: 1
            }
        })
    });

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const biasEl = document.getElementById('biasTxt');
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    document.querySelector('.label-vibrant').innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    biasEl.innerText = data.bias;
    biasEl.className = `text-8xl font-black italic tracking-tighter ${
        data.bias === 'BUY' ? 'text-emerald-400' : 
        data.bias === 'SELL' ? 'text-rose-500' : 
        'text-slate-500'
    }`;

    document.getElementById('entVal').innerText = data.entry || "--";
    document.getElementById('slVal').innerText = data.sl || "--";
    document.getElementById('tpVal').innerText = data.tp || "--";
    document.getElementById('logicSummary').innerHTML = `<b class="text-cyan-400 uppercase font-bold text-xs">[MODE: ${data.dominantStrategy}]</b><br>${data.logic}`;

    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let finalSize = 0;

        if (data.assetType === "CRYPTO") { finalSize = riskAmount / priceDiff; }
        else if (data.assetType === "FOREX") { finalSize = riskAmount / (priceDiff * 10); }
        else if (data.assetType === "COMMODITY") { finalSize = riskAmount / (priceDiff * 100); }

        document.getElementById('lotVal').innerText = finalSize.toFixed(3);
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
