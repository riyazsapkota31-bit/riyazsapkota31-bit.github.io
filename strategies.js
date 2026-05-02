/**
 * OMNI-BLACK ANALYTIC ENGINE | VERSION 46
 * Architecture: Surgical Scalper / 8-Strategy Confluence
 * Target Hardware: Gemini 2.5 Flash & 2.5 Flash-Lite
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Safety check for timeframe layers
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Confluence requires at least 2 timeframe layers.");
        return;
    }

    btn.innerText = "AGGREGATING STRATEGIES...";
    btn.disabled = true;

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Link API in Settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // Targeted 2.5-Flash Logic
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        renderOutput(analysis);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        alert("SYSTEM ERROR: " + err.message);
    } finally {
        btn.innerText = "EXECUTE COMMAND";
        btn.disabled = false;
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_SURGICAL_V46
        MODEL_LOCK: GEMINI_2.5_FLASH
        
        MANDATE: Analyze charts through the 8-CORE STRATEGIC ENGINE:
        1. SMC (Liquidity/Orderblocks)
        2. ICT (Fair Value Gaps/Silver Bullet)
        3. Support & Resistance (Classic S&R)
        4. Supply & Demand (Zone Mitigations)
        5. Wyckoff (Accumulation/Distribution Phases)
        6. Elliott Wave (Trend Maturity)
        7. Price Action (Candlestick Formations)
        8. Market Correlation (DXY Inverse Influence)

        SCALPER SETTINGS: 
        - Prioritize Momentum and Entries. Do NOT favor "No Trade" unless structurally broken.
        - Analyze the 1M/15M for immediate execution.
        
        VISION INSTRUCTIONS: 
        - Read Price Scales (Y-axis) with 10/10 precision.
        - Detect Ticker (e.g., SOL, ETH, XAUUSD) to select math formula.
        - Disregard UI overlays. Focus on Candle Wicks and Price Labels.

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE",
          "entry": number, "sl": number, "tp": number,
          "logic": "Detailed confluence reasoning."
        }
    `;

    const inlineData = images.filter(img => img).map(b => ({ 
        inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } 
    }));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, ...inlineData] }],
                generationConfig: { 
                    response_mime_type: "application/json", 
                    temperature: 0.2 // Balanced for creative strategy + math precision
                }
            })
        });

        if (!response.ok) {
            // REDUNDANCY: Try 2.5-Flash-Lite if Primary fails
            return await fetchFallbackLite(key, images, prompt);
        }

        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
        throw new Error("NEURAL LINK FAILURE: Verify API Key and 2.5 Access.");
    }
}

async function fetchFallbackLite(key, images, promptText) {
    const liteModel = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${liteModel}:generateContent?key=${key}`;
    
    const inlineData = images.filter(img => img).map(b => ({ 
        inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } 
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.2 }
        })
    });

    if (!response.ok) throw new Error("CRITICAL FAILURE: 2.5-Flash Architecture Unresponsive.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    // 1. Pull Saved Hardware Data
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // 2. Update UI with Strategy Header
    document.querySelector('.label-vibrant').innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    const biasEl = document.getElementById('biasTxt');
    biasEl.innerText = data.bias;
    biasEl.className = `text-8xl font-black italic tracking-tighter ${
        data.bias === 'BUY' ? 'text-emerald-400' : 
        data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
    }`;

    // 3. Populate Price Fields
    document.getElementById('entVal').innerText = data.entry || "--";
    document.getElementById('slVal').innerText = data.sl || "--";
    document.getElementById('tpVal').innerText = data.tp || "--";
    document.getElementById('logicSummary').innerHTML = `<b class="text-cyan-400 uppercase text-xs tracking-tighter">[MODE: ${data.dominantStrategy}]</b><br>${data.logic}`;

    // 4. Surgical Lot Calculation
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let finalSize = 0;

        if (priceDiff > 0) {
            if (data.assetType === "CRYPTO") {
                finalSize = riskAmount / priceDiff;
            } else if (data.assetType === "FOREX") {
                finalSize = riskAmount / (priceDiff * 10);
            } else if (data.assetType === "COMMODITY") {
                finalSize = riskAmount / (priceDiff * 100);
            }
            document.getElementById('lotVal').innerText = finalSize.toFixed(4);
        }
    } else {
        document.getElementById('lotVal').innerText = "0.00";
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
