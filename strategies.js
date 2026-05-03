/**
 * OMNI-BLACK | VERSION 56.0 (PRECISION-APEX)
 * — Two-pass analysis: READ first, VERIFY second before signaling
 * — Strict self-invalidation: if any step fails its own check → WATCHING
 * — Dynamic RR: 1:2 floor, structure-driven ceiling (1:8+)
 * — High frequency: fires on 3+ confluences, skips only on real conflict
 * — Zero jargon logic output: plain English 1-2 sentences
 */

let files = [null, null, null, null];

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');

    const loadedFiles = files.filter(f => f);
    if (loadedFiles.length < 2) {
        showAlert("UPLOAD ERROR: Minimum 2 charts required (15M trend + 1M entry).");
        return;
    }

    setButtonState(btn, true, "SCANNING MARKET...");

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("No API Key. Open Settings and enter your Gemini key.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        // TWO-PASS: read → verify → output
        const analysis = await fetchGeminiAnalysis(apiKey, b64Images);
        renderOutput(analysis);

        if (out) {
            out.classList.remove('hidden');
            setTimeout(() => out.scrollIntoView({ behavior: 'smooth' }), 100);
        }

    } catch (err) {
        console.error("System Fail:", err);
        showAlert("ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "EXECUTE COMMAND");
    }
}

function setButtonState(btn, disabled, text) {
    if (!btn) return;
    btn.disabled = disabled;
    btn.innerText = text;
    btn.style.opacity = disabled ? '0.6' : '1';
}

