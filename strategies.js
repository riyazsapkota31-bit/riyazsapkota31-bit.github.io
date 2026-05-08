/**
 * OMNI-BLACK | VERSION 85.0 (SENSOR-EXECUTION SPLIT)
 * Gemini = Sensor & Narrator | JS = Decision Engine
 */

let files = [null, null, null, null]; 
const ui = (id) => document.getElementById(id);
const toBase64 = (file) => new Promise(res => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result);
});

// --- PERSISTENCE ---
document.addEventListener('DOMContentLoaded', () => {
    ['apiKeyInput', 'balanceInput', 'riskInput'].forEach(id => {
        const val = localStorage.getItem('omni_' + id);
        if (val && ui(id)) ui(id).value = val;
    });
});

async function secureParameters() {
    ['apiKeyInput', 'balanceInput', 'riskInput'].forEach(id => {
        localStorage.setItem('omni_' + id, ui(id).value);
    });
    alert("SYSTEM LOCKED");
    toggleDrawer();
}

// --- APP DECISION ENGINE (The "Brain") ---
const DecisionEngine = {
    calcRSI: (prices) => {
        if (!prices || prices.length < 14) return 50;
        let gains = 0, losses = 0;
        for (let i = 1; i < 15; i++) {
            let d = prices[i] - prices[i-1];
            d > 0 ? gains += d : losses -= d;
        }
        return 100 - (100 / (1 + (gains / (losses || 1))));
    },
    
    analyze: (data) => {
        let score = 0;
        const rsi = DecisionEngine.calcRSI(data.recentCloses);
        
        // Institutional Weight (65%)
        if (data.mss === "BULLISH") score += 25;
        if (data.mss === "BEARISH") score -= 25;
        if (Math.abs(data.currentPrice - data.liquiditySweep) / data.currentPrice < 0.002) score += 40;

        // DXY Weight (20%)
        if (data.dxyTrend === "BEARISH") score += 20;
        if (data.dxyTrend === "BULLISH") score -= 20;

        // Retail/Internal Math (15%)
        if (rsi < 35) score += 15;
        if (rsi > 65) score -= 15;

        let bias = "WAIT";
        if (score >= 60) bias = "BUY";
        else if (score <= -60) bias = "SELL";

        return { bias, confidence: Math.abs(score), rsi: rsi.toFixed(1) };
    }
};

// --- SYSTEM PIPELINE ---
async function executeSurgicalScan() {
    const btn = ui('scanBtn');
    if (files.filter(f => f).length < 4) return alert("Upload all 4 plain charts.");
    
    btn.innerText = "GEMINI SENSORS SCANNING...";
    btn.disabled = true;

    try {
        const key = localStorage.getItem('omni_apiKeyInput');
        const b64Images = await Promise.all(files.map(f => toBase64(f)));

        // 1. GEMINI READS CHART DATA
        const marketData = await geminiSensor(key, b64Images);

        // 2. APP MAKES THE SIGNAL DECISION
        const decision = DecisionEngine.analyze(marketData);

        // 3. GEMINI GENERATES LOGIC BASED ON APP'S SIGNAL
        const finalNarrative = await geminiNarrator(key, decision.bias, marketData);

        renderUI(marketData, decision, finalNarrative);
    } catch (e) {
        alert("SCAN ERROR: Ensure API Key is valid.");
    } finally {
        btn.innerText = "Perform Surgical Scan";
        btn.disabled = false;
    }
}

async function geminiSensor(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `
        TASK: Extract precise data from these plain charts. 
        Focus on: Last 20 candle closes, Liquidity Sweep level, MSS status, DXY Trend, and specific POI price.
        JSON ONLY:
        {
          "asset": "STRING",
          "currentPrice": number,
          "recentCloses": [numbers],
          "liquiditySweep": number,
          "mss": "BULLISH"|"BEARISH"|"NONE",
          "dxyTrend": "BULLISH"|"BEARISH",
          "poi": number,
          "suggested_sl": number, "suggested_tp": number
        }`;

    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...images.map(img => ({ inline_data: { mime_type: "image/jpeg", data: img.split(',')[1] } }))] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });
    const j = await res.json();
    return JSON.parse(j.candidates[0].content.parts[0].text);
}

async function geminiNarrator(key, signal, data) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = signal === "WAIT" 
        ? `The app signal is WAIT. Explain in 10-15 words why we must wait for the POI at ${data.poi} based on the chart structure.`
        : `The app signal is ${signal}. Give a 10-15 word logic for this ${signal} on ${data.asset} based on institutional liquidity.`;

    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const j = await res.json();
    return j.candidates[0].content.parts[0].text;
}

function renderUI(data, decision, narrative) {
    ui('resultBox').classList.remove('hidden');
    ui('actionText').innerText = decision.bias;
    ui('actionText').className = `text-6xl font-black italic uppercase glow-text ${decision.bias === 'BUY' ? 'text-emerald-400' : decision.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'}`;
    
    ui('logicText').innerText = narrative;
    ui('scoreText').innerText = `Confidence: ${decision.confidence}%`;
    ui('rsiVal').innerText = decision.rsi;
    ui('dxyStatus').innerText = data.dxyTrend;
    ui('poiLevel').innerText = data.poi || "ANALYZING";

    if (decision.bias === "WAIT") {
        ui('poiZone').classList.remove('hidden');
        ui('entText').innerText = "---"; ui('slText').innerText = "---"; ui('tpText').innerText = "---";
        ui('lotText').innerText = "0.00";
    } else {
        ui('poiZone').classList.add('hidden');
        ui('entText').innerText = data.currentPrice;
        ui('slText').innerText = data.suggested_sl;
        ui('tpText').innerText = data.suggested_tp;
        
        const bal = parseFloat(localStorage.getItem('omni_balanceInput'));
        const risk = parseFloat(localStorage.getItem('omni_riskInput')) / 100;
        const lot = (bal * risk) / (Math.abs(data.currentPrice - data.suggested_sl) * 10);
        ui('lotText').innerText = lot.toFixed(3);
    }
}
