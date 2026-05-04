/**
 * OMNI-BLACK | VERSION 51.7 (THE FINAL DIRECTIVE)
 * Core: 8-Core Aggregator (SMC, ICT, VSA, PA, Wyckoff, Fib, Mean Rev, Elliott)
 * Risk: Hard 1:2 RR Gate | XM Broker Normalization
 * Layout Sync: Updated for Surgical Result Box IDs
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('scanBtn');
    const out = document.getElementById('resultBox');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "COUNCIL OF 8 ANALYZING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- HARD-CODED RR CALCULATION ---
        const risk = Math.abs(analysis.entry - analysis.sl);
        const reward = Math.abs(analysis.tp - analysis.entry);
        const currentRR = risk > 0 ? (reward / risk) : 0;

        // --- 1:2 RR HARD-GATE & POI PROTOCOL ---
        if (analysis.bias !== "WATCHING" && currentRR < 2) {
            analysis.bias = "WATCHING";
            analysis.tradeType = "RR INVALID";
            analysis.logic = "Setup downgraded to WATCHING; Risk-to-Reward ratio calculated below 1:2 threshold.";
            if (!analysis.poi) analysis.poi = analysis.entry; 
        }

        renderOutput(analysis, currentRR);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error("System Crash Prevented:", err);
        if (!err.message.includes('undefined')) alert("ALERT: " + err.message);
    } finally {
        if (btn) { btn.innerText = "Perform Surgical Scan"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V51_7_FINAL
        STRATEGY: 8-CORE AGGREGATOR (SMC, ICT, VSA, Price Action, Wyckoff, Fib, Mean Rev, Elliott)
        MANDATE:
        1. SELECTION: Evaluate Scalp vs Day Trade. Prioritize HIGHEST profit/RR.
        2. ACCURACY: Grade A/B+ only. Read raw Y-axis and X-axis OCR data.
        3. DXY: Analyze Box 4 (DXY) for trend confirmation.
        4. STRUCTURE: Detect FVG, MSS, Liquidity Sweeps, and Order Blocks.
        5. LOGIC: Exactly 10-15 words. Describe institutional footprint.
        6. JSON: Strictly return JSON only. 

        RETURN FORMAT:
        {
          "assetName": "STRING",
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "10-15 WORDS ONLY",
          "sup": "STRING",
          "res": "STRING"
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
            generationConfig: { response_mime_type: "application/json", temperature: 0.15 }
        })
    });

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Neural link failed. API returned empty candidate.");
    }
    
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data, currentRR) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // --- BIAS UI SHIELD (Surgical Layout Sync) ---
    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    // --- DATA DISPLAY (Mapping to New HTML IDs) ---
    update('entText', data.entry || "0.0000");
    update('slText', data.sl || "0.0000");
    update('tpText', data.tp || "0.0000");
    update('poiLevel', data.poi || "0.0000");
    update('logicText', data.logic);
    update('tradeTypeLabel', data.tradeType);
    update('supText', data.sup || "---");
    update('resText', data.res || "---");
    update('rrText', `1:${currentRR.toFixed(1)}`);

    // --- POI ZONE LOGIC ---
    const pz = ui('poiZone');
    if (pz) {
        data.bias === 'WATCHING' ? pz.classList.remove('hidden') : pz.classList.add('hidden');
    }

    // --- XM-CALIBRATED LOT MATH ---
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        if (priceDiff > 0) {
            let lotSize = riskAmount / priceDiff;
            // Handle common XM symbol normalization (Forex vs Crypto/Gold)
            if (data.assetName.includes("USD") && priceDiff < 1) lotSize /= 10; 
            update('lotText', lotSize.toFixed(4));
        }
    } else {
        update('lotText', "0.0000");
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
