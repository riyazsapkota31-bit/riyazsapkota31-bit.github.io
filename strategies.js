/**
 * OMNI-BLACK | VERSION 80.0 MASTER
 * Strategy: Internal Math Indicators + Dynamic Weighting
 */

let files = [null, null, null, null]; 

const ui = (id) => document.getElementById(id);
const toBase64 = (file) => new Promise(res => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result);
});

// --- PERSISTENCE ENGINE (FIXED) ---
document.addEventListener('DOMContentLoaded', () => {
    const fields = ['apiKeyInput', 'balanceInput', 'riskInput'];
    fields.forEach(id => {
        const val = localStorage.getItem('omni_' + id);
        if (val && ui(id)) ui(id).value = val;
    });
});

async function secureParameters() {
    const fields = ['apiKeyInput', 'balanceInput', 'riskInput'];
    fields.forEach(id => {
        const element = ui(id);
        if (element) {
            localStorage.setItem('omni_' + id, element.value);
        }
    });
    alert("SYSTEM LOCKED & SAVED");
    toggleDrawer();
}

// --- INTERNAL INDICATOR MATH ---
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
        if (!prices || prices.length < 2) return 0;
        const k = 2 / (period + 1);
        return prices.reduce((acc, val) => (val * k) + (acc * (1 - k)), prices[0]);
    }
};

// --- CORE WEIGHTED LOGIC ---
function runStrategicAnalysis(data) {
    let score = 0;
    let bias = "WAIT";

    // 1. LIQUIDITY & STRUCTURE (Weight: 65%)
    if (data.mss === "BULLISH") score += 25;
    if (data.mss === "BEARISH") score -= 25;
    
    const sweepDetected = Math.abs(data.currentPrice - data.liquiditySweep) / data.currentPrice < 0.0015;
    if (sweepDetected) score += 40;

    // 2. DXY GRAVITY (Weight: 20%)
    if (data.dxyTrend === "BEARISH") score += 20;
    if (data.dxyTrend === "BULLISH") score -= 20;

    // 3. INTERNAL MATH CONFLUENCE (Weight: 15%)
    const rsi = MathEngine.calcRSI(data.recentCloses);
    const ema200 = MathEngine.calcEMA(data.recentCloses, 200);

    if (rsi < 30) score += 7.5;
    if (rsi > 70) score -= 7.5;
    if (data.currentPrice > ema200) score += 7.5;
    if (data.currentPrice < ema200) score -= 7.5;

    // Final Decision Thresholds
    if (score >= 85) bias = "DAY TRADE BUY";
    else if (score >= 65) bias = "SCALP BUY";
    else if (score <= -85) bias = "DAY TRADE SELL";
    else if (score <= -65) bias = "SCALP SELL";

    return { bias, confidence: Math.abs(score), rsi: rsi.toFixed(1) };
}

// --- SYSTEM EXECUTION ---
async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    if (files.filter(f => f).length < 4) return alert("All 4 Plain Charts required.");

    btn.innerText = "COUNCIL OF 8 ANALYZING...";
    btn.disabled = true;

    try {
        const key = localStorage.getItem('omni_apiKeyInput');
        const b64Images = await Promise.all(files.map(f => toBase64(f)));

        const rawData = await fetchMarketData(key, b64Images);
        const analysis = runStrategicAnalysis(rawData);
        const logicTxt = await fetchTradeExplanation(key, analysis.bias, rawData);

        renderResults(rawData, analysis, logicTxt);
    } catch (e) {
        console.error(e);
        alert("CRITICAL ERROR: Check API key or Image Clarity.");
    } finally {
        btn.innerText = "Perform Surgical Scan";
        btn.disabled = false;
    }
}

async function fetchMarketData(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `
        PROTOCOL: OMNI_V80_SCRAPE
        Extract raw numeric data from these 4 plain charts.
        Return last 30 candle closes in an array for RSI calculation.
        
        JSON ONLY:
        {
          "asset": "STRING",
          "currentPrice": number,
          "recentCloses": [numbers],
          "liquiditySweep": number,
          "mss": "BULLISH"|"BEARISH"|"NONE",
          "dxyTrend": "BULLISH"|"BEARISH",
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

async function fetchTradeExplanation(key, bias, data) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `Give exactly 12 words explaining a ${bias} on ${data.asset} using liquidity sweeps.`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const json = await res.json();
    return json.candidates[0].content.parts[0].text;
}

function renderResults(rawData, analysis, logic) {
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
    } else {
        ui('poiZone').classList.add('hidden');
        const bal = parseFloat(localStorage.getItem('omni_balanceInput'));
        const risk = parseFloat(localStorage.getItem('omni_riskInput')) / 100;
        const lot = (bal * risk) / (Math.abs(rawData.entry - rawData.sl) * 10);
        ui('lotText').innerText = lot.toFixed(3);
    }
}
