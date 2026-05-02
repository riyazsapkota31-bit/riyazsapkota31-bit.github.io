/**
 * OMNI-BLACK ANALYTIC ENGINE | VERSION 42 (SURGICAL MASTER)
 * Optimized for: High-Res Mobile OCR, 8-Strategy Confluence, & Persistent Risk Math.
 */

let files = [null, null, null, null];

/**
 * INITIALIZATION: Load Persistent Settings
 * Ensures API Key, Balance, and Risk are always ready.
 */
window.onload = () => {
    console.log("OMNI-BLACK Core Linked. Ready for Execution.");
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // 1. Minimum Data Check
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Minimum 2 timeframe layers required for confluence.");
        return;
    }

    btn.innerText = "HUNTING LIQUIDITY...";
    btn.disabled = true;

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: API Key missing in Settings.");

        // 2. Vision Pre-Processing
        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // 3. Neural Strategy Request
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // 4. Result Rendering
        renderOutput(analysis);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error("OMNI CORE FAIL:", err);
        alert("ANALYSIS FAILED: " + err.message);
    } finally {
        btn.innerText = "EXECUTE COMMAND";
        btn.disabled = false;
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: VISION_SHIELD_V42
        MANDATE: Aggressive Scalping Logic. Minimize "No Trade" unless structurally invalid.
        
        VISION INSTRUCTION:
        - Identify Ticker (e.g. ETHUSD, SOL, XAUUSD).
        - OCR FOCUS: Scan the Right-hand Y-axis AND the Top-Left Price Label.
        - IGNORE: All UI buttons, browser bars, and drawing tools.
        
        STRATEGIC ENGINE (Scan all 8):
        1. SMC (Liquidity/OB) 2. S&R 3. S&D 4. ICT (FVG/MSS) 
        5. Wyckoff 6. Elliott Wave 7. Price Action 8. Correlation (DXY).
        
        DECISION RULES:
        - Pick the DOMINANT strategy for current conditions.
        - Trigger BUY/SELL if momentum is clear. Accept RR as low as 1:1.5.
        
        OUTPUT ONLY JSON:
        {
          "assetName": "Detected Ticker",
          "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
          "dominantStrategy": "Strategy Name",
          "bias": "BUY"|"SELL"|"NO TRADE",
          "entry": number, "sl": number, "tp": number,
          "logic": "Explain confluence briefly."
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
                temperature: 0.1, // Near-zero for mathematical accuracy
                top_p: 1
            }
        })
    });

    if (!response.ok) throw new Error("API Connection Failed. Check your Key.");

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data) {
    const biasEl = document.getElementById('biasTxt');
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;

    // Visual Updates
    document.querySelector('.label-vibrant').innerText = `${data.assetName || 'Market'} - ${data.dominantStrategy}`;
    
    biasEl.innerText = data.bias;
    biasEl.className = `text-8xl font-black italic tracking-tighter ${
        data.bias === 'BUY' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 
        data.bias === 'SELL' ? 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 
        'text-slate-500'
    }`;

    // Price Display
    document.getElementById('entVal').innerText = data.entry || "--";
    document.getElementById('slVal').innerText = data.sl || "--";
    document.getElementById('tpVal').innerText = data.tp || "--";
    document.getElementById('logicSummary').innerHTML = `<b class="text-cyan-400 font-bold uppercase text-[10px] tracking-widest">[Strategy: ${data.dominantStrategy}]</b><br>${data.logic}`;

    // ⚡️ QUANT RISK ENGINE (Multi-Asset Calculation)
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmount = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let finalSize = 0;

        if (priceDiff > 0) {
            if (data.assetType === "CRYPTO") {
                finalSize = riskAmount / priceDiff;
            } else if (data.assetType === "FOREX") {
                // Formula for standard lots (100k units)
                finalSize = riskAmount / (priceDiff * 10);
            } else if (data.assetType === "COMMODITY") {
                // Gold/XAUUSD: 1 Lot = $100 per $1 move
                finalSize = riskAmount / (priceDiff * 100);
            }
            // Display result with high precision for scalpers
            document.getElementById('lotVal').innerText = finalSize.toFixed(4);
        }
    } else {
        document.getElementById('lotVal').innerText = "0.00";
    }
}

/**
 * UTILITY: Helper functions for Base64 conversion
 */
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
