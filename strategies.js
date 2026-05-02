/**
 * OMNI-BLACK | VERSION 51.3 (REAL-MARKET SCALPER)
 * Hardware: Gemini 2.5 Flash
 * Mandate: Aggressive Scalping, 15-Word Logic, Zero-Null Shield
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
        btn.innerText = "EXTRACTING LIVE DATA...";
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
        
        // Render with the Null-Pointer Shield
        renderOutput(analysis);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        // Shield against 'null' property crashes (Ref: 1000040862.jpg)
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
        PROTOCOL: OMNI_V51_REAL_MARKET
        CONTEXT: Live Scalping Session (SOL, ETH, BTC, XAUUSD).
        
        MANDATE:
        1. REAL ANALYSIS: Read EXACT prices from the Y-axis and current candles. No simulations.
        2. 8-CORE ENGINE: Apply SMC, ICT, Wyckoff, PA, and DXY correlation.
        3. AGGRESSIVE BIAS: Prioritize immediate BUY/SELL setups. Only use "WATCHING" if price is in a dead-zone.
        4. WORD LIMIT: Provide the "logic" field in exactly 10-15 words.
        5. STYLE: Hard technical analysis. No fluff.

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
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
                temperature: 0.1,
                top_p: 1
            }
        })
    });

    if (!response.ok) throw new Error("API Link Failed. Verify Key and 2.5-Flash status.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // NULL-POINTER SHIELD: Prevents 'innerText' errors from missing IDs
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Update Header
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

    // Update Numerical Values (Matches slVal/tpVal in your HTML)
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Update Surgical Logic [Ref: 1000040863.jpg for layout]
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[LIVE CONFLUENCE: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Surgical Risk Math for Scalping
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
