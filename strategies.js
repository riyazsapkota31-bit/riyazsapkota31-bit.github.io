/**
 * OMNI-BLACK | VERSION 80.0 (MASTER ARCHITECT)
 * Protocol: Internal Indicator Calculation (No Indicator Charts Needed)
 */

let files = [null, null, null, null]; 
const ui = (id) => document.getElementById(id);
const toBase64 = (file) => new Promise(res => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result);
});

// --- INDICATOR MATH ENGINE ---
const Indicators = {
    // Calculate RSI internally from raw price array
    calcRSI: (prices, period = 14) => {
        if (prices.length < period) return 50;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            let diff = prices[i] - prices[i - 1];
            diff > 0 ? gains += diff : losses -= diff;
        }
        let rs = gains / (losses || 1);
        return 100 - (100 / (1 + rs));
    },
    // Calculate EMA internally
    calcEMA: (prices, period) => {
        if (prices.length < period) return prices[prices.length - 1];
        const k = 2 / (period + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * k) + (ema * (1 - k));
        }
        return ema;
    }
};

// --- CORE STRATEGIC BRAIN ---
function runStrategicBrain(data) {
    let score = 0;
    let bias = "WAIT";
    
    // 1. Internal Indicator Processing
    const currentRSI = Indicators.calcRSI(data.recentCloses);
    const ema200 = Indicators.calcEMA(data.recentCloses, 200);
    const isAboveEMA = data.currentPrice > ema200;

    // 2. SMC & Institutional Logic
    if (data.mss === "BULLISH") score += 25;
    if (data.mss === "BEARISH") score -= 25;
    
    // Liquidity & DXY Filter
    if (data.dxyTrend === "BEARISH") score += 20; 
    if (data.dxyTrend === "BULLISH") score -= 20;

    // 3. Indicator Confluence (Calculated Internally)
    if (currentRSI < 30) score += 15; // Oversold confluence
    if (currentRSI > 70) score -= 15; // Overbought confluence

    // 4. Decision
    if (score >= 60) bias = "BUY";
    else if (score <= -60) bias = "SELL";
    else bias = "WAIT";

    return { bias, score: Math.abs(score), calculatedRSI: currentRSI.toFixed(1) };
}

async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    if (files.filter(f => f).length < 4) return alert("Upload all 4 plain charts.");
    btn.innerText = "EXTRACTING RAW PIXELS...";
    btn.disabled = true;

    try {
        const key = localStorage.getItem('omni_apiKeyInput');
        const images = await Promise.all(files.map(f => toBase64(f)));

        // STEP 1: Gemini extracts raw price points from plain chart
        const rawData = await fetchRawData(key, images);

        // STEP 2: JS Brain calculates indicators and finds the setup
        const decision = runStrategicBrain(rawData);

        // STEP 3: AI generates the 12-word logic
        const logicSummary = await fetchLogic(key, decision.bias, rawData);

        renderOutput(rawData, decision, logicSummary);
    } catch (e) {
        alert("SYSTEM ERROR: Check API key or Image Quality.");
    } finally {
        btn.innerText = "Perform Surgical Scan";
        btn.disabled = false;
    }
}

async function fetchRawData(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `
        PROTOCOL: OMNI_V80_OHLC_EXTRACTOR
        TASK: Scrape the plain chart. Look at the last 30 candles.
        Return the closing price for each candle in an array.
        Also identify Liquidity Sweeps and Market Structure Shifts (MSS).
        
        JSON STRUCTURE ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "recentCloses": [number, number, ...], // Last 30 candle closes
          "dxyTrend": "BULLISH"|"BEARISH"|"SIDEWAYS",
          "mss": "BULLISH"|"BEARISH"|"NONE",
          "liquiditySweep": number,
          "sl": number, "tp": number, "poi": number
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

async function fetchLogic(key, bias, data) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `Write 12 words max explaining a ${bias} on ${data.assetName} using SMC logic.`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const json = await res.json();
    return json.candidates[0].content.parts[0].text;
}

function renderOutput(data, decision, logic) {
    ui('resultBox').classList.remove('hidden');
    ui('actionText').innerText = decision.bias;
    ui('actionText').className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
        decision.bias === 'BUY' ? 'text-emerald-400' : decision.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
    }`;
    ui('rsiVal').innerText = decision.calculatedRSI;
    ui('logicText').innerText = logic;
    ui('entText').innerText = decision.bias === "WAIT" ? "---" : data.currentPrice;
    ui('slText').innerText = decision.bias === "WAIT" ? "---" : data.sl;
    ui('tpText').innerText = decision.bias === "WAIT" ? "---" : data.tp;
    
    if (decision.bias === "WAIT") {
        ui('poiZone').classList.remove('hidden');
        ui('poiLevel').innerText = data.poi || "MONITORING";
    } else {
        ui('poiZone').classList.add('hidden');
    }
}
