/**
 * OMNI-BLACK | VERSION 50 (ULTIMATE HARDENED)
 * Target Hardware: Gemini 2.5 Flash Ecosystem
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: 2 timeframe layers required for confluence.");
        return;
    }

    if (btn) {
        btn.innerText = "WAITING FOR CONFLUENCE...";
        btn.disabled = true;
    }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Link API in Settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // Targeted 2.5-Flash Analysis
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        // Shield against 'null' property crashes in the UI
        if (!err.message.includes('null')) alert("SYSTEM ALERT: " + err.message);
    } finally {
        if (btn) {
            btn.innerText = "EXECUTE COMMAND";
            btn.disabled = false;
        }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-2.5-flash"; // Strict Lock via Compatibility Report
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_SURGICAL_V50
        MODELS: GEMINI-2.5-FLASH
        
        MANDATE: 8-CORE STRATEGIC ENGINE (SMC, ICT, S&R, S&D, Wyckoff, Elliott, Price Action, DXY Correlation).
        
        WAIT & WATCH FEATURE:
        - If setup is incomplete, define a "WATCH POINT" price.
        - Explain what must happen before planning the trading setup.
        
        VISION SHIELD:
        - Read Price Scales (Y-axis) and Tickers (SOL, ETH, XAUUSD) with 10/10 precision.
        
        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "Detailed watch point or confluence breakdown."
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
            generationConfig: { response_mime_type: "application/json", temperature: 0.2 }
        })
    });

    if (!response.ok) return await fetchFallbackLite(key, images, prompt);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
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
    if (!response.ok) throw new Error("API Connection Failed: Check your Key.");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // NULL-POINTER SHIELD: Prevents the 'innerText' system errors
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    const header = document.querySelector('.label-vibrant');
    if (header) header.innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[WATCH POINT: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            if (data.assetType === "FOREX") size /= 10;
            if (data.assetType === "COMMODITY") size /= 100;
            update('lotVal', size.toFixed(4));
        }
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
