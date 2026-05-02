/**
 * OMNI-BLACK | VERSION 51.5 (PRECISION-STRIKE)
 * Core: 8-Core Strategic Engine (SMC/ICT/PA/DXY)
 * Logic: Strict 10-15 Word Scalp Trigger
 * Status: High-Frequency Optimized
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: 2 timeframe layers required.");
        return;
    }

    if (btn) { btn.innerText = "SCANNING LIQUIDITY..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Link API Key in Settings.");

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
        // Null Shield: Prevents UI crashes from missing HTML IDs
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
        PROTOCOL: OMNI_V51_PRECISION
        STRATEGY: 8-CORE SCALPER (SMC, ICT, Wyckoff, PA, S&R, S&D, Elliott, DXY)
        
        MANDATE:
        1. FREQUENT SCALPS: Focus on 1m/5m FVG and Liquidity Sweeps for rapid entries.
        2. SAFETY FILTER: Ensure at least 3-core confluence before a BUY/SELL bias.
        3. REAL DATA: Use actual Y-axis price levels from images. No simulations.
        4. LOGIC LIMIT: The "logic" field MUST be exactly 10-15 words. No fluff.
        5. BIAS: Prioritize execution signals. Use "WATCHING" only for total dead-zones.

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "STRING",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number,
          "logic": "10-15 WORDS ONLY"
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
                temperature: 0.25, // Sharp but decisive
                top_p: 1
            }
        })
    });

    if (!response.ok) throw new Error("API Link Failed. Check your Key.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Dynamic Bias Color Styling
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // Surgical UI Updates
    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', data.tp || "--");

    // Tactical Logic Output
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[SCALP TRIGGER: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Position Sizing Calculation
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
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
