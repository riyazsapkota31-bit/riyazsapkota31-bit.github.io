/**
 * OMNI-BLACK: THE SURGICAL SCALPER (V37 - FINAL PRECISION)
 * Focus: High-Frequency Scalping, Liquidity Hunting, Micro-Lot Accuracy
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    if (files.filter(f => f).length < 3) {
        alert("PRECISION ERROR: Scalping requires 1H, 15M, and 1M layers for 10/10 accuracy.");
        return;
    }

    btn.innerText = "HUNTING LIQUIDITY...";
    btn.disabled = true;

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        const b64Images = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        
        // The V37 Neural Request
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        renderOutput(analysis);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("ANALYSIS FAILED: Ensure your screenshots show clear price axes.");
    } finally {
        btn.innerText = "EXECUTE COMMAND";
        btn.disabled = false;
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: ELITE SCALPER V37. 
        MANDATE: Identify "A+" setups only. Ignore everything else.
        
        ASSET IDENTIFICATION: Locate ticker/pair name and categorize (CRYPTO/FOREX/GOLD).
        
        SMC/ICT SCALPING RULES:
        1. LIQUIDITY: Find the most recent "Liquidity Sweep" (Stop Hunt). Do not enter before a sweep.
        2. STRUCTURE: Identify the Market Structure Shift (MSS) on the 1M chart.
        3. VALUE: Entry must be in a 15M Fair Value Gaps (FVG) or Order Block.
        4. CORRELATION: If USD-pair, DXY must show inverse strength/weakness.
        
        SCALPING RATIO: Minimum 1:3 RR. If TP is not 3x the SL distance, return "NO TRADE".
        
        RETURN JSON:
        {
          "assetName": "Detected Ticker",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "bias": "BUY"|"SELL"|"NO TRADE",
          "entry": precise_price,
          "sl": precise_price,
          "tp": precise_price,
          "logic": "Point-by-point confluence: Sweep + MSS + FVG."
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
                temperature: 0.0, // ABSOLUTE ZERO: No creativity, only math/logic
                top_p: 1
            }
        })
    });

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const biasEl = document.getElementById('biasTxt');
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // UI Feedback
    document.querySelector('.label-vibrant').innerText = `${data.assetName || 'Market'} Scalp-Scan`;
    
    biasEl.innerText = data.bias;
    if (data.bias === "BUY") {
        biasEl.className = "text-8xl font-black italic tracking-tighter text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]";
    } else if (data.bias === "SELL") {
        biasEl.className = "text-8xl font-black italic tracking-tighter text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]";
    } else {
        biasEl.className = "text-8xl font-black italic tracking-tighter text-slate-500";
    }

    document.getElementById('entVal').innerText = data.entry || "--";
    document.getElementById('slVal').innerText = data.sl || "--";
    document.getElementById('tpVal').innerText = data.tp || "--";
    document.getElementById('logicSummary').innerHTML = `<span class="text-cyan-400 font-bold">CONFLUENCE:</span> ${data.logic}`;

    // ⚡️ PRECISION MATH
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let finalSize = 0;

        if (data.assetType === "CRYPTO") {
            finalSize = riskAmount / priceDiff;
        } else if (data.assetType === "FOREX") {
            finalSize = riskAmount / (priceDiff * 10);
        } else if (data.assetType === "COMMODITY") {
            finalSize = riskAmount / (priceDiff * 100);
        }

        // Display with high precision for scalping quantities
        document.getElementById('lotVal').innerText = finalSize.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4});
    } else {
        document.getElementById('lotVal').innerText = "0.00";
    }
}

function toBase64(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
        r.onerror = e => rej(e);
    });
}
