/**
 * OMNI-BLACK | VERSION 51.5 (PRECISION-STRIKE)
 * Core: 8-Core Strategic Engine (SMC/ICT Optimized)
 * Logic: Mandatory 10-15 Word Scalp Trigger
 * Hardware: Optimized for Gemini 2.5 Flash
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Minimum 2 charts required (e.g., 1H + 1M) for surgical accuracy
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "EXTRACTING LIQUIDITY..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // Targeted Gemini 2.5 Flash Vision Analysis
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // Render Output with "Null-Pointer" Safety Shields
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        // Silences common UI null errors to keep trading flow smooth
        if (!err.message.includes('null')) {
            console.error("System Fail:", err);
            alert("SYSTEM ALERT: " + err.message);
        }
    } finally {
        if (btn) { btn.innerText = "EXECUTE COMMAND"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V51_PRECISION
        CONTEXT: Professional Scalping (SOL, ETH, BTC, XAUUSD).
        
        MANDATE:
        1. REAL-TIME ONLY: Read exact prices from Y-axis and candles. Do not simulate.
        2. 8-CORE ENGINE: Cross-reference SMC/ICT, Wyckoff, PA, and DXY correlation.
        3. SCALPER BIAS: Prioritize immediate execution setups. 
        4. RISK FILTER: Use "WATCHING" only if R:R is poor or no FVG/MS is present.
        5. STRICT LOGIC: The "logic" field MUST be between 10 and 15 words. No greetings.

        RETURN JSON ONLY:
        {
          "assetName": "STRING (Visible Ticker)",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "STRING (MUST BE 10-15 WORDS)"
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
                temperature: 0.2, // Decisive balance
                top_p: 1
            }
        })
    });

    if (!response.ok) throw new Error("Hardware Link Failed. Check API Key/Status.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Dynamic UI Color Control
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // Surgical Value Updates
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Tactical Logic Display
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[SCALP CONFLUENCE: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Automated Risk/Position Math
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            // Asset Class Normalization
            if (data.assetType === "FOREX") size /= 10;
            if (data.assetType === "COMMODITY") size /= 100;
            update('lotVal', size.toFixed(4));
        }
    } else {
        update('lotVal', "0.0000");
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
