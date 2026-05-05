/**
 * OMNI-BLACK | VERSION 53.0 (STRATEGIC PRIORITY & SAFETY)
 * Mandate: Prioritize Safe Day Trades over Risky Scalps + Zero-Undefined UI
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
        
        // --- 1. MATHEMATICAL SUITE ---
        const riskPoints = Math.abs(analysis.entry - analysis.sl) || 0.0001; // Avoid div by zero
        const rewardPoints = Math.abs(analysis.tp - analysis.entry);
        const currentRR = rewardPoints / riskPoints;
        const priceToEntryGap = Math.abs(analysis.currentPrice - analysis.entry);
        const allowedGap = riskPoints * 0.5;

        // --- 2. STRATEGIC PRIORITY ENGINE ---
        
        // DEFAULT: Start by checking if any crucial data is missing
        if (!analysis.entry || !analysis.sl) {
            analysis.bias = "WATCHING";
            analysis.logic = "Incomplete chart data. Retake screenshots with clear price axis.";
        }

        // SCALP PRIORITY: Enforce 1:2 RR Floor
        if (analysis.tradeType === "SCALP" && currentRR < 2 && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = `Scalp RR ${currentRR.toFixed(1)} < 1:2 threshold. Awaiting better POI.`;
        }

        // DAY TRADE PRIORITY: Enforce Safety Over Frequency
        if (analysis.tradeType === "DAY TRADE") {
            if (currentRR >= 3) {
                analysis.logic = `Safe Day Trade detected. High RR (${currentRR.toFixed(1)}) prioritized.`;
            } else if (currentRR < 2) {
                analysis.bias = "WATCHING";
                analysis.poi = analysis.entry;
                analysis.logic = "Day Trade RR insufficient. Monitoring higher timeframe levels.";
            }
        }

        // PROXIMITY GATE: Check if price has already left the station
        if (priceToEntryGap > allowedGap && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = `Price is ${priceToEntryGap.toFixed(2)} pts away. Await retracement to POI.`;
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V53_PRIORITY
        MANDATE: Read charts with 100% precision. Prioritize DAY TRADE over SCALP if profitability is higher.
        JSON ONLY (Do not include markdown tags):
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "10-15 WORDS MAX",
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
    
    // Surgical Sanitization: Remove any markdown code blocks if the AI includes them
    const cleanJson = textResult.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
}

function renderOutput(data, currentRR) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val || "---"; };

    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias || "WATCHING";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    update('entText', data.entry);
    update('slText', data.sl);
    update('tpText', data.tp);
    update('poiLevel', data.poi || data.entry || "WAITING");
    update('logicText', data.logic || "Analyzing market structure...");
    update('tradeTypeLabel', `${data.assetName || "ASSET"} | ${data.tradeType || "SCANNING"}`);
    update('supText', data.sup);
    update('resText', data.res);
    update('rrText', `1:${currentRR.toFixed(1)}`);

    const pz = ui('poiZone');
    if (pz) {
        data.bias === 'WATCHING' ? pz.classList.remove('hidden') : pz.classList.add('hidden');
    }

    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    
    if (bal && riskPct && data.entry && data.sl && data.bias !== "WATCHING") {
        const riskCash = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let lotSize = riskCash / priceDiff;

        // Surgical Asset Scaling
        const asset = data.assetName?.toUpperCase() || "";
        if (asset.includes("XAU") || asset.includes("GOLD")) {
            lotSize /= 100;
        } else if (priceDiff < 1) {
            lotSize /= 10;
        }
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAIT");
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const keys = ['omni_api_key', 'omni_balance', 'omni_risk'];
    const ids = ['apiInput', 'bal', 'risk'];
    keys.forEach((k, i) => {
        const val = localStorage.getItem(k);
        if (val) document.getElementById(ids[i]).value = val;
    });
});

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
