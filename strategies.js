/**
 * OMNI-BLACK | VERSION 49 (FINAL HARDENED)
 * Features: 8-Core Strategy, "Wait/Watch" Logic, & Null-Pointer Shield.
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // 1. Initial Logic Check
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Add at least 2 chart layers (e.g., 1H and 15M).");
        return;
    }

    if (btn) {
        btn.innerText = "WAITING FOR CONFLUENCE...";
        btn.disabled = true;
    }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: No API Key found.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // 2. Execute 2.5-Flash Neural Analysis
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // 3. Render results with Safety Shield
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        // Suppress alert for UI-only issues, only show critical link errors
        if (!err.message.includes('null')) alert("SYSTEM ALERT: " + err.message);
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
        PROTOCOL: OMNI_SURGICAL_V49
        STRATEGY: 8-CORE (SMC, ICT, S&R, S&D, Wyckoff, Elliott, Price Action, DXY Correlation)
        
        MANDATE: 
        - "Wait and Watch" Logic: If structure is weak, define a "WATCH POINT" price.
        - Institutional Confluence: Require alignment between at least 3 strategies.
        - Read Y-axis Price Labels and Tickers with 10/10 precision.
        
        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "Explain the watch point or setup confluence."
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
    if (!response.ok) throw new Error("Both 2.5 models failed. Check your API Key.");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // NULL-POINTER SHIELD: Prevents 'innerText' errors
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Update Header
    const header = document.querySelector('.label-vibrant');
    if (header) header.innerText = `${data.assetName || 'Scanning...'} - ${data.dominantStrategy}`;
    
    // Update Bias
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

    // Update Strategic Logic
    const lBox = ui('logicSummary');
    if (lBox) {
        lBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[WATCH POINT: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Surgical Math
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