async function fetchGeminiAnalysis(key, images) {
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const inlineData = images
        .filter(img => img)
        .map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // ════════════════════════════════════════════════════════════════════════
    // PASS 1 — DEEP CHART READ
    // Goal: extract raw facts from the charts with zero interpretation yet.
    // ════════════════════════════════════════════════════════════════════════
    const pass1Prompt = `
You are a professional chart reader. Your ONLY job right now is to READ and REPORT exactly what you see in these TradingView chart images. Do NOT give a trade signal yet. Just report the raw facts.

TASK: Answer every question below by reading the charts carefully.

━━━ PRICE READING ━━━
Q1. Look at EACH chart image. On the RIGHT EDGE of the Y-axis (price axis) there is a highlighted box showing the current price. What exact number is in that box? List it per chart.
Q2. What is the asset name shown in the top-left of the chart (e.g. BTCUSD, EURUSD, USDX)?
Q3. What timeframe is shown in the top-left (e.g. 1m, 15, 1H)?

━━━ 1H CHART ━━━
Q4. On the 1H chart: is price currently making higher highs and higher lows (uptrend), lower highs and lower lows (downtrend), or is it ranging (sideways)?
Q5. What is the most recent significant 1H swing high price? What is the most recent significant 1H swing low price?

━━━ 15M CHART ━━━
Q6. On the 15M chart: what is the current market structure? (HH/HL = bullish, LH/LL = bearish, ranging = neutral)
Q7. Can you see any unfilled Fair Value Gap (FVG) — a 3-candle pattern where the middle candle left a price gap — on the 15M chart? If yes, what price range does it cover (top and bottom price)?
Q8. Can you see any Order Block on the 15M chart — the last bearish candle before a bullish move (demand OB) or the last bullish candle before a bearish move (supply OB)? If yes, what price is it at?
Q9. What is the nearest 15M swing high price? Nearest 15M swing low price?

━━━ 1M CHART ━━━
Q10. On the 1M chart right now: is there a displacement candle (a large aggressive candle significantly bigger than surrounding candles)? If yes, which direction (up or down)?
Q11. Is there a Break of Structure (BOS) visible on the 1M chart — where price broke above a recent high or below a recent low with a strong candle? If yes, in which direction?
Q12. Has price swept (briefly gone beyond then reversed) any obvious liquidity level (equal highs or equal lows) on the 1M chart? If yes, describe it.
Q13. What is the nearest 1M micro swing high price? Nearest 1M micro swing low price?

━━━ DXY CHART ━━━
Q14. On the DXY chart: is the Dollar Index currently trending up, trending down, or ranging?
Q15. Has DXY recently broken a key level or made a sharp move in either direction?

Return ONLY a JSON object with these exact keys. Use null if something is not visible:
{
  "assetName": string,
  "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
  "currentPrice": number,
  "chartReadings": {
    "1H": { "trend": "BULLISH"|"BEARISH"|"RANGING", "swingHigh": number, "swingLow": number },
    "15M": { "structure": "BULLISH"|"BEARISH"|"RANGING", "fvgTop": number|null, "fvgBottom": number|null, "obLevel": number|null, "swingHigh": number, "swingLow": number },
    "1M": { "displacement": "UP"|"DOWN"|null, "bos": "UP"|"DOWN"|null, "sweepDetected": boolean, "microSwingHigh": number, "microSwingLow": number },
    "DXY": { "trend": "BULLISH"|"BEARISH"|"RANGING", "recentBreak": boolean }
  }
}
`;

    const pass1Response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: pass1Prompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.05, top_p: 1 }
        })
    });

    if (!pass1Response.ok) {
        const e = await pass1Response.text();
        throw new Error(`Pass 1 API Error ${pass1Response.status}: ${e.substring(0, 200)}`);
    }

    const pass1Data = await pass1Response.json();
    const pass1Raw  = pass1Data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!pass1Raw) throw new Error("Pass 1 returned empty. Check chart image quality.");

    let chartFacts;
    try {
        chartFacts = JSON.parse(pass1Raw);
    } catch {
        const m = pass1Raw.match(/\{[\s\S]*\}/);
        if (m) chartFacts = JSON.parse(m[0]);
        else throw new Error("Could not read chart data. Try uploading clearer screenshots.");
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASS 2 — STRATEGY SELECTION + SIGNAL GENERATION
    // Uses the verified facts from Pass 1. No guessing allowed.
    // ════════════════════════════════════════════════════════════════════════
    const pass2Prompt = `
You are OMNI-BLACK, an elite institutional scalp trading engine. You have already read the charts and extracted the following verified facts:

${JSON.stringify(chartFacts, null, 2)}

Now generate a precise scalp trade signal using these facts ONLY. Do NOT re-interpret the charts. Work purely from the data above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE A — BIAS DETERMINATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this logic tree strictly:

BUY conditions (need ALL of these):
  ✓ 15M structure is BULLISH (HH/HL confirmed)
  ✓ 1H trend is BULLISH or RANGING (not actively bearish)
  ✓ DXY is BEARISH or RANGING (weak dollar = bullish crypto/risk assets)
  → If all 3 met: bias = BUY

SELL conditions (need ALL of these):
  ✓ 15M structure is BEARISH (LH/LL confirmed)
  ✓ 1H trend is BEARISH or RANGING (not actively bullish)
  ✓ DXY is BULLISH or RANGING (strong dollar = bearish crypto/risk assets)
  → If all 3 met: bias = SELL

WATCHING: if any of the above conditions conflict or 15M is RANGING with no clear BOS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE B — 8-STRATEGY EVALUATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Using the chart facts, check which strategies are currently active. Count how many agree with the bias:

1. SMC — Active if: 15M has a confirmed BOS/CHOCH AND an OB level exists near current price.
2. ICT — Active if: An FVG exists on 15M or 1M AND a liquidity sweep was detected on 1M.
3. PA — Active if: A 1M displacement candle exists in the direction of the bias.
4. DXY_CORRELATION — Active if: DXY trend is opposite to the asset (DXY bearish + BUY, or DXY bullish + SELL).
5. SR — Active if: currentPrice is within 0.15% of a known swing high (for SELL) or swing low (for BUY).
6. SD — Active if: An OB level exists within 0.3% of currentPrice.
7. ELLIOTT — Active if: 1H shows a clear 3 or 5 wave structure (3 clear pivots visible in the trend).
8. WYCKOFF — Active if: A liquidity sweep on 1M was detected AND 15M structure reversed after the sweep.

Count total active strategies. Pick the ONE most dominant (highest direct evidence from the facts).
If confluences < 3: bias must be WATCHING regardless of structure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE C — PRECISION ENTRY, SL, TP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All prices must be calculated from currentPrice = ${chartFacts.currentPrice}.

ENTRY:
- BUY: entry = currentPrice OR the nearest FVG bottom (fvgBottom) OR OB level — whichever is closest to currentPrice and within 0.3%.
- SELL: entry = currentPrice OR the nearest FVG top (fvgTop) OR OB level — whichever is closest to currentPrice and within 0.3%.
- If no valid level within 0.3% → entry = currentPrice exactly.

STOP LOSS:
- BUY: sl = 1M microSwingLow minus a small buffer (0.05% of entry). Must be below entry.
- SELL: sl = 1M microSwingHigh plus a small buffer (0.05% of entry). Must be above entry.
- If microSwingLow/High is more than 0.3% from entry → use 15M swingLow/High instead.
- Absolute max SL distance: 0.25% of entry.

TAKE PROFIT — DYNAMIC (NO ARTIFICIAL CAP):
- Calculate risk = |entry - sl|
- BUY TP targets in order of priority:
    1. Nearest 15M swing high (if within 5x risk distance) → use it
    2. Nearest 1H swing high (if further) → use it
    3. If neither → entry + (risk × 3) as minimum fallback
- SELL TP targets in order of priority:
    1. Nearest 15M swing low (if within 5x risk distance) → use it
    2. Nearest 1H swing low (if further) → use it
    3. If neither → entry - (risk × 3) as minimum fallback
- Calculate actual rrRatio = |tp - entry| / risk. Report this number.
- Minimum rrRatio = 2.0 always. If calculated TP gives less than 2.0 → force tp to entry ± (risk × 2).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE D — SELF-VALIDATION (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before outputting, verify ALL of these. If ANY fail → set bias = WATCHING:
  ✗ entry is more than 0.5% away from currentPrice → FAIL
  ✗ sl is on the wrong side of entry (sl > entry for BUY, sl < entry for SELL) → FAIL
  ✗ rrRatio is below 2.0 → FAIL
  ✗ confluences is below 3 → FAIL
  ✗ 1H and 15M structure are directly opposing (1H BULLISH + 15M BEARISH with no clear explanation) → FAIL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE E — CONFIDENCE SCORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score 1-10 based on:
+1 per active strategy (max 8 points)
+1 if 1M BOS matches bias direction
+1 if DXY trend is strongly opposite to asset (not just ranging)
Subtract 2 if 1H and 15M disagree on structure
Cap at 10.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE F — LOGIC (PLAIN ENGLISH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write 1-2 sentences like you're texting a friend who trades.
- Simple words. No jargon acronyms unless you explain them.
- Say: what price is doing, where you're entering, and why it looks good.
- Good example: "Price just bounced off a support level and the trend is up. Buying here aiming for the recent high."
- Bad example: "15M BEARISH BOS CONFIRMED. SELLING FVG RETEST INTO PREMIUM ZONE."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — Return ONLY valid JSON. No markdown. No explanation outside the JSON.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "assetName": string,
  "assetType": "CRYPTO"|"FOREX"|"COMMODITY",
  "currentPrice": number,
  "bias": "BUY"|"SELL"|"WATCHING",
  "entry": number,
  "sl": number,
  "tp": number,
  "rrRatio": number,
  "structure": "BEARISH"|"BULLISH"|"RANGING",
  "dxyAlignment": boolean,
  "dominantStrategy": "SMC"|"ICT"|"PA"|"DXY_CORRELATION"|"SR"|"SD"|"ELLIOTT"|"WYCKOFF",
  "trigger": "FVG_RETEST"|"OB_RETEST"|"DISPLACEMENT"|"SWEEP_RETEST"|"SR_BOUNCE"|"SD_ZONE"|"WAVE_PULLBACK"|"WYCKOFF_SPRING"|"WYCKOFF_UTAD"|"NONE",
  "confluences": integer,
  "confidence": integer,
  "logic": string
}
`;

    const pass2Response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: pass2Prompt }] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1, top_p: 0.95 }
        })
    });

    if (!pass2Response.ok) {
        const e = await pass2Response.text();
        throw new Error(`Pass 2 API Error ${pass2Response.status}: ${e.substring(0, 200)}`);
    }

    const pass2Data = await pass2Response.json();
    const pass2Raw  = pass2Data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!pass2Raw) throw new Error("Pass 2 returned empty. Try again.");

    let signal;
    try {
        signal = JSON.parse(pass2Raw);
    } catch {
        const m = pass2Raw.match(/\{[\s\S]*\}/);
        if (m) signal = JSON.parse(m[0]);
        else throw new Error("Could not parse signal. Try re-uploading charts.");
    }

    // ── JS-SIDE SAFETY NET ────────────────────────────────────────────────
    // Final hard checks after Gemini responds — code-level safety
    const risk = Math.abs(signal.entry - signal.sl);
    const rr   = risk > 0 ? Math.abs(signal.tp - signal.entry) / risk : 0;

    // Force WATCHING if any hard rule fails
    if (
        signal.confluences < 3 ||
        rr < 2 ||
        (signal.bias === 'BUY'  && signal.sl >= signal.entry) ||
        (signal.bias === 'SELL' && signal.sl <= signal.entry) ||
        Math.abs(signal.entry - signal.currentPrice) / signal.currentPrice > 0.005
    ) {
        signal.bias      = 'WATCHING';
        signal.logic     = 'Setup did not pass all safety checks. Wait for a cleaner entry.';
        signal.confidence = Math.min(signal.confidence, 4);
    }

    // Enforce minimum 1:2 RR even if Gemini slipped
    if (signal.bias !== 'WATCHING') {
        const minTP = signal.bias === 'BUY'
            ? signal.entry + (risk * 2)
            : signal.entry - (risk * 2);
        if (signal.bias === 'BUY'  && signal.tp < minTP) signal.tp = minTP;
        if (signal.bias === 'SELL' && signal.tp > minTP) signal.tp = minTP;
        signal.rrRatio = risk > 0 ? parseFloat((Math.abs(signal.tp - signal.entry) / risk).toFixed(2)) : 2;
    }

    return signal;
}



