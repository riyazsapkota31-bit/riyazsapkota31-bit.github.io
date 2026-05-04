/**
 * OMNI-BLACK | VERSION 63.0 — ULTIMATE STABLE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✓ Model: gemini-2.5-flash (STRICT HARD-LOCK)
 * ✓ 8-Strategy Matrix: SMC, ICT, PA, DXY, SR, SD, Elliott, Wyckoff
 * ✓ Frequency Boost: 1M Displacement + Sweep triggers
 * ✓ RR Matrix: 1:2.5 Min Floor | 1:8 Structural Target
 * ✓ Fix: Global Buffer Synchronization & Null-Pointer Defense
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const ASSET_SPECS = {
    CRYPTO: { maxSL: 150, maxTP: 800, lotDivisor: 1 },
    FOREX: { maxSL: 0.0010, maxTP: 0.0050, lotDivisor: 10 },
    COMMODITY: { maxSL: 100, maxTP: 500, lotDivisor: 100 }
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    const activeFiles = window.omniFiles ? window.omniFiles.filter(f => f !== null) : [];
    if (activeFiles.length < 2) { 
        showAlert("LACK OF CONFLUENCE: Upload 15M + 1M charts."); 
        return; 
    }

    setButtonState(btn, true, "STABILIZING BRIDGE...");
    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("API Key missing. Check Hardware Link.");

        const b64Images = await Promise.all(
            window.omniFiles.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const signal = await fetchGeminiAnalysis(apiKey, b64Images);
        
        if (!signal || !signal.bias) throw new Error("Strategic Matrix returned null.");

        renderOutput(signal);
        out?.classList.remove('hidden');
        out?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert("TERMINAL ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "EXECUTE COMMAND");
    }
}

async function fetchGeminiAnalysis(key, images, retryCount = 0) {
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ 
        inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } 
    }));

    try {
        const p1Prompt = `Extract raw data: Ticker, price, 1H trend, 15M structure, 1M sweep/mss. Return JSON only: { "assetType": "CRYPTO"|"FOREX", "currentPrice": number, "readings": { "1H": string, "15M": object, "1M": object } }`;
        const p1res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p1Prompt }, ...inlineData] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } }) });
        const p1Data = await p1res.json();

        if (!p1Data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Bridge Failure");
        const facts = JSON.parse(p1Data.candidates[0].content.parts[0].text);

        const p2Prompt = `You are OMNI-BLACK Core. Facts: ${JSON.stringify(facts)}.
        1. ENGINE: SMC, ICT, PA, DXY_CORR, SR, SD, ELLIOTT, WYCKOFF.
        2. SCALPING (1M): If Sweep + Displacement occurs, trigger Aggressive Scalp.
        3. DAY TRADING (15M): If 1M is noise, pivot to Structural POI on 15M.
        4. RR SCALING: Min 1:2.5, Max 1:8. 
        Return JSON: { "bias": "BUY"|"SELL"|"WATCHING", "entry": number, "sl": number, "tp": number, "strategy": string, "confluences": number, "logic": string }`;
        
        const p2res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p2Prompt }] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } }) });
        const p2Data = await p2res.json();

        if (!p2Data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Strategic Timeout");
        let sig = JSON.parse(p2Data.candidates[0].content.parts[0].text);

        if (sig.bias !== 'WATCHING') {
            const risk = Math.abs(sig.entry - sig.sl) || 0.01;
            const rr = Math.abs(sig.tp - sig.entry) / risk;
            if (rr < 2.5) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * 2.5) : sig.entry - (risk * 2.5);
        }
        sig.assetType = facts.assetType;
        return sig;

    } catch (e) {
        if (retryCount < 2) return fetchGeminiAnalysis(key, images, retryCount + 1);
        throw e;
    }
}

function renderOutput(data) {
    const bTxt = document.getElementById('biasTxt');
    bTxt.innerText = data.bias;
    bTxt.className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'}`;
    
    document.getElementById('entVal').innerText = data.entry?.toLocaleString() || '--';
    document.getElementById('slVal').innerText = data.sl?.toLocaleString() || '--';
    document.getElementById('tpVal').innerText = data.tp?.toLocaleString() || '--';

    const risk = Math.abs(data.entry - data.sl) || 0;
    const rr = risk > 0 ? (Math.abs(data.tp - data.entry) / risk).toFixed(1) : '0.0';
    
    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-400">${data.strategy}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-white/10 text-white">RR 1:${rr}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400">${data.confluences}/8 CONF</span>
        </div>
        <p class="text-[13px] text-white/80 leading-relaxed uppercase font-bold">${data.logic}</p>`;

    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && rsk && risk > 0) {
        const sp = ASSET_SPECS[data.assetType] || ASSET_SPECS.CRYPTO;
        const size = (bal * (rsk / 100)) / (risk * sp.lotDivisor);
        document.getElementById('lotVal').innerText = size.toFixed(4);
    }
}

function setButtonState(btn, d, t) { if(btn) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? '0.6' : '1'; } }
function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
function showAlert(m) { alert(m); }
