/**
 * OMNI-BLACK | VERSION 63.0 (HYBRID SURGICAL EXECUTION)
 * Mandate: High-Accuracy Scalp Entry -> Day Trade Upgrade Logic
 */

// ... (Keep existing files/scanBtn boilerplate)

async function executeSurgicalScan() {
    // ... (Keep existing upload checks and API key retrieval)

    try {
        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- 1. CORE MATHEMATICAL CALCULATIONS ---
        const riskPoints = Math.abs(analysis.entry - analysis.sl) || 0.0001;
        const rewardPoints = Math.abs(analysis.tp - analysis.entry);
        let currentRR = rewardPoints / riskPoints;

        // --- 2. THE "MORPH" LOGIC (SCALP TO DAY TRADE) ---
        
        // Check for "Day Trade Upgrade" Opportunity
        // If the AI identifies a strong HTF trend, we prioritize it
        if (analysis.htfBias === analysis.bias && analysis.tradeType === "SCALP") {
            const dayTradeTarget = analysis.dayTradeTp || analysis.tp;
            const upgradedReward = Math.abs(dayTradeTarget - analysis.entry);
            const upgradedRR = upgradedReward / riskPoints;

            if (upgradedRR > currentRR && upgradedRR >= 3) {
                analysis.tradeType = "DAY TRADE (UPGRADED)";
                analysis.tp = dayTradeTarget;
                currentRR = upgradedRR;
                analysis.logic = `SCALP UPGRADED: Strong HTF confluence. Aiming for ${upgradedRR.toFixed(1)} RR.`;
            }
        }

        // --- 3. SURGICAL ACCURACY FILTERS ---
        
        // Accuracy Gate: Liquidity Sweep Check
        if (analysis.isLiquiditySweep === false && analysis.tradeType.includes("SCALP")) {
            analysis.bias = "WATCHING";
            analysis.logic = "No Liquidity Sweep detected. Scalp accuracy too low. Awaiting trap.";
        }

        // RR Floor: Kill low-value setups
        if (currentRR < 2 && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.logic = `RR ${currentRR.toFixed(1)} is sub-optimal. Awaiting deeper retracement.`;
        }

        renderOutput(analysis, currentRR);
        // ... (Keep existing UI handling)

    } catch (err) {
        // ... (Keep existing error handling)
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    
    // UPDATED PROMPT: Requesting specific SMC/ICT data points for precision
    const prompt = `
        PROTOCOL: OMNI_V63_SURGICAL
        MANDATE: Analyze charts for SMC/ICT setups. 
        PRECISION: Identify if current move is a "Liquidity Sweep" (rejection of high/low).
        UPGRADE: If a scalp entry aligns with the H1 trend, provide a 'dayTradeTp' for maximum profit.

        JSON ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "htfBias": "BUY"|"SELL",
          "isLiquiditySweep": boolean,
          "entry": number, "sl": number, "tp": number, "dayTradeTp": number, "poi": number,
          "logic": "MAX 12 WORDS",
          "sup": "STRING", "res": "STRING"
        }
    `;
    // ... (Keep existing fetch and sanitization logic)
}

// ... (Keep existing renderOutput and lot size math)
