/**
 * OMNI-BLACK v66.0 — DUAL-CORE HARD-LOCK
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✓ Engine 1: gemini-2.5-flash-lite (Fact Extraction)
 * ✓ Engine 2: gemini-2.5-flash (Strategic Synthesis)
 * ✓ Logic: SMC, ICT, PA, DXY, SR, SD, Elliott, Wyckoff
 * ✓ Risk: 1:2 Min RR Hard-Lock
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const ASSET_SPECS = {
    CRYPTO: { div: 1 },
    FOREX: { div: 10 },
    COMMODITY: { div: 100 }
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const files = window.omniFiles.filter(f => f !== null);
    
    if (files.length < 2) return alert("UPLOAD MINIMUM 2 CHARTS.");

    setBtnState(btn, true, "STABILIZING BRIDGE...");
    try {
        const key = localStorage.getItem('omni_api_key');
        if (!key) throw new Error("API Key Missing.");

        const facts = [];
        const labels = ["1H", "15M", "1M", "DXY"];

        // STEP 1: FACT EXTRACTION (Using Flash-Lite for speed and high-volume data)
        for (let i = 0; i < window.omniFiles.length; i++) {
            if (window.omniFiles[i]) {
                setBtnState(btn, true, `OPTIMIZING ${labels[i]}...`);
                const compressed = await compressImage(window.omniFiles[i]);
                
                setBtnState(btn, true, `SCANNING ${labels[i]} (LITE)...`);
                const data = await callAPI(key, "gemini-2.5-flash-lite", compressed, 
                    `Extract ${labels[i]} Chart Data: Ticker, Price, Market Structure (BOS/CHoCH). 
                    Return JSON: {"tf":"${labels[i]}", "ticker":"string", "price":number, "structure":"string", "type":"CRYPTO"|"FOREX"}`);
                facts.push(data);
            }
        }

        // STEP 2: STRATEGIC MATRIX (Using Flash for high-reasoning synthesis)
        setBtnState(btn, true, "EXECUTING MATRIX (FLASH)...");
        const signal = await callAPI(key, "gemini-2.5-flash", null, 
            `You are OMNI-BLACK v66.0. Facts: ${JSON.stringify(facts)}.
            Apply 8-Core Matrix: SMC, ICT, PA, DXY, SR, SD, Elliott, Wyckoff.
            Enforce Min RR 1:2. Identify Entry, SL, TP. 
            Return JSON: {"bias":"BUY"|"SELL"|"WATCHING", "entry":number, "sl":number, "tp":number, "strategy":string, "conf":number, "logic":string, "type":"CRYPTO"|"FOREX"}`);

        renderOutput(signal);
        out.classList.remove('hidden');
    } catch (err) {
        alert("TERMINAL ERROR: " + err.message);
    } finally {
        setBtnState(btn, false, "Execute Scan");
    }
}

async function callAPI(key, model, b64, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
    };

    if (b64) {
        payload.contents[0].parts.push({
            inline_data: { mime_type: "image/jpeg", data: b64.split(',')[1] }
        });
    }

    const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
    const json = await res.json();
    
    // Null-safety gate for candidates
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`${model} Bridge Blocked. Check Key/Network.`);
    
    return JSON.parse(text);
}

async function compressImage(file) {
    return new Promise(res => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1000;
                const scale = MAX / img.width;
                canvas.width = MAX;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                res(canvas.toBaseURL('image/jpeg', 0.6));
            };
        };
    });
}

function renderOutput(data) {
    const bTxt = document.getElementById('biasTxt');
    bTxt.innerText = data.bias;
    bTxt.className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'}`;
    
    document.getElementById('entVal').innerText = data.entry || '--';
    document.getElementById('slVal').innerText = data.sl || '--';
    document.getElementById('tpVal').innerText = data.tp || '--';

    const risk = Math.abs(data.entry - data.sl) || 0.0001;
    let rr = (Math.abs(data.tp - data.entry) / risk).toFixed(1);

    // Hard-Lock 1:2 RR enforcement
    if (data.bias !== 'WATCHING' && rr < 2.0) {
        rr = "2.0 (HARD-LOCK)";
        data.tp = data.bias === 'BUY' ? data.entry + (risk * 2) : data.entry - (risk * 2);
        document.getElementById('tpVal').innerText = data.tp.toFixed(5);
    }

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-cyan-500/20 text-cyan-400">${data.strategy}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-white/10 text-white">RR 1:${rr}</span>
            <span class="px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400">${data.conf}/8 CONF</span>
        </div>
        <p class="leading-relaxed opacity-90">${data.logic}</p>`;

    const bal = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_risk')) || 0;
    if (bal && rsk && risk > 0) {
        const s = ASSET_SPECS[data.type] || ASSET_SPECS.CRYPTO;
        document.getElementById('lotVal').innerText = ((bal * (rsk/100)) / (risk * (s.div || 1))).toFixed(4);
    }
}

function setBtnState(b, d, t) { b.disabled = d; b.innerText = t; b.style.opacity = d ? "0.5" : "1"; }
