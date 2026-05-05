/**
 * OMNI-BLACK | VERSION 53.0 (PRECISION RISK & HIGH RR PROTOCOL)
 * Mandate: Asset-specific scaling, Spread inclusion, and Aggressive SL placement.
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('scanBtn');
    const out = document.getElementById('resultBox');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "SURGICAL CALCULATION IN PROGRESS..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- 1. PROXIMITY GATE: Await Retracement Logic ---
        const priceToEntryGap = Math.abs(analysis.currentPrice - analysis.entry);
        const allowedGap = Math.abs(analysis.entry - analysis.sl) * 0.3; // Tightened buffer

        if (priceToEntryGap > allowedGap && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = `Price overextended (${priceToEntryGap.toFixed(2)}). Await POI retracement.`;
        }

        // --- 2. CALCULATE REAL RR (Including Spread) ---
        const asset = (analysis.assetName || "").toUpperCase();
        let spreadBuffer = asset.includes("OIL") || asset.includes("WTI") ? 0.03 : 
                           asset.includes("XAU") || asset.includes("GOLD") ? 0.20 : 0.01;

        const riskPoints = Math.abs(analysis.entry - analysis.sl) + spreadBuffer;
        const rewardPoints = Math.abs(analysis.tp - analysis.entry) - spreadBuffer;
        const currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        // --- 3. RR GATE: High Performance Filter ---
        if (analysis.bias !== "WATCHING" && currentRR < 2) {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = `RR 1:${currentRR.toFixed(1)} insufficient. Awaiting higher-precision entry.`;
        }

        renderOutput(analysis, currentRR, spreadBuffer);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error("System Crash:", err);
        alert("CRITICAL ERROR: " + err.message);
    } finally {
        if (btn) { btn.innerText = "Perform Surgical Scan"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V53_PRECISION
        MANDATE: Read charts with 100% precision. 
        HIGH RR TARGET: Place Stop Loss strictly at the nearest 1m candle wick/structural break. 
        Aim for 1:2 to 1:8 Risk/Reward ratio if market structure allows.
        JSON ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "MAX 12 WORDS",
          "sup": "STRING", "res": "STRING"
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

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
}

function renderOutput(data, currentRR, spread) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val || "---"; };

    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias || "WATCHING";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    update('entText', data.entry);
    update('slText', data.sl);
    update('tpText', data.tp);
    update('poiLevel', data.poi || data.entry || "WAITING");
    update('logicText', data.logic);
    update('tradeTypeLabel', `${data.assetName || "ASSET"} | ${data.tradeType || "SCANNING"}`);
    update('supText', data.sup);
    update('resText', data.res);
    update('rrText', `1:${currentRR.toFixed(1)}`);

    if (ui('poiZone')) {
        data.bias === 'WATCHING' ? ui('poiZone').classList.remove('hidden') : ui('poiZone').classList.add('hidden');
    }

    // --- DYNAMIC PRECISION LOT ENGINE ---
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    
    if (bal && riskPct && data.entry && data.sl && data.bias !== "WATCHING") {
        const riskCash = bal * (riskPct / 100); // Should be $35
        const priceDiff = Math.abs(data.entry - data.sl) + spread;
        
        let assetMultiplier = 1;
        const asset = data.assetName?.toUpperCase() || "";

        // Standard Contract Scaling
        if (asset.includes("OIL") || asset.includes("WTI") || asset.includes("XAU") || asset.includes("GOLD")) {
            assetMultiplier = 100; 
        } else if (priceDiff < 1) {
            assetMultiplier = 10;
        }

        const lotSize = riskCash / (priceDiff * assetMultiplier);
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAIT");
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
