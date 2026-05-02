/**
 * OMNI-BLACK | VERSION 53.0 (ULTIMATE CONFLUENCE)
 * 8-Core Integration: S&R, S&D, SMC, ICT, Wyckoff, PA, DXY, Fibonacci
 * Mandate: Aggressive Scalp, 99% Precision, Auto-Asset Detect
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Confluence requires multi-timeframe perspective
    if (files.filter(f => f).length < 2) {
        alert("CONFLUENCE ERROR: Surgical 8-Core strike requires 1M + 15M/1H charts.");
        return;
    }

    if (btn) { btn.innerText = "SYNCHRONIZING 8-CORES..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: No API Key found.");

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
            console.error("System Fail:", err);
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
        PROTOCOL: OMNI_V53_ULTIMATE_STRIKE
        TASK: Auto-detect asset and run 8-CORE VALIDATION (S&R, S&D, SMC, ICT, Wyckoff, PA, DXY, Fibonacci).

        8-CORE MANDATE:
        1. ASSET: Auto-detect Ticker/Pair from image text.
        2. S&R/S&D: Identify major flips and origin zones (Rally-Base-Drop/Drop-Base-Rally).
        3. SMC/ICT: Locate Order Blocks, FVGs, and Liquidity Sweeps of local wicks.
        4. WYCKOFF: Confirm Spring or Sign of Strength (Accumulation/Distribution phase).
        5. PA/FIB: Use rejection candles and ensure entry is in OTE (Discount for Long/Premium for Short).
        6. AGGRESSION: High frequency. Execute on sweeps/inducements. Do not wait for late trends.
        7. ACCURACY: 99% target. Strict SL/TP based on structural lows/highs.
        8. LOGIC: 10-15 words only. Identify exactly which liquidity was swept.

        OUTPUT JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "8-CORE_ULTIMATE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "STRING (10-15 WORDS)"
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
                temperature: 0.1, 
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

    // Dynamic Asset Display
    update('assetTitle', data.assetName || "DETECTING...");

    // Bias Styling
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // Surgical Entry/Exit
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Strategy & 10-15 Word Logic Summary
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `
            <div class="flex items-center gap-2 mb-1">
                <span class="bg-cyan-500/20 text-cyan-400 text-[10px] px-1 rounded border border-cyan-500/30 font-bold">8-CORE ACTIVE</span>
                <span class="text-slate-500 text-[10px] uppercase font-bold tracking-widest">${data.dominantStrategy}</span>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">${data.logic}</p>
        `;
    }

    // Advanced Risk/Position Math
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            // Normalization per asset class
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
