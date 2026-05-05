/**
 * OMNI-BLACK | VERSION 52.8 (POI PRECISION PROTOCOL)
 * Mandate: Zero-Undefined UI + Forced POI Logic
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('scanBtn');
    const out = document.getElementById('resultBox');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "COUNCIL OF 8 ANALYZING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- 1. PROXIMITY GATE: Await Retracement Logic ---
        const priceToEntryGap = Math.abs(analysis.currentPrice - analysis.entry);
        const allowedGap = Math.abs(analysis.entry - analysis.sl) * 0.5;

        if (priceToEntryGap > allowedGap && analysis.bias !== "WATCHING") {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry; // Lock the original entry as the POI
            analysis.logic = `Price overextended. Await retracement to ${analysis.entry} POI.`;
        }

        // --- 2. RR GATE: 1:2 Minimum Requirement ---
        const riskPoints = Math.abs(analysis.entry - analysis.sl);
        const rewardPoints = Math.abs(analysis.tp - analysis.entry);
        const currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        if (analysis.bias !== "WATCHING" && currentRR < 2) {
            analysis.bias = "WATCHING";
            analysis.poi = analysis.entry;
            analysis.logic = `Risk/Reward ${currentRR.toFixed(1)} below 1:2. Awaiting better entry.`;
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
        PROTOCOL: OMNI_V52_8_SURGICAL
        MANDATE: Read charts with 100% precision. Identify Asset, Price, and POI levels.
        JSON ONLY:
        {
          "assetName": "STRING",
          "currentPrice": number,
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "10-15 WORDS ONLY",
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
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function renderOutput(data, currentRR) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val || "---"; };

    // Update Main Bias Text
    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias || "WATCHING";
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    // Surgical Level Updates (Fallback to Entry if POI is missing)
    update('entText', data.entry);
    update('slText', data.sl);
    update('tpText', data.tp);
    update('poiLevel', data.poi || data.entry || "WAITING");
    update('logicText', data.logic || "Awaiting market confluence at POI.");
    update('tradeTypeLabel', `${data.assetName || "ASSET"} | ${data.tradeType || "SCANNING"}`);
    update('supText', data.sup);
    update('resText', data.res);
    update('rrText', `1:${currentRR.toFixed(1)}`);

    // Handle the POI Visibility Box
    const pz = ui('poiZone');
    if (pz) {
        data.bias === 'WATCHING' ? pz.classList.remove('hidden') : pz.classList.add('hidden');
    }

    // Dynamic Lot Math
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    
    if (bal && riskPct && data.entry && data.sl && data.bias !== "WATCHING") {
        const riskCash = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        let lotSize = riskCash / priceDiff;

        if (data.assetName?.toUpperCase().includes("XAU") || data.assetName?.toUpperCase().includes("GOLD")) {
            lotSize /= 100;
        } else if (priceDiff < 1) {
            lotSize /= 10;
        }
        update('lotText', lotSize.toFixed(3));
    } else {
        update('lotText', "WAIT");
    }
}

// Auto-Load Hardware settings
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
