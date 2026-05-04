/**
 * OMNI-BLACK | VERSION 51.8 (THE ASSET-AWARE DIRECTIVE)
 * Core: 8-Core Aggregator + Dynamic Asset Recognition
 * Risk: Hard 1:2 RR Gate | Dynamic Contract Normalization
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('scanBtn');
    const out = document.getElementById('resultBox');
    
    if (files.filter(f => f).length < 2) {
        alert("UPLOAD ERROR: Surgical confluence requires at least 2 timeframe layers.");
        return;
    }

    if (btn) { btn.innerText = "DETECTING ASSET & ANALYZING..."; btn.disabled = true; }

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("Hardware Link Offline: Enter API key in settings.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // --- HARD-CODED RR CALCULATION ---
        const riskPoints = Math.abs(analysis.entry - analysis.sl);
        const rewardPoints = Math.abs(analysis.tp - analysis.entry);
        const currentRR = riskPoints > 0 ? (rewardPoints / riskPoints) : 0;

        // --- 1:2 RR HARD-GATE ---
        if (analysis.bias !== "WATCHING" && currentRR < 2) {
            analysis.bias = "WATCHING";
            analysis.tradeType = "RR INVALID";
            analysis.logic = "Setup downgraded; Risk-to-Reward ratio below 1:2 threshold.";
            if (!analysis.poi) analysis.poi = analysis.entry; 
        }

        renderOutput(analysis, currentRR);
        
        if (out) {
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }

    } catch (err) {
        console.error("System Crash Prevented:", err);
        alert("CRITICAL ERROR: " + err.message);
    } finally {
        if (btn) { btn.innerText = "Perform Surgical Scan"; btn.disabled = false; }
    }
}

async function fetchGeminiAnalysis(key, images) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `
        PROTOCOL: OMNI_V51_8_ASSET_DETECT
        MANDATE:
        1. ASSET: Look at the top-left corner text of the charts. Identify if it is GOLD (XAU), BTC, ETH, or a Forex pair. Return exact ticker.
        2. STRATEGY: 8-Core Aggregator (SMC, ICT, VSA, Wyckoff).
        3. ACCURACY: Grade A precision. Read raw Y-axis for price coordinates.
        4. LOGIC: Exactly 10-15 words on institutional footprint.
        5. JSON ONLY.

        RETURN FORMAT:
        {
          "assetName": "STRING",
          "tradeType": "SCALP"|"DAY TRADE",
          "bias": "BUY"|"SELL"|"WATCHING",
          "entry": number, "sl": number, "tp": number, "poi": number,
          "logic": "STRING",
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
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    const bEl = ui('actionText');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-7xl font-black italic tracking-tighter uppercase leading-none glow-text ${
            data.bias === 'BUY' ? 'text-emerald-400' : 
            data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-400'
        }`;
    }

    update('entText', data.entry);
    update('slText', data.sl);
    update('tpText', data.tp);
    update('poiLevel', data.poi || data.entry);
    update('logicText', data.logic);
    update('tradeTypeLabel', `${data.assetName} | ${data.tradeType}`);
    update('supText', data.sup);
    update('resText', data.res);
    update('rrText', `1:${currentRR.toFixed(1)}`);

    // --- DYNAMIC ASSET-BASED LOT MATH ---
    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk')) || 0;
    
    if (bal && riskPct && data.entry && data.sl) {
        const riskCash = bal * (riskPct / 100);
        const priceDiff = Math.abs(data.entry - data.sl);
        const asset = data.assetName.toUpperCase();
        
        let lotSize = riskCash / priceDiff;

        // Apply Logic based on Asset Detection
        if (asset.includes("GOLD") || asset.includes("XAU")) {
            lotSize /= 100; // Normalizes Gold Contract (1 Lot = 100oz)
        } else if (asset.includes("BTC") || asset.includes("ETH")) {
            // Standard 1:1 Crypto math
        } else if (priceDiff < 1) {
            lotSize /= 10; // Forex Normalization
        }

        update('lotText', lotSize.toFixed(3));
    }

    const pz = ui('poiZone');
    if (pz) data.bias === 'WATCHING' ? pz.classList.remove('hidden') : pz.classList.add('hidden');
}

// --- AUTO-LOAD SAVED HARDWARE LINK ---
window.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('omni_api_key');
    const savedBal = localStorage.getItem('omni_balance');
    const savedRisk = localStorage.getItem('omni_risk');

    if (savedKey) document.getElementById('apiInput').value = savedKey;
    if (savedBal) document.getElementById('bal').value = savedBal;
    if (savedRisk) document.getElementById('risk').value = savedRisk;
});

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}
