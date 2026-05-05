/**
 * OMNI-BLACK | VERSION 55.0 (THE CONSTITUTION)
 * Mandate: 8-Core Strategy, DXY Sync, 100% Visual Scrape.
 * Hardware: Gemini 2.5 Flash ONLY.
 */

let files = [null, null, null, null]; // H1, M15, M1, DXY

async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    const out = ui('resultBox');
    
    // 1.v & 5.ii: DXY MANDATORY SYNC & DATA INTEGRITY
    if (files.filter(f => f).length < 4 || !files[3]) {
        alert("CRITICAL ERROR: Slot 4 (DXY Index) is required for Trend Confirmation.");
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

        // 5.i: STRICT MODEL LOCK (GEMINI 2.5 FLASH)
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // 5.i: ANTI-CRASH NULL SHIELDS
        if (!analysis || typeof analysis !== 'object') throw new Error("Logic Engine Corrupted.");

        // 3.i: MATHEMATICAL RIGOR (1:1.5 RR GUARD)
        const asset = (analysis.assetName || "UNKNOWN").toUpperCase();
        const spread = getXMSpread(asset);
        
        const riskPoints = Math.abs(analysis.entry - analysis.sl) + spread;
        const rewardPoints = Math.abs(analysis.tp - analysis.entry) - spread;
        const currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        // Force WAIT status if setup is sub-standard
        if (analysis.bias !== "WAIT" && currentRR < 1.5) {
            analysis.bias = "WAIT";
            analysis.logic = "RR below 1:1.5 threshold. Awaiting institutional alignment at POI.";
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

async function fetchGeminiAnalysis(key, images) {
    // 5.i: MODEL LOCK
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V55_SYSTEM_LOCK
        1.i: 8-CORE AGGREGATOR (SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, Elliott Wave).
        1.ii: PROFIT-FIRST SELECTION (Scalp vs Day Trade).
        1.iv: INSTITUTIONAL DETECTION (Liquidity Sweeps, MSS, FVG, Order Blocks).
        2.i: 100% VISUAL SCRAPE (OCR Y-axis Price, X-axis Time). No simulated prices.
        4.i: MUZZLE RULE (Strict JSON only).
        
        JSON STRUCTURE:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WAIT",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "10-15 WORDS ON INSTITUTIONAL FOOTPRINT",
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
    
    const rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

function renderOutput(data, rr, spread, bal, rPct) {
    const isWait = data.bias === "WAIT";
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val || "---"; };

    // 4.iv: UI LAYOUT
    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias || "WAIT";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    // 1.iii: GRADE-A FILTERING (MASKING LEVELS IN WAIT)
    update('entText', isWait ? "--" : data.entry);
    update('slText', isWait ? "--" : data.sl);
    update('tpText', isWait ? "--" : data.tp);
    update('poiLevel', data.poi || "MONITORING");
    update('logicText', data.logic); // 4.ii: 10-15 words
    update('tradeTypeLabel', `${data.assetName} | ${data.tradeType}`);
    update('rrText', isWait ? "1:0.0" : `1:${rr.toFixed(1)}`);

    // 4.iii: POI PROTOCOL
    if (ui('poiZone')) {
        isWait ? ui('poiZone').classList.remove('hidden') : ui('poiZone').classList.add('hidden');
    }

    // 3.iii & 3.iv: SURGICAL LOT SIZING & XM NORMALIZATION
    if (!isWait && data.entry && data.sl) {
        const riskCash = bal * (rPct / 100);
        const stopDistance = Math.abs(data.entry - data.sl) + spread;
        
        let multiplier = 1;
        const asset = data.assetName.toUpperCase();
        
        // XM-Broker Calibration
        if (asset.includes("GOLD") || asset.includes("XAU") || asset.includes("OIL") || asset.includes("WTI")) {
            multiplier = 100; 
        } else if (stopDistance < 0.1) {
            multiplier = 10;
        }

        const lotSize = riskCash / (stopDistance * multiplier);
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAIT");
    }
}

function getXMSpread(asset) {
    if (asset.includes("OIL")) return 0.03;
    if (asset.includes("GOLD") || asset.includes("XAU")) return 0.20;
    return 0.0001; 
}

function ui(id) { return document.getElementById(id); }

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
