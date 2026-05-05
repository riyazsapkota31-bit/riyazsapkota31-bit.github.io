/**
 * OMNI-BLACK | VERSION 80.0 (THE MASTER ARCHITECT)
 * Mandate: 8-Core Strategy, DXY Sync, 100% Visual Scrape, Strict Risk Parameters.
 * Hardware Lock: Gemini 2.5 Flash ONLY.
 */

let files = [null, null, null, null]; // Slots: 0:H1, 1:M15, 2:M1, 3:DXY

// 5.ii: SYSTEM INITIALIZATION & PERSISTENCE SHIELD
document.addEventListener('DOMContentLoaded', () => {
    const configMap = {
        'apiKeyInput': 'omni_api_key',
        'balanceInput': 'omni_balance',
        'riskInput': 'omni_risk'
    };

    Object.keys(configMap).forEach(id => {
        const el = ui(id);
        const savedValue = localStorage.getItem(configMap[id]);
        // 5.i: Anti-Crash Null Shields for UI Elements
        if (el && savedValue) el.value = savedValue;
    });
});

/**
 * SECURE PARAMETERS (Local Storage Link)
 */
async function secureParameters() {
    const key = ui('apiKeyInput')?.value;
    const bal = ui('balanceInput')?.value;
    const risk = ui('riskInput')?.value;

    if (!key || !bal || !risk) {
        alert("CRITICAL ERROR: All hardware parameters must be defined.");
        return;
    }

    localStorage.setItem('omni_api_key', key);
    localStorage.setItem('omni_balance', bal);
    localStorage.setItem('omni_risk', risk);
    alert("SYSTEM SECURED: Risk Engine parameters locked.");
}

/**
 * 1. THE STRATEGY ENGINE (MAIN EXECUTION)
 */
