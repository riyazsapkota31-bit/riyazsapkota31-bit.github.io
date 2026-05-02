/**
 * OMNI-BLACK | VERSION 52.8 (8-CORE SURGICAL STRIKE)
 * Core: 8-Core ICT/SMC Logic (Liquidity, Inducement, Breakers)
 * AI: Gemini 3 Flash Optimized for Multi-Timeframe Vision
 * Mandate: Auto-Asset Detection & High-Frequency Accuracy
 */

let files = [null, null, null, null];

// Entry point for analysis
async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Requires multiple layers (e.g., 1H for trend, 1M for entry)
    if (files.filter(f => f).length < 2) {
        alert("CONFLUENCE ERROR: Please upload at least 2 timeframes for 8-Core verification.");
        return;
    }

    if (btn) { btn.innerText = "8-CORE SCANNING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        if (!err.message.includes('null')) {
            console.error("Critical System Fail:", err);
            alert("SYSTEM ALERT: " + err.message);
        }
    } finally {
        if (btn) { btn.innerText = "EXECUTE COMMAND"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-3-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V52_8CORE_Surgical
        TASK: Auto-detect asset from chart and execute 8-Core Strategy.

        8-CORE STRATEGIC MANDATE:
        1. ASSET DETECTION: Identify the ticker (SOL, ETH, BTC, etc.) from the image text.
        2. LIQUIDITY: Prioritize entries immediately after a Liquidity Sweep (Stop Hunt).
        3. INDUCEMENT: Scan for retail "Trap" volume before issuing a bias.
        4. BREAKER/FVG: Entry MUST be at a Breaker Block or Fair Value Gap after displacement.
        5. HTF SYNC: Ensure the 1m scalp aligns with the 15m/1h draw on liquidity.
        6. DXY FILTER: Invert bias if DXY is hitting a major reversal zone.
        7. ACCURACY: Target 99% accuracy; minimize "WATCHING" by hunting aggressive sweeps.
        8. LOGIC: The "logic" field MUST be 10-15 words. No greetings.

        RETURN JSON:
        {
          "assetName": "STRING (DETECTED TICKER)",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "8-CORE_LIQUIDITY_STRIKE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "STRING (10-15 WORDS ONLY)"
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
                temperature: 0.1, // Near-zero for mechanical precision
                top_p: 1
            }
        })
    });

    if (!response.ok) throw new Error("Hardware Link Failed. Check API Status.");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Update Asset Name based on AI detection
    update('assetTitle', data.assetName || "UNKNOWN ASSET");

    // Bias Styling
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // Values
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Strategy & Logic
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[8-CORE CONFLUENCE: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Risk Management Math
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            // Asset class normalization for sizing
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
