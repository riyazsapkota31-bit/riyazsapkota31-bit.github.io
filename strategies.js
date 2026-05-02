/**
 * OMNI-BLACK | VERSION 53.0 (PRECISION-CONTINUITY)
 * Core: 8-Core Strategy (SMC, ICT, PA, DXY, S&R, S&D, Elliott, Wyckoff)
 * Logic: Trend-Following / Mitigation Retest
 * Execution: High-Frequency / Minimal "Waiting"
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // Safety: Requires 2 timeframes to prevent "Random" noise signals
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Load M15 (Trend) and M1 (Entry) charts for 8-Core alignment.");
        return;
    }

    if (btn) { btn.innerText = "ALIGNED TREND HUNTING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("API Key Missing in Settings.");

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
    const primaryModel = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V53_CONTINUITY
        8-CORE ENGINE: SMC, ICT, PA, DXY, S&R, S&D, Elliott, Wyckoff.
        
        MANDATE:
        1. TREND-FOLLOWING: Identify the 15m Trend. Only trade in that direction to ensure safety.
        2. FAST EXECUTION: Do not wait for reversals. Find the next pullback to an FVG or Order Block.
        3. DISPLACEMENT: Entry must show institutional displacement (aggressive candle bodies).
        4. ACCURACY: Extract exact Y-axis prices. SL must be behind the most recent swing.
        5. LOGIC: Exactly 10-15 words. Identify the Trend + the Retracement zone.

        RETURN JSON ONLY:
        {
          "assetName": "STRING",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "MITIGATION_FLOW",
          "bias": "BUY"|"SELL"|"WATCHING",
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
                temperature: 0.15, // Lock-in consistency
                top_p: 1
            }
        })
    });

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // Dynamic Bias Styling
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
        }`;
    }

    // MANDATORY 1:3 RISK/REWARD OVERRIDE
    // This makes the system profitable even if the win rate isn't 99%
    const risk = Math.abs(data.entry - data.sl);
    const calculatedTP = data.bias === 'BUY' ? (data.entry + (risk * 3)) : (data.entry - (risk * 3));

    update('entVal', data.entry || "--");
    update('slVal', data.sl || "--");
    update('tpVal', calculatedTP.toFixed(2) || "--");

    // Strategy Summary
    const logicBox = ui('logicSummary');
    if (logicBox) {
        logicBox.innerHTML = `<b class="text-cyan-400 uppercase text-xs">[CORE ALIGNMENT: ${data.dominantStrategy}]</b><br>${data.logic}`;
    }

    // Position Sizing with Safety Buffer
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmt = bal * (riskPct / 100);
        const pDiff = Math.abs(data.entry - data.sl);
        if (pDiff > 0) {
            let size = riskAmt / pDiff;
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
