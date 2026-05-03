/**
 * OMNI-BLACK | VERSION 62.0 — STABLE DEFINITIVE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✓ Model: Gemini 2.5 Flash (Strict Enforcement)
 * ✓ 8-Strategy Matrix: SMC, ICT, PA, DXY, SR, SD, Elliott, Wyckoff
 * ✓ Frequency Boost: 1M Displacement + Sweep triggers enabled
 * ✓ RR Matrix: 1:2.5 Minimum Floor to 1:8 Structural Target
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

let files = [null, null, null, null];

const ASSET_SPECS = {
    CRYPTO: { maxSL: 120, maxTP: 600, spread: 50, lotDivisor: 1 },
    FOREX: { maxSL: 0.0008, maxTP: 0.0045, spread: 0.0001, lotDivisor: 10 },
    COMMODITY: { maxSL: 80, maxTP: 450, spread: 30, lotDivisor: 100 }
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    if (files.filter(f => f).length < 2) { showAlert("UPLOAD ERROR: 15M + 1M required."); return; }

    setButtonState(btn, true, "SCANNING LIQUIDITY...");
    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("API Key missing.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const signal = await fetchGeminiAnalysis(apiKey, b64Images);
        renderOutput(signal);
        if (out) { out.classList.remove('hidden'); out.scrollIntoView({ behavior: 'smooth' }); }
    } catch (err) {
        showAlert("SYSTEM ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "EXECUTE COMMAND");
    }
}

async function fetchGeminiAnalysis(key, images) {
    const model = "gemini-2.5-flash"; // Reverted to 2.5 Flash as requested
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // PASS 1: RAW EXTRACTION
    const p1Prompt = `Extract raw facts: Asset ticker, exact live price, 1H trend, 15M structure, 1M sweep/mss levels. Return JSON only: { "assetType": "CRYPTO"|"FOREX"|"COMMODITY", "currentPrice": number, "readings": { "1H": string, "15M": { "struct": string, "ob": number, "fvg": number }, "1M": { "sweep": boolean, "mss": boolean, "high": number, "low": number } } }`;
    const p1res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p1Prompt }, ...inlineData] }], generationConfig: { response_mime_type: "application/json", temperature: 0.05 } }) });
    const facts = JSON.parse((await p1res.json()).candidates[0].content.parts[0].text);

    // PASS 2: STRATEGY + FREQUENCY BOOST
    const p2Prompt = `You are OMNI-BLACK. Facts: ${JSON.stringify(facts)}.
    EVALUATE 8 STRATEGIES: SMC, ICT, PA, DXY_CORR, SR, SD, ELLIOTT, WYCKOFF.
    1. AGGRESSIVE: If 1M chart shows Sweep + Displacement, trigger even if HTF is neutral.
    2. Minimum 3 confluences for trade firing. 
    3. RR SCALING: Prioritize targets at 15M FVGs or Liquidity Voids for 1:4 to 1:8 setups.
    4. If WATCHING, provide Scout POI level.
    Return JSON: { "bias": "BUY"|"SELL"|"WATCHING", "entry": number, "sl": number, "tp": number, "strategy": string, "confluences": number, "conf": number, "logic": string, "scout": { "level": number, "msg": string } }`;
    
    const p2res = await fetch(url, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: p2Prompt }] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } }) });
    let sig = JSON.parse((await p2res.json()).candidates[0].content.parts[0].text);

    // QUANT ENFORCEMENT
    const sp = ASSET_SPECS[facts.assetType] || ASSET_SPECS.CRYPTO;
    if (sig.bias !== 'WATCHING') {
        const risk = Math.abs(sig.entry - sig.sl) || 1;
        const rr = Math.abs(sig.tp - sig.entry) / risk;
        
        if (rr < 2.5) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * 2.5) : sig.entry - (risk * 2.5);
        if (rr > 8.0) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * 8.0) : sig.entry - (risk * 8.0);
        
        const dist = Math.abs(sig.tp - sig.entry);
        if (dist > sp.maxTP) sig.tp = sig.bias === 'BUY' ? sig.entry + sp.maxTP : sig.entry - sp.maxTP;
    }
    sig.assetType = facts.assetType; sig.currentPrice = facts.currentPrice;
    return sig;
}

function renderOutput(data) {
    const update = (id, val) => { if (document.getElementById(id)) document.getElementById(id).innerText = val; };
    const bTxt = document.getElementById('biasTxt');

    bTxt.innerText = data.bias;
    bTxt.className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'}`;
    
    update('entVal', data.entry?.toFixed(2) || '--');
    update('slVal', data.sl?.toFixed(2) || '--');
    update('tpVal', data.tp?.toFixed(2) || '--');

    const logicBox = document.getElementById('logicSummary');
    const risk = Math.abs(data.entry - data.sl) || 0;
    const rr = risk > 0 ? (Math.abs(data.tp - data.entry) / risk).toFixed(1) : '0.0';
    
    let scoutHtml = (data.bias === 'WATCHING' && data.scout) ? `
        <div class="mt-4 p-4 border border-cyan-500/30 bg-cyan-500/5 rounded-2xl border-dashed">
            <p class="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Scout POI: ${data.scout.level || '--'}</p>
            <p class="text-[12px] text-white font-medium italic">"${data.scout.msg}"</p>
        </div>` : '';

    logicBox.innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-400">${data.strategy || 'OMNI-CORE'}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-white/10 text-white">RR 1:${rr}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400">${data.confluences}/8 CONF</span>
        </div>
        <p class="text-[13px] text-white/80 leading-relaxed">${data.logic}</p>${scoutHtml}`;

    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && rsk && risk > 0) {
        const sp = ASSET_SPECS[data.assetType] || ASSET_SPECS.CRYPTO;
        const size = (bal * (rsk / 100)) / (risk * sp.lotDivisor);
        update('lotVal', size.toFixed(4));
    }
}

function setButtonState(btn, d, t) { if(btn) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? '0.6' : '1'; } }
function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
function showAlert(m) { alert(m); }
