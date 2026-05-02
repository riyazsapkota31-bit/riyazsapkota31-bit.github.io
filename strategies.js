/**
 * OMNI-BLACK | VERSION 51 (FINAL SYNC)
 * Hardware Target: Gemini 2.5 Flash
 * Features: 8-Core Strategy, Wait & Watch Point, Null-Pointer Shield, 15-Word Logic Limit
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) {
        btn.innerText = "HUNTING LIQUIDITY...";
        btn.disabled = true;
    }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Link API in Settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // Execute Neural Analysis via Gemini 2.5 Flash
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // Execute UI rendering with Safety Shield
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        // Shield against 'null' property crashes in the UI (Ref: 1000040862.jpg)
        if (!err.message.includes('null')) {
            console.error("Core Fail:", err);
            alert("SYSTEM ALERT: " + err.message);
        }
    } finally {
        if (btn) {
            btn.innerText = "EXECUTE COMMAND";
            btn.disabled = false;
        }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V51_SURGICAL
        STRATEGY_ENGINE: 8-CORE (SMC, ICT, S&R, S&D, Wyckoff, Elliott, PA, DXY)
        
        MANDATE:
        1. Identify Institutional Footprints (Liquidity Sweeps, FVGs).
        2. WAIT & WATCH LOGIC: If a setup is not yet high-probability, bias must be "WATCHING".
        3. DEFINE WATCH POINT: Clearly state the price level or candle behavior.
        4. PRECISION: Read Y-axis labels and asset tickers with 10/10 accuracy.

        STRICT LOGIC FORMAT: 
        - Provide the "logic" field in exactly 10-15 words.
        - Be technical. No fluff. Apply this limit to BUY, SELL, and WATCHING scenarios.
        - Example: "Wait for 15m FVG tap at 2304.50 to confirm institutional buy-side liquidity sweep."

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "STRING"
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
                temperature: 0.1 
            }
        })
    });

    if (!response.ok) throw new Error("API Link Failed. Check your Key and 2.5-Flash status.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // NULL-POINTER SHIELD: Prevents the 'innerText' system errors from 1000040862.jpg
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Update Header Asset Name & Strategy
    const header = document.querySelector('.label-vibrant');
    if (header) header.innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    // Update Bias with Dynamic Color
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // Update Values in the Grid (Syncs with your slVal/tpVal IDs)
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Update Surgical Logic / Watch Point
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[CONFLUENCE: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Surgical Risk Math
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
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