function renderOutput(data) {
    const ui = (id) => document.getElementById(id);
    const update = (id, val) => { if (ui(id)) ui(id).innerText = val; };

    // ─── BIAS DISPLAY ────────────────────────────────────────────────────────
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText = data.bias;
        bEl.className = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY'  ? 'text-emerald-400' :
            data.bias === 'SELL' ? 'text-rose-500'    : 'text-slate-500'
        }`;
    }

    // ─── DYNAMIC RR: use Gemini's TP if ≥ 1:2, else enforce 1:2 ────────────
    const risk = Math.abs(data.entry - data.sl);
    const minTP = data.bias === 'BUY'
        ? data.entry + (risk * 2)
        : data.entry - (risk * 2);

    let finalTP = data.tp;
    if (data.bias === 'BUY'  && (!finalTP || data.tp < minTP)) finalTP = minTP;
    if (data.bias === 'SELL' && (!finalTP || data.tp > minTP)) finalTP = minTP;

    // Actual RR ratio
    const actualRR = risk > 0 ? (Math.abs(finalTP - data.entry) / risk) : (data.rrRatio || 2);
    const displayRR = actualRR.toFixed(1);

    update('entVal',  data.entry       ? data.entry.toFixed(2)    : "--");
    update('slVal',   data.sl          ? data.sl.toFixed(2)        : "--");
    update('tpVal',   finalTP          ? finalTP.toFixed(2)        : "--");
    update('curVal',  data.currentPrice ? data.currentPrice.toFixed(2) : "--");

    // ─── CONFIDENCE METER ─────────────────────────────────────────────────────
    const confEl = ui('confVal');
    if (confEl) {
        const c = data.confidence || 0;
        confEl.innerText = `${c}/10`;
        confEl.className = `text-2xl font-bold font-mono ${
            c >= 8 ? 'text-emerald-400' :
            c >= 6 ? 'text-yellow-400'  : 'text-rose-500'
        }`;
    }

    // ─── LOGIC BOX ────────────────────────────────────────────────────────────
    const logicBox = ui('logicSummary');
    if (logicBox) {
        const dxyTag   = data.dxyAlignment ? '✓ DXY OK'    : '✗ DXY OFF';
        const dxyCls   = data.dxyAlignment ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400';
        const trig     = data.trigger       || 'NO TRIGGER';
        const strategy = data.dominantStrategy || 'MULTI';
        const conf     = data.confluences !== undefined ? `${data.confluences}/8 CONFLUENCE` : '';

        // RR badge colour: green ≥ 1:4, yellow ≥ 1:2, red < 1:2
        const rrCls = actualRR >= 4 ? 'bg-emerald-500/20 text-emerald-400'
                    : actualRR >= 2 ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-rose-500/20 text-rose-400';

        logicBox.innerHTML = `
            <div class="flex gap-2 flex-wrap mb-3">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400">${strategy}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${dxyCls}">${dxyTag}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-white">${trig}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${rrCls}">RR 1:${displayRR}</span>
                ${conf ? `<span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-400">${conf}</span>` : ''}
            </div>
            <p class="text-[13px] text-white/80 leading-relaxed font-normal">${data.logic || 'No signal logic returned.'}</p>
        `;
    }

    // ─── POSITION SIZING ──────────────────────────────────────────────────────
    const bal     = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk'))    || 0;
    if (bal && riskPct && data.entry && data.sl) {
        const riskAmt = bal * (riskPct / 100);
        const pDiff   = Math.abs(data.entry - data.sl);
        if (pDiff > 0) {
            let size = riskAmt / pDiff;
            if (data.assetType === "FOREX")     size /= 10;
            if (data.assetType === "COMMODITY") size /= 100;
            update('lotVal', size.toFixed(4));
        }
    } else {
        update('lotVal', "SET RISK");
    }
}

function toBase64(file) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}

function showAlert(msg) {
    const alertEl = document.getElementById('alertBanner');
    if (alertEl) {
        alertEl.innerText = msg;
        alertEl.classList.remove('hidden');
        setTimeout(() => alertEl.classList.add('hidden'), 6000);
    } else {
        alert(msg);
    }
}
