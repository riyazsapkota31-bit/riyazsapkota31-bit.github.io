/**
 * OMNI-BLACK | VERSION 52.8 (8-CORE SURGICAL STRIKE)
 * Full Integration: Aggressive Scalping + 99% Accuracy + Auto-Asset Detection
 * Hardware: Gemini 3 Flash (Mobile Optimized)
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Upload 1M + 15M charts for surgical accuracy.");
        return;
    }

    if (btn) { btn.innerText = "8-CORE HUNTING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key.");

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
            console.error("System Error:", err);
            alert("ALERT: " + err.message);
        }
    } finally {
        if (btn) { btn.innerText = "EXECUTE COMMAND"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const primaryModel = "gemini-3-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V52_8CORE_AGGRESSIVE
        MANDATE:
        1. ASSET: Auto-detect ticker from chart visuals.
        2. STRATEGY: 8-Core ICT/SMC (Liquidity Sweeps, FVGs, Breakers).
        3. AGGRESSION: High frequency. Do not wait for trend confirmation if a sweep and rejection occurs.
        4. ACCURACY: 99% target. Strict SL/TP based on market structure.
        5. DXY: Mandatory correlation check.
        6. LOGIC: Exactly 10-15 words. No fluff.

        JSON FORMAT ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "8-CORE_STRIKE",
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

    if (!response.ok) throw new Error("Link Failed.");
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    update('assetTitle', data.assetName);

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
        logicBox.innerHTML = `<b class="text-cyan-400 text-xs">[8-CORE STRIKE]</b><br>${data.logic}`;
    }

    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let size = riskAmount / priceDiff;
            if (data.assetType === "FOREX") size /= 10;
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
