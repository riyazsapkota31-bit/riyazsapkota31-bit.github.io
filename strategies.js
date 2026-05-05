/**
 * OMNI-BLACK | VERSION 64.0 (HYBRID SURGICAL UPGRADE)
 * Mandate: Accurate Scalps + Automated Day Trade Morphing
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('scanBtn');
    const out = document.getElementById('resultBox');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "WEIGHING STRATEGIC PRIORITY..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- 1. CORE MATHEMATICAL SUITE ---
        const riskPoints = Math.abs(analysis.entry - analysis.sl) || 0.0001;
        let rewardPoints = Math.abs(analysis.tp - analysis.entry);
        let currentRR = rewardPoints / riskPoints;
        const priceToEntryGap = Math.abs(analysis.currentPrice - analysis.entry);
        const allowedGap = riskPoints * 0.4; // Slightly tighter entry gate for accuracy

        // --- 2. ACCURACY & MORPH ENGINE ---
        
        if (!analysis.entry || !analysis.sl) {
            analysis.bias = "WATCHING";
            analysis.logic = "Data incomplete. Awaiting clear chart structure.";
        }

        // ACCURACY GATE: Liquidity Sweep Verification
        // This ensures the scalp isn't just a random touch, but a rejection of a level.
        if (analysis.isSweep === false && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.logic = "No Liquidity Trap detected. Accuracy insufficient for scalp.";
        }

        // DAY TRADE MORPH: Upgrade Scalp if Day Trade potential is higher
        if (analysis.dayTradeTp && analysis.bias !== "WATCHING") {
            const dtReward = Math.abs(analysis.dayTradeTp - analysis.entry);
            const dtRR = dtReward / riskPoints;

            // If Day Trade aligns with trend and offers better RR, prioritize it
            if (dtRR > currentRR && dtRR >= 3) {
                analysis.tradeType = "DAY TRADE (UPGRADED)";
                analysis.tp = analysis.dayTradeTp;
                currentRR = dtRR;
                analysis.logic = `Scalp entry upgraded. Day Trade trend confirmed (RR 1:${dtRR.toFixed(1)}).`;
            }
        }

        // FINAL PROFITABILITY FLOOR
        if (currentRR < 2 && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.logic = `RR 1:${currentRR.toFixed(1)} below profit threshold. Awaiting POI.`;
        }

        // PROXIMITY GATE
        if (priceToEntryGap > allowedGap && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = "Price left POI station. Await retracement for safe entry.";
        }

        renderOutput(analysis, currentRR);
        
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
        PROTOCOL: OMNI_V64_SURGICAL
        MANDATE: Prioritize SMC accuracy (Liquidity Sweeps). Detect price traps.
        MORPH: If a Scalp setup aligns with H1 market structure, provide a 'dayTradeTp'.
        JSON ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "isSweep": boolean,
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "dayTradeTp": number, "poi": number,
          "logic": "10-12 WORDS MAX",
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
    let textResult = data.candidates[0].content.parts[0].text;
    const cleanJson = textResult.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
}

// ... (renderOutput, event listeners, and toBase64 remain unchanged)
