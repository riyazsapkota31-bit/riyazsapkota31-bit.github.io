/**
 * OMNI-BLACK | VERSION 54.0 (COUNCIL OF 8 & VISUAL INTEGRITY)
 * Mandate: Structural Accuracy > Forced RR. Zero filler. Zero hallucination.
 */

let files = [null, null, null, null]; // [H1, M15, M1, DXY]

async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    const out = ui('resultBox');
    
    // REQUIREMENT: DXY Sync (4th Image) and Timeframe Confluence
    if (files.filter(f => f).length < 4) {
        alert("CRITICAL ERROR: DXY mandatory filter or timeframe layers missing.");
        return;
    }

    if (btn) { btn.innerText = "AGGREGATING 8-CORE STRATEGY..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // --- 1. SYSTEM HARDWARE & DEFENSIVE CODING ---
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- 2. DATA INTEGRITY: NULL SHIELDS ---
        if (!analysis || typeof analysis !== 'object') throw new Error("API RESPONSE CORRUPTED");

        // --- 3. MATHEMATICAL RIGOR: RR GUARD ---
        const asset = (analysis.assetName || "UNDEFINED").toUpperCase();
        const spread = calibrateBrokerSpread(asset);
        
        const riskPoints = Math.abs(analysis.entry - analysis.sl) + spread;
        const rewardPoints = Math.abs(analysis.tp - analysis.entry) - spread;
        const currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        // Requirement: Hard-coded 1:1.5 RR Filter
        if (analysis.bias !== "WAIT" && currentRR < 1.5) {
            analysis.bias = "WAIT";
            analysis.logic = "RR below 1:1.5 threshold. Setup downgraded to observation.";
        }

        renderOutput(analysis, currentRR, spread);
        
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V54_FINAL_STRUCTURAL_LOCK
        MODEL_LOCK: Gemini 2.0 Flash (Mandatory)
        
        STRATEGY_ENGINE (COUNCIL OF 8): 
        Cross-reference: SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, Elliott Wave.
        
        MANDATE:
        1. 100% VISUAL SCRAPE: Perform OCR on Y-axis (Price) and X-axis (Time). Identify exact XM Terminal coordinates.
        2. DXY SYNC: Use 4th image (DXY) to confirm asset bias. If DXY is bullish, short XAU/Crypto.
        3. INSTITUTIONAL DETECTION: Mark MSS, FVG, and Liquidity Sweeps.
        4. GRADE-A FILTER: Output "WAIT" if conviction < B+.
        
        OUTPUT STRICT JSON ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WAIT",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "10-15 WORD SUMMARY OF INSTITUTIONAL FOOTPRINT",
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
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

function renderOutput(data, rr, spread) {
    const bEl = ui('actionText');
    const isWait = data.bias === "WAIT";

    // --- DYNAMIC UI & OPERATIONAL CONSTRAINTS ---
    if (bEl) {
        bEl.innerText = data.bias || "WAIT";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    update('entText', isWait ? "--" : data.entry);
    update('slText', isWait ? "--" : data.sl);
    update('tpText', isWait ? "--" : data.tp);
    update('poiLevel', data.poi || data.entry || "RE-SCAN REQ");
    update('logicText', data.logic);
    update('tradeTypeLabel', `${data.assetName} | ${data.tradeType}`);
    update('rrText', isWait ? "1:0.0" : `1:${rr.toFixed(1)}`);

    // --- SURGICAL LOT SIZING (XM-BROKER NORMALIZED) ---
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 7000;
    const rPct = parseFloat(localStorage.getItem('omni_risk')) || 0.5;
    
    if (!isWait && data.entry && data.sl) {
        const riskCash = bal * (rPct / 100); 
        const priceDiff = Math.abs(data.entry - data.sl) + spread;
        
        let brokerScale = 1; // Default Crypto/Forex
        if (data.assetName.includes("OIL") || data.assetName.includes("GOLD") || data.assetName.includes("XAU")) {
            brokerScale = 100; // XM MetaTrader Calibration
        }

        const lotSize = riskCash / (priceDiff * brokerScale);
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAITING");
    }
}

function calibrateBrokerSpread(asset) {
    if (asset.includes("OIL") || asset.includes("WTI")) return 0.03;
    if (asset.includes("GOLD") || asset.includes("XAU")) return 0.20;
    return 0.01;
}

function ui(id) { return document.getElementById(id); }
function update(id, val) { if (ui(id)) ui(id).innerText = val || "---"; }

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
