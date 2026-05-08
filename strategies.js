/**
 * OMNI-BLACK | VERSION 80.0 MASTER (DYNAMIC WEIGHTING)
 * Strategy: Institutional SMC + Internal Math Engine
 */

let files = [null, null, null, null]; 
const ui = (id) => document.getElementById(id);
const toBase64 = (file) => new Promise(res => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result);
});

// --- INTERNAL MATH ENGINE ---
const MathEngine = {
    calcRSI: (prices, period = 14) => {
        if (!prices || prices.length < period) return 50;
        let changes = [];
        for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i-1]);
        let gains = changes.map(v => v > 0 ? v : 0).slice(0, period).reduce((a,b) => a+b, 0) / period;
        let losses = changes.map(v => v < 0 ? -v : 0).slice(0, period).reduce((a,b) => a+b, 0) / period;
        let rs = gains / (losses || 1);
        return 100 - (100 / (1 + rs));
    },
    calcEMA: (prices, period) => {
        const k = 2 / (period + 1);
        return prices.reduce((acc, val) => (val * k) + (acc * (1 - k)), prices[0]);
    }
};

// --- DYNAMIC WEIGHTING ENGINE ---
function runWeightedAnalysis(data) {
    let score = 0; // Total potential: 100
    let bias = "WAIT";
    
    // 1. LIQUIDITY SWEEP (Weight: 40) - Highest Reliability
    const sweepDist = Math.abs(data.currentPrice - data.liquiditySweep) / data.currentPrice;
    if (sweepDist < 0.0015) score += 40; 

    // 2. MARKET STRUCTURE SHIFT (Weight: 25)
    if (data.mss === "BULLISH") score += 25;
    if (data.mss === "BEARISH") score -= 25;

    // 3. DXY GRAVITY FILTER (Weight: 20)
    if (data.dxyTrend === "BEARISH") score += 20; // Bullish for Gold/Crypto
    if (data.dxyTrend === "BULLISH") score -= 20; // Bearish for Gold/Crypto

    // 4. RETAIL CONFLUENCE (Weight: 15) - Calculated Internally
    const currentRSI = MathEngine.calcRSI(data.recentCloses);
    const ema200 = MathEngine.calcEMA(data.recentCloses, 200);
    
    if (currentRSI < 30) score += 7.5;
    if (currentRSI > 70) score -= 7.5;
    if (data.currentPrice > ema200) score += 7.5;
    if (data.currentPrice < ema200) score -= 7.5;

    // --- FINAL BIAS CALCULATION ---
    // Scalp Requirement: 65% Confidence | Day Trade Requirement: 85% Confidence
    if (score >= 85) bias = "DAY TRADE BUY";
    else if (score >= 65) bias = "SCALP BUY";
    else if (score <= -85) bias = "DAY TRADE SELL";
    else if (score <= -65) bias = "SCALP SELL";
    else bias = "WAIT";

    return { bias, confidence: Math.abs(score), rsi: currentRSI.toFixed(1) };
}

// --- EXECUTION PIPELINE ---
async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    if (files.filter(f => f).length < 4) return alert("Upload all 4 Plain Charts.");

    btn.innerText = "COUNCIL OF 8 ANALYZING...";
    btn.disabled = true;

    try {
        const key = localStorage.getItem('omni_apiKeyInput');
        const b64Images = await Promise.all(files.map(f => toBase64(f)));

        // 1. Data Scrape (Vision)
        const rawData = await fetchVisionData(key, b64Images);

        // 2. Weighted Logic (JS)
        const analysis = runWeightedAnalysis(rawData);

        // 3. Narrative logic (AI)
        const logicTxt = await fetchNarrative(key, analysis.bias, rawData);

        renderUI(rawData, analysis, logicTxt);
    } catch (e) {
        console.error(e);
        alert("CRITICAL SYSTEM ERROR");
    } finally {
        btn.innerText = "Perform Surgical Scan";
        btn.disabled = false;
    }
}

async function fetchVisionData(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `
        PROTOCOL: OMNI_V80_VISION_SCRAPE
        Mandate: Scrape plain charts. Extract exact numeric price data.
        1. Current Price.
        2. Identify most recent Liquidity Sweep level (Wick Level).
        3. Identify MSS (BULLISH/BEARISH/NONE).
        4. DXY Trend.
        5. Extract last 20 candle closes as an array.
        6. Define entry, sl, tp, and a POI (Wait level).
        
        STRICT JSON ONLY:
        {
          "asset": "STRING",
          "currentPrice": number,
          "liquiditySweep": number,
          "mss": "STRING",
          "dxyTrend": "STRING",
          "recentCloses": [numbers],
          "entry": number, "sl": number, "tp": number, "poi": number
        }
    `;

    const body = {
        contents: [{ parts: [{ text: prompt }, ...images.map(img => ({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } }))] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text);
}

async function fetchNarrative(key, bias, data) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;
    const prompt = `Give a 12-word institutional trade logic for a ${bias} on ${data.asset}. Focus on liquidity.`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const json = await res.json();
    return json.candidates[0].content.parts[0].text;
}

function renderUI(rawData, analysis, logic) {
    const isWait = analysis.bias === "WAIT";
    ui('resultBox').classList.remove('hidden');
    ui('actionText').innerText = analysis.bias;
    ui('actionText').className = `text-5xl font-black italic tracking-tighter uppercase leading-none glow-text ${
        analysis.bias.includes('BUY') ? 'text-emerald-400' : analysis.bias.includes('SELL') ? 'text-rose-500' : 'text-slate-400'
    }`;

    ui('scoreText').innerText = `Confidence: ${analysis.confidence}%`;
    ui('logicText').innerText = logic;
    ui('rsiVal').innerText = analysis.rsi;
    ui('dxyStatus').innerText = rawData.dxyTrend;
    
    ui('entText').innerText = isWait ? "---" : rawData.entry;
    ui('slText').innerText = isWait ? "---" : rawData.sl;
    ui('tpText').innerText = isWait ? "---" : rawData.tp;

    const rr = Math.abs(rawData.tp - rawData.entry) / Math.abs(rawData.entry - rawData.sl);
    ui('rrText').innerText = isWait ? "1:0.0" : `1:${rr.toFixed(1)}`;

    if (isWait) {
        ui('poiZone').classList.remove('hidden');
        ui('poiLevel').innerText = rawData.poi || "MONITORING";
        ui('lotText').innerText = "WAIT";
    } else {
        ui('poiZone').classList.add('hidden');
        const bal = parseFloat(localStorage.getItem('omni_balanceInput'));
        const risk = parseFloat(localStorage.getItem('omni_riskInput')) / 100;
        const lot = (bal * risk) / (Math.abs(rawData.entry - rawData.sl) * 10);
        ui('lotText').innerText = lot.toFixed(3);
    }
}