async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    const out = ui('resultBox');
    
    // 1.v: DXY SYNC FILTER - Important filter to avoid Dollar Traps
    if (files.filter(f => f).length < 4 || !files[3]) {
        alert("CRITICAL ERROR: Slot 4 (DXY Index) is required to confirm asset trend.");
        return;
    }

    if (btn) { btn.innerText = "COUNCIL OF 8 ANALYZING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
        const rPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

        if (!apiKey || bal === 0) throw new Error("Hardware Link Offline: Check API/Balance.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // 5.i: STRICT MODEL LOCK
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // 5.i: ANTI-CRASH SHIELD
        if (!analysis || typeof analysis !== 'object') throw new Error("Logic Engine Corrupted.");

        // 2.iii: ASSET AUTO-DETECTION & SPREAD CALIBRATION
        const asset = (analysis.assetName || "UNKNOWN").toUpperCase();
        const spread = getXMSpread(asset, analysis.assetClass);
        
        // 3.i & 3.ii: MATHEMATICAL RIGOR (RR CALCULATION)
        const riskPoints = Math.abs((analysis.entry || 0) - (analysis.sl || 0)) + spread;
        const rewardPoints = Math.abs((analysis.tp || 0) - (analysis.entry || 0)) - spread;
        let currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        // 3.i & 3.ii: 1:1.5 to 1:8 RR Limits
        if (currentRR > 8) currentRR = 8.0; // Hard-cap display at 1:8 maximum

        // 3.i & 4.iii: THE RR GUARD & POI PROTOCOL
        if (analysis.bias !== "WAIT" && currentRR < 1.5) {
            analysis.bias = "WAIT";
            analysis.poi = analysis.poi || analysis.entry || 0; 
            // 4.ii & 4.iii: Logic for waiting and prompting re-scan
            analysis.logic = `RR ${currentRR.toFixed(2)} too low. Await POI alignment. Re-scan only when price reaches this exact level.`;
        }

        renderOutput(analysis, currentRR, spread, bal, rPct);
        
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

/**
 * 2. DATA INTEGRITY ENGINE (ZERO-HALLUCINATION MANDATE)
 */
async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V80_CORE_LOGIC
        
        1.i: COUNCIL OF 8: Cross-reference SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, Elliott Wave.
        1.ii: PROFIT-FIRST: Evaluate Scalp (1m/5m) vs Day Trade (15m/1h) for highest profit potential.
        1.iii: GRADE-A FILTER: High-conviction setups only. Sideways/low-conviction = WAIT.
        1.iv: INSTITUTIONAL DETECTION: Identify Liquidity Sweeps, MSS, FVG, Order Blocks.
        2.i & 2.ii: 100% VISUAL SCRAPE: OCR Y-axis (Price) and X-axis (Time) from actual candle data. No simulated prices.
        2.iii: ASSET DETECTION: Identify the specific trading pair and asset class (e.g., forex, crypto, commodities).
        3.ii: UNCAPPED EXTENSION: Target major liquidity pools for TP (Aim for 1:1.5 to 1:8 RR).
        4.ii & 4.iii: POI PROTOCOL: If bias is WAIT, you MUST provide a numeric Watch Level (POI) and exactly 10-15 words explaining the logic for waiting and instructing the user to re-scan only at that level.
        4.i: MUZZLE RULE: Strict JSON output only. Zero conversational filler.
        
        JSON STRUCTURE:
        {
          "assetName": "STRING (e.g., XAUUSD, BTCUSD, EURUSD)",
          "assetClass": "STRING (forex, crypto, commodities, indices)",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WAIT",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "EXACTLY 10-15 WORDS ON WAITING LOGIC AND RE-SCAN INSTRUCTION AT POI",
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
    if (!data.candidates || !data.candidates[0].content.parts[0].text) throw new Error("Hardware Link Failure.");
    
    // 4.i: MUZZLE RULE PARSING
    const rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

/**
 * 4. DYNAMIC UI & OPERATIONAL CONSTRAINTS
 */
function renderOutput(data, rr, spread, bal, rPct) {
    const isWait = data.bias === "WAIT";
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val || "---"; };

    // 4.iv: UI LAYOUT - BIAS DISPLAY
    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias || "WAIT";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    // 1.iii: GRADE-A FILTERING (Masking Entry/SL/TP in WAIT status)
    update('entText', isWait ? "--" : data.entry);
    update('slText', isWait ? "--" : data.sl);
    update('tpText', isWait ? "--" : data.tp);
    
    // 4.iii: POI PROTOCOL (Watch Level & Logic)
    update('poiLevel', data.poi || "MONITORING");
    update('logicText', data.logic); 
    
    // 4.iv: TRADE TYPE & ASSET
    update('tradeTypeLabel', `${data.assetName || 'ASSET'} | ${data.tradeType || 'TYPE'}`);
    update('rrText', isWait ? "1:0.0" : `1:${rr.toFixed(1)}`);
    update('supText', data.sup);
    update('resText', data.res);

    // Dynamic Visibility for POI Zone
    const pZone = ui('poiZone');
    if (pZone) isWait ? pZone.classList.remove('hidden') : pZone.classList.add('hidden');

    // 3.iii & 3.iv: SURGICAL LOT SIZING & XM NORMALIZATION
    if (!isWait && data.entry && data.sl) {
        const riskCash = bal * (rPct / 100);
        const stopDistance = Math.abs(data.entry - data.sl) + spread;
        
        let multiplier = 1;
        const asset = (data.assetName || "").toUpperCase();
        const assetClass = (data.assetClass || "").toLowerCase();
        
        // XM-Broker Calibration mapping points/pips/ticks
        if (asset.includes("GOLD") || asset.includes("XAU") || assetClass === 'commodities') {
            multiplier = 100; // Gold ticks
        } else if (assetClass === 'crypto' || stopDistance < 0.1) {
            multiplier = 10; // Crypto points
        } else {
            multiplier = 1; // Standard Forex
        }

        const lotSize = riskCash / (stopDistance * multiplier);
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAIT");
    }
}

/**
 * XM-BROKER SPREAD NORMALIZATION ENGINE
 */
function getXMSpread(asset, assetClass = "") {
    const a = asset.toUpperCase();
    const ac = assetClass.toLowerCase();
    
    if (a.includes("OIL")) return 0.03;
    if (a.includes("GOLD") || a.includes("XAU") || ac === 'commodities') return 0.20;
    if (ac === 'crypto') return 0.50; // Average crypto spread buffer
    return 0.0001; // Standard Forex
}

/**
 * SYSTEM UTILITIES & NULL SHIELDS
 */
function ui(id) { 
    return document.getElementById(id); 
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
