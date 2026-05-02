/**
 * OMNI-BLACK | VERSION 48 (ULTIMATE)
 * Includes: 8-Core Strategy, Vision Shield, & "Wait/Watch" Logic
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Minimum 2 timeframe layers required for confluence.");
        return;
    }

    if (btn) {
        btn.innerText = "WAITING FOR CONFLUENCE...";
        btn.disabled = true;
    }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: API Key missing.");

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
        alert("SYSTEM ALERT: " + err.message);
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
        PROTOCOL: OMNI_SURGICAL_V48
        STRATEGY: 8-CORE (SMC, ICT, S&R, S&D, Wyckoff, Elliott, Price Action, DXY)
        
        MANDATE: 
        - DO NOT rush entries. "Wait and Watch" for institutional confluence.
        - Identify "Watch Points" (e.g., Liquidity sweeps or FVG taps) before confirming Bias.
        - Use Vision Shield to read Price Scales (Y-axis) and Tickers with 10/10 precision.
        
        RETURN JSON:
        {
          "assetName": "Detected Ticker",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"NO TRADE",
          "entry": number, "sl": number, "tp": number,
          "logic": "Explain what we were waiting for and why the watch point triggered."
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
    if (!response.ok) throw new Error("API Connection Failed.");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    const safeSetText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    const header = document.querySelector('.label-vibrant');
    if (header) header.innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    const biasEl = document.getElementById('biasTxt');
    if (biasEl) {
        biasEl.innerText = data.bias;
        biasEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    safeSetText('entVal', data.entry || "--");
    safeSetText('slVal', data.sl || "--");
    safeSetText('tpVal', data.tp || "--");

    const logicBox = document.getElementById('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[MODE: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let finalSize = 0;
        if (priceDiff > 0) {
            if (data.assetType === "CRYPTO") finalSize = riskAmount / priceDiff;
            else if (data.assetType === "FOREX") finalSize = riskAmount / (priceDiff * 10);
            else if (data.assetType === "COMMODITY") finalSize = riskAmount / (priceDiff * 100);
            safeSetText('lotVal', finalSize.toFixed(4));
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
