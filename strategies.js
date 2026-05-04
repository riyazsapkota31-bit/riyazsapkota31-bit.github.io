/**
 * OMNI-BLACK | VERSION 62.8 — PRODUCTION DEFENSE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✓ Model: gemini-2.5-flash (STRICT HARD-LOCK)
 * ✓ Logic: Adaptive Scalp (1M) & Day Trade (15M) Confluence
 * ✓ Strategies: SMC, ICT, PA, DXY, SR, SD, Elliott, Wyckoff
 * ✓ Safety: Triple-Gate API Validation & RR Auto-Enforcement
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

let files = [null, null, null, null];

const ASSET_SPECS = {
    CRYPTO: { maxSL: 120, maxTP: 600, lotDivisor: 1 },
    FOREX: { maxSL: 0.0008, maxTP: 0.0045, lotDivisor: 10 },
    COMMODITY: { maxSL: 80, maxTP: 450, lotDivisor: 100 }
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    if (files.filter(f => f).length < 2) { showAlert("LACK OF CONFLUENCE: 15M + 1M required."); return; }

    setButtonState(btn, true, "INITIALIZING BRIDGE...");
    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("API Key missing in Hardware Link.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const signal = await fetchGeminiAnalysis(apiKey, b64Images);
        
        // Gate 3: Response integrity check
        if (!signal || !signal.bias) throw new Error("Strategic Matrix returned invalid data.");

        renderOutput(signal);
        out?.classList.remove('hidden');
        out?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showAlert("TERMINAL ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "EXECUTE COMMAND");
    }
}

async function fetchGeminiAnalysis(key, images) {
    const model = "gemini-2.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // PASS 1: CORE FACT EXTRACTION
    const p1Prompt = `Extract raw data: Ticker, price, 1H trend, 15M structure, 1M sweep/mss. Return JSON only: { "assetType": "CRYPTO"|"FOREX", "currentPrice": number, "readings": { "1H": string, "15M": object, "1M": object } }`;
    
    const p1res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p1Prompt }, ...inlineData] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } }) });
    const p1Data = await p1res.json();

    // Gate 1: Bridge Validation
    if (!p1Data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("2.5 Flash Bridge Failure. (Extraction Pass)");
    const facts = JSON.parse(p1Data.candidates[0].content.parts[0].text);

    // PASS 2: 8-STRATEGY CONFLUENCE & FREQUENCY BOOST
    const p2Prompt = `You are OMNI-BLACK Core. Facts: ${JSON.stringify(facts)}.
    1. ENGINE: SMC, ICT, PA, DXY_CORR, SR, SD, ELLIOTT, WYCKOFF.
    2. SCALPING (1M): If Sweep + Displacement occurs, trigger Aggressive Scalp.
    3. DAY TRADING (15M): If 1M is unclear, pivot to Structural POI on 15M.
    4. RR SCALING: Min 1:2.5, Max 1:8. Target Liquidity Voids.
    Return JSON: { "bias": "BUY"|"SELL"|"WATCHING", "entry": number, "sl": number, "tp": number, "strategy": string, "confluences": number, "logic": string, "scout": { "level": number, "msg": string } }`;
    
    const p2res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p2Prompt }] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } }) });
    const p2Data = await p2res.json();

    // Gate 2: Strategic Validation
    if (!p2Data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("Strategic Matrix Timeout. (Analysis Pass)");
    let sig = JSON.parse(p2Data.candidates[0].content.parts[0].text);

    // QUANT ENFORCEMENT (RR Management)
    if (sig.bias !== 'WATCHING') {
        const risk = Math.abs(sig.entry - sig.sl) || 0.01;
        const rr = Math.abs(sig.tp - sig.entry) / risk;
        if (rr < 2.5) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * 2.5) : sig.entry - (risk * 2.5);
        if (rr > 8.0) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * 8.0) : sig.entry - (risk * 8.0);
    }
    sig.assetType = facts.assetType;
    return sig;
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
        <p class="text-[13px] text-white/80 leading-relaxed uppercase">${data.logic}</p>`;

    // Lot Size calculation based on balance/risk
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
