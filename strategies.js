/**
 * OMNI-BLACK | VERSION 51 (FINAL SYNC)
 * Hardware Target: Gemini 2.5 Flash
 * Features: 8-Core Strategy, Wait & Watch Point, Null-Pointer Shield
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Check for minimum chart requirements
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

        // Targeted 2.5-Flash Neural Analysis
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // Execute UI rendering with Safety Shield
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        // Shield against 'null' property crashes in the UI
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
        STRATEGY_ENGINE: 8-CORE (SMC, ICT, S&R, S&D, Wyckoff, Elliott, Price Action, DXY)
        
        MANDATE:
        - Identify Institutional Footprints (Liquidity Sweeps, FVGs).
        - WAIT & WATCH LOGIC: If a setup is not yet high-probability, bias must be "WATCHING".
        - DEFINE WATCH POINT: Clearly state the price level or candle behavior to wait for.
        - Precision: Read Y-axis labels and asset tickers with 10/10 accuracy.

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "Detailed watch point or strategic confluence breakdown."
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
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    if (!response.ok) throw new Error("API Link Failed. Verify your Key and 2.5-Flash status.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // NULL-POINTER SHIELD: Prevents 'innerText' errors if IDs are missing
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Update Header Asset Name
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

    // Update Numerical Values
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Update Strategic Logic / Watch Point
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[WATCH POINT: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Surgical Risk Math
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            // Adjust for Asset Classes
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
