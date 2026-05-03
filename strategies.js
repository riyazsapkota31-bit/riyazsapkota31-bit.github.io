/**
 * OMNI-BLACK | VERSION 57.0 — FINAL
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ✓ Two-pass: chart READ → signal GENERATE (no hallucination)
 * ✓ Asset auto-detected from chart (CRYPTO / FOREX / COMMODITY)
 * ✓ All 8 strategies evaluated, best one selected per chart
 * ✓ TRUE scalp SL/TP — hard point limits enforced in JS, Gemini cannot override
 * ✓ BUY: SL below entry, TP above entry
 * ✓ SELL: SL above entry, TP below entry  ← correctly enforced
 * ✓ Dynamic RR: 1:2 minimum, structure-driven ceiling (1:8+)
 * ✓ Lot size calculated from asset type detected in chart
 * ✓ Spread compensation per asset type
 * ✓ Fires on 3+ confluences (high frequency)
 * ✓ WATCHING only on real conflict or failed safety checks
 * ✓ Logic output: plain English, 1-2 sentences, zero jargon
 * ✓ No errors on original HTML (all element updates null-checked)
 */

let files = [null, null, null, null];

// ── ASSET SPECIFICATIONS ──────────────────────────────────────────────────────
// These define scalp limits and lot calculation per asset type.
// Spread is added to entry/SL/TP to reflect real broker conditions.
const ASSET_SPECS = {
    CRYPTO: {
        maxSL:          120,    // max points SL from entry
        maxTP:          350,    // max points TP from entry
        spreadPoints:   50,     // typical BTC spread in points
        lotDivisor:     1,      // no divisor for crypto
        pipValue:       1       // 1 point = $1 per 0.001 BTC lot
    },
    FOREX: {
        maxSL:          0.0008, // 8 pips max
        maxTP:          0.0020, // 20 pips max
        spreadPoints:   0.0001, // 1 pip spread
        lotDivisor:     10,     // standard lot divisor
        pipValue:       10      // $10 per pip per standard lot
    },
    COMMODITY: {
        maxSL:          80,     // 80 points max (Gold ~$0.80)
        maxTP:          250,    // 250 points max
        spreadPoints:   30,     // typical Gold spread
        lotDivisor:     100,
        pipValue:       1
    }
};

// ── MAIN EXECUTION ────────────────────────────────────────────────────────────
async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');

    if (files.filter(f => f).length < 2) {
        showAlert("UPLOAD ERROR: Minimum 2 charts required (15M + 1M).");
        return;
    }

    setButtonState(btn, true, "SCANNING MARKET...");

    try {
        const apiKey = localStorage.getItem('omni_api_key');
        if (!apiKey) throw new Error("No API Key. Open Settings and enter your Gemini key.");

        const b64Images = await Promise.all(
            files.map(file => file ? toBase64(file) : Promise.resolve(null))
        );

        const signal = await fetchGeminiAnalysis(apiKey, b64Images);
        renderOutput(signal);

        if (out) {
            out.classList.remove('hidden');
            setTimeout(() => out.scrollIntoView({ behavior: 'smooth' }), 100);
        }

    } catch (err) {
        console.error("OMNI-BLACK Error:", err);
        showAlert("ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "EXECUTE COMMAND");
    }
}

function setButtonState(btn, disabled, text) {
    if (!btn) return;
    btn.disabled    = disabled;
    btn.innerText   = text;
    btn.style.opacity = disabled ? '0.6' : '1';
}

// ── TWO-PASS GEMINI ANALYSIS ──────────────────────────────────────────────────
async function fetchGeminiAnalysis(key, images) {
    const model = "gemini-2.5-flash";
    const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const inlineData = images
        .filter(Boolean)
        .map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // ════════════════════════════════════════════════════════════════════════
    // PASS 1 — PURE CHART READING  (images sent here only)
    // No signal. No interpretation. Just facts extracted from the screenshots.
    // ════════════════════════════════════════════════════════════════════════
    const pass1Prompt = `
You are a precise financial chart reader. Your ONLY task is to read these TradingView screenshots and extract raw data. Do NOT give any trade signal or recommendation yet.

Read every chart carefully and answer these questions:

━━━ ASSET IDENTIFICATION ━━━
A1. What is the exact asset ticker shown in the top-left of the chart? (e.g. BTCUSD, EURUSD, XAUUSD, USDX)
A2. Based on the asset ticker, what type is it?
    - CRYPTO: BTC, ETH, BNB, SOL and all other crypto pairs
    - FOREX: EUR, GBP, JPY, AUD, NZD, CAD, CHF pairs (e.g. EURUSD, GBPUSD)
    - COMMODITY: XAUUSD (Gold), XAGUSD (Silver), Oil, etc.
A3. What timeframes are shown across the uploaded charts? (e.g. 1m, 15, 1H, etc.)

━━━ CURRENT PRICE (CRITICAL) ━━━
A4. On EACH chart, look at the RIGHT EDGE of the Y-axis. There is a highlighted/white box with the live price.
    Copy every digit of that number EXACTLY. Do not round. Do not guess. Just copy.
    Use the price from the most recent/lowest timeframe chart as the primary currentPrice.

━━━ 1H CHART READING ━━━
A5. Is the 1H trend: BULLISH (higher highs + higher lows) / BEARISH (lower highs + lower lows) / RANGING?
A6. Most recent 1H swing high price?
A7. Most recent 1H swing low price?

━━━ 15M CHART READING ━━━
A8. Is the 15M market structure: BULLISH / BEARISH / RANGING?
A9. Is there an unfilled Fair Value Gap (FVG) — 3 candles where middle candle left a visible gap?
    If yes: fvgTop price and fvgBottom price. If no: null.
A10. Is there an Order Block (OB) near current price?
     - Demand OB (for buys): last bearish candle before a strong bullish move
     - Supply OB (for sells): last bullish candle before a strong bearish move
     If yes: obLevel price. If no: null.
A11. Nearest 15M swing high price?
A12. Nearest 15M swing low price?

━━━ 1M CHART READING ━━━
A13. Is there a displacement candle on 1M right now? (a candle significantly larger than its neighbors)
     If yes: direction UP or DOWN. If no: null.
A14. Is there a Break of Structure (BOS) on 1M? (price broke above a recent high or below a recent low)
     If yes: direction UP or DOWN. If no: null.
A15. Has price swept a liquidity level on 1M? (briefly broke equal highs/lows then reversed)
     true or false.
A16. Nearest 1M micro swing HIGH price?
A17. Nearest 1M micro swing LOW price?

━━━ DXY CHART READING ━━━
A18. Is DXY trending: BULLISH / BEARISH / RANGING?
A19. Has DXY recently made a sharp move or broken a key level? true or false.

Return ONLY this JSON. Use null for anything not visible. No extra text:
{
  "assetName": string,
  "assetType": "CRYPTO" | "FOREX" | "COMMODITY",
  "currentPrice": number,
  "chartReadings": {
    "1H":  { "trend": "BULLISH"|"BEARISH"|"RANGING", "swingHigh": number, "swingLow": number },
    "15M": { "structure": "BULLISH"|"BEARISH"|"RANGING", "fvgTop": number|null, "fvgBottom": number|null, "obLevel": number|null, "swingHigh": number, "swingLow": number },
    "1M":  { "displacement": "UP"|"DOWN"|null, "bos": "UP"|"DOWN"|null, "sweepDetected": boolean, "microSwingHigh": number, "microSwingLow": number },
    "DXY": { "trend": "BULLISH"|"BEARISH"|"RANGING", "recentBreak": boolean }
  }
}
`;

    const p1res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: pass1Prompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.05, top_p: 1 }
        })
    });

    if (!p1res.ok) {
        const e = await p1res.text();
        throw new Error(`Chart read failed (${p1res.status}): ${e.substring(0, 200)}`);
    }

    const p1data = await p1res.json();
    const p1raw  = p1data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!p1raw) throw new Error("Chart read returned empty. Check image quality.");

    let facts;
    try {
        facts = JSON.parse(p1raw);
    } catch {
        const m = p1raw.match(/\{[\s\S]*\}/);
        if (m) facts = JSON.parse(m[0]);
        else throw new Error("Could not read chart facts. Upload clearer screenshots.");
    }

    // Get asset specs for this asset type
    const specs   = ASSET_SPECS[facts.assetType] || ASSET_SPECS.CRYPTO;
    const cp      = facts.currentPrice;
    const maxSL   = specs.maxSL;
    const maxTP   = specs.maxTP;
    const spread  = specs.spreadPoints;

    // ════════════════════════════════════════════════════════════════════════
    // PASS 2 — STRATEGY + SIGNAL GENERATION  (no images, pure logic)
    // Works only from the verified facts above. Zero chart re-interpretation.
    // ════════════════════════════════════════════════════════════════════════
    const pass2Prompt = `
You are OMNI-BLACK — an elite institutional scalp trading engine.

You have these verified chart facts (extracted by a separate reader):
${JSON.stringify(facts, null, 2)}

Asset type: ${facts.assetType}
Current price: ${cp}
Max SL distance allowed: ${maxSL} ${facts.assetType === 'FOREX' ? 'price units (8 pips)' : 'points'}
Max TP distance allowed: ${maxTP} ${facts.assetType === 'FOREX' ? 'price units (20 pips)' : 'points'}
Spread: ${spread} ${facts.assetType === 'FOREX' ? 'price units' : 'points'} (must be added to entry for BUY, subtracted for SELL)

Generate a scalp trade signal using ONLY the facts above. No chart re-reading. Pure calculation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE A — DETERMINE BIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUY — all 3 must be true:
  ✓ 15M structure = BULLISH
  ✓ 1H trend = BULLISH or RANGING
  ✓ DXY trend = BEARISH or RANGING

SELL — all 3 must be true:
  ✓ 15M structure = BEARISH
  ✓ 1H trend = BEARISH or RANGING
  ✓ DXY trend = BULLISH or RANGING

WATCHING — use if any condition conflicts, or 15M = RANGING with no clear BOS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE B — EVALUATE ALL 8 STRATEGIES (count confluences)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check each. Mark ACTIVE if it agrees with the bias. Count total active = confluences.

1. SMC        → ACTIVE if: 15M has BOS/CHOCH AND obLevel exists within ${maxSL * 2} of currentPrice.
2. ICT        → ACTIVE if: fvgTop or fvgBottom is not null AND sweepDetected = true.
3. PA         → ACTIVE if: 1M displacement direction matches bias.
4. DXY_CORR  → ACTIVE if: DXY is opposite to bias (DXY BEARISH + BUY, or DXY BULLISH + SELL).
5. SR         → ACTIVE if: currentPrice within ${maxSL} of a known swing high (SELL) or swing low (BUY).
6. SD         → ACTIVE if: obLevel is not null AND within ${maxSL * 2} of currentPrice.
7. ELLIOTT    → ACTIVE if: 1H trend is clear (not RANGING) AND 15M structure matches 1H trend direction.
8. WYCKOFF    → ACTIVE if: sweepDetected = true AND 15M structure reversed after sweep direction.

Pick the ONE strategy with the most direct evidence as dominantStrategy.
If confluences < 3 → bias = WATCHING regardless of structure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE C — CALCULATE ENTRY, SL, TP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is SCALP TRADING. All distances are tight. Follow these rules exactly.

ENTRY:
  BUY:  entry = currentPrice + spread (account for spread on buy)
  SELL: entry = currentPrice (sell at current, spread works in your favour)
  If fvgBottom (BUY) or fvgTop (SELL) is within ${maxSL} of currentPrice → use that level instead.
  If obLevel is within ${maxSL} of currentPrice → use obLevel instead.
  Final entry must be within ${maxSL} of currentPrice. If not → entry = currentPrice.

STOP LOSS — SCALP HARD LIMITS:
  BUY:  sl = microSwingLow - ${Math.round(spread / 2)} buffer.
        sl must be BELOW entry. (Price going down = loss for BUY)
        If microSwingLow is null or more than ${maxSL} below entry → sl = entry - ${maxSL}.
        ABSOLUTE MAX: sl cannot be more than ${maxSL} below entry.

  SELL: sl = microSwingHigh + ${Math.round(spread / 2)} buffer.
        sl must be ABOVE entry. (Price going up = loss for SELL)
        If microSwingHigh is null or more than ${maxSL} above entry → sl = entry + ${maxSL}.
        ABSOLUTE MAX: sl cannot be more than ${maxSL} above entry.

TAKE PROFIT — SCALP HARD LIMITS:
  TP must be a REACHABLE scalp target, not a swing trade target.
  ABSOLUTE MAX TP distance from entry: ${maxTP}.

  BUY TP — pick the nearest valid level ABOVE entry (in this priority):
    1. Nearest equal highs on 1M (liquidity)
    2. fvgTop if above entry and within ${maxTP}
    3. 15M swingHigh if within ${maxTP}
    4. Fallback: entry + (risk × 3) where risk = entry - sl
    TP must be ABOVE entry. If calculated TP > entry + ${maxTP} → cap at entry + ${maxTP}.

  SELL TP — pick the nearest valid level BELOW entry (in this priority):
    1. Nearest equal lows on 1M (liquidity)
    2. fvgBottom if below entry and within ${maxTP}
    3. 15M swingLow if within ${maxTP}
    4. Fallback: entry - (risk × 3) where risk = sl - entry
    TP must be BELOW entry. If calculated TP < entry - ${maxTP} → cap at entry - ${maxTP}.

VERIFY DIRECTIONS (MANDATORY CHECK):
  BUY:  sl < entry < tp  (sl is lowest, tp is highest) 
  SELL: tp < entry < sl  (tp is lowest, sl is highest)
  If this check fails → set bias = WATCHING.

CALCULATE RR:
  risk    = |entry - sl|
  rrRatio = |tp - entry| / risk
  If rrRatio < 2.0 → push TP further (still within max limit) until rrRatio = 2.0.
  If even at max TP limit rrRatio < 2.0 → bias = WATCHING (SL too wide).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE D — CONFIDENCE SCORE (1–10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Start at 0.
+1 for each active strategy (max 8)
+1 if 1M BOS matches bias direction
+1 if DXY recentBreak = true and confirms bias
-2 if 1H and 15M structure conflict
Cap at 10.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE E — PLAIN ENGLISH LOGIC (for the trader to read)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write 1-2 sentences like a text message to a friend.
Simple words. Tell them: what price is doing, where entry is, why it looks good.
Good: "Price dipped into a support zone and bounced. Buying here with target at the recent high."
Good: "Trend is down and price just pulled back up into a resistance area. Selling the retest."
Bad:  "15M BEARISH BOS CONFIRMED. SELLING INTO FVG PREMIUM ZONE FOR CONTINUATION."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — Return ONLY valid JSON. No markdown. Nothing outside the JSON.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "assetName":        string,
  "assetType":        "CRYPTO" | "FOREX" | "COMMODITY",
  "currentPrice":     number,
  "bias":             "BUY" | "SELL" | "WATCHING",
  "entry":            number,
  "sl":               number,
  "tp":               number,
  "rrRatio":          number,
  "structure":        "BEARISH" | "BULLISH" | "RANGING",
  "dxyAlignment":     boolean,
  "dominantStrategy": "SMC" | "ICT" | "PA" | "DXY_CORRELATION" | "SR" | "SD" | "ELLIOTT" | "WYCKOFF",
  "trigger":          "FVG_RETEST" | "OB_RETEST" | "DISPLACEMENT" | "SWEEP_RETEST" | "SR_BOUNCE" | "SD_ZONE" | "WAVE_PULLBACK" | "WYCKOFF_SPRING" | "WYCKOFF_UTAD" | "NONE",
  "confluences":      integer,
  "confidence":       integer,
  "logic":            string
}
`;

    const p2res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: pass2Prompt }] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1, top_p: 0.95 }
        })
    });

    if (!p2res.ok) {
        const e = await p2res.text();
        throw new Error(`Signal generation failed (${p2res.status}): ${e.substring(0, 200)}`);
    }

    const p2data = await p2res.json();
    const p2raw  = p2data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!p2raw) throw new Error("Signal generation returned empty. Try again.");

    let signal;
    try {
        signal = JSON.parse(p2raw);
    } catch {
        const m = p2raw.match(/\{[\s\S]*\}/);
        if (m) signal = JSON.parse(m[0]);
        else throw new Error("Could not parse signal. Try re-uploading charts.");
    }

    // ════════════════════════════════════════════════════════════════════════
    // JS HARD ENFORCEMENT — Gemini cannot override these. Ever.
    // This is the final safety gate before numbers reach the screen.
    // ════════════════════════════════════════════════════════════════════════

    const aType = signal.assetType || facts.assetType || 'CRYPTO';
    const sp    = ASSET_SPECS[aType] || ASSET_SPECS.CRYPTO;
    const mxSL  = sp.maxSL;
    const mxTP  = sp.maxTP;

    if (signal.bias === 'BUY') {
        // BUY: sl must be BELOW entry, tp must be ABOVE entry
        if (signal.sl >= signal.entry)          signal.sl = signal.entry - mxSL;
        if (signal.tp <= signal.entry)          signal.tp = signal.entry + (mxSL * 2);
        if (signal.entry - signal.sl > mxSL)    signal.sl = signal.entry - mxSL;
        if (signal.tp - signal.entry > mxTP)    signal.tp = signal.entry + mxTP;
    }

    if (signal.bias === 'SELL') {
        // SELL: sl must be ABOVE entry, tp must be BELOW entry
        if (signal.sl <= signal.entry)          signal.sl = signal.entry + mxSL;
        if (signal.tp >= signal.entry)          signal.tp = signal.entry - (mxSL * 2);
        if (signal.sl - signal.entry > mxSL)    signal.sl = signal.entry + mxSL;
        if (signal.entry - signal.tp > mxTP)    signal.tp = signal.entry - mxTP;
    }

    // Recalculate risk and RR after corrections
    const risk = Math.abs(signal.entry - signal.sl);
    const rr   = risk > 0 ? Math.abs(signal.tp - signal.entry) / risk : 0;

    // Enforce minimum 1:2 RR — push TP further if needed
    if (signal.bias === 'BUY'  && rr < 2) signal.tp = Math.min(signal.entry + (risk * 2), signal.entry + mxTP);
    if (signal.bias === 'SELL' && rr < 2) signal.tp = Math.max(signal.entry - (risk * 2), signal.entry - mxTP);

    // Final RR recalculate
    signal.rrRatio = risk > 0
        ? parseFloat((Math.abs(signal.tp - signal.entry) / risk).toFixed(2))
        : 2;

    // Kill signal if it still fails after all corrections
    const finalRR = signal.rrRatio;
    if (
        signal.confluences < 3                                             ||
        finalRR < 2                                                        ||
        (signal.bias === 'BUY'  && (signal.sl >= signal.entry || signal.tp <= signal.entry)) ||
        (signal.bias === 'SELL' && (signal.sl <= signal.entry || signal.tp >= signal.entry)) ||
        (signal.currentPrice && Math.abs(signal.entry - signal.currentPrice) / signal.currentPrice > 0.005)
    ) {
        signal.bias       = 'WATCHING';
        signal.logic      = 'No clean scalp setup right now. Wait for a clearer entry.';
        signal.confidence = Math.min(signal.confidence || 3, 3);
    }

    // Carry over facts for lot sizing
    signal.assetType    = aType;
    signal.currentPrice = signal.currentPrice || facts.currentPrice;

    return signal;
}

// ── RENDER OUTPUT ─────────────────────────────────────────────────────────────
function renderOutput(data) {
    const ui     = (id)       => document.getElementById(id);
    const update = (id, val)  => { if (ui(id)) ui(id).innerText = val; };

    // Bias
    const bEl = ui('biasTxt');
    if (bEl) {
        bEl.innerText   = data.bias;
        bEl.className   = `text-8xl font-black italic tracking-tighter ${
            data.bias === 'BUY'  ? 'text-emerald-400' :
            data.bias === 'SELL' ? 'text-rose-500'    : 'text-slate-500'
        }`;
    }

    // Prices
    const risk     = Math.abs(data.entry - data.sl);
    const actualRR = risk > 0 ? Math.abs(data.tp - data.entry) / risk : (data.rrRatio || 2);

    update('entVal', data.entry        ? data.entry.toFixed(2)        : '--');
    update('slVal',  data.sl           ? data.sl.toFixed(2)           : '--');
    update('tpVal',  data.tp           ? data.tp.toFixed(2)           : '--');
    update('curVal', data.currentPrice ? data.currentPrice.toFixed(2) : '--');

    // Confidence
    const confEl = ui('confVal');
    if (confEl) {
        const c         = data.confidence || 0;
        confEl.innerText  = `${c}/10`;
        confEl.className  = `text-2xl font-bold font-mono ${
            c >= 8 ? 'text-emerald-400' :
            c >= 6 ? 'text-yellow-400'  : 'text-rose-500'
        }`;
    }

    // Logic box with tags
    const logicBox = ui('logicSummary');
    if (logicBox) {
        const dxyOk  = data.dxyAlignment;
        const rrCls  = actualRR >= 4 ? 'bg-emerald-500/20 text-emerald-400'
                     : actualRR >= 2 ? 'bg-yellow-500/20 text-yellow-400'
                     :                 'bg-rose-500/20 text-rose-400';
        const confTag = data.confluences !== undefined
            ? `<span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-400">${data.confluences}/8 CONF</span>`
            : '';

        logicBox.innerHTML = `
            <div class="flex gap-2 flex-wrap mb-3">
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400">${data.dominantStrategy || 'MULTI'}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${dxyOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">${dxyOk ? '✓ DXY OK' : '✗ DXY OFF'}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/10 text-white">${data.trigger || 'NO TRIGGER'}</span>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${rrCls}">RR 1:${actualRR.toFixed(1)}</span>
                ${confTag}
            </div>
            <p class="text-[13px] text-white/80 leading-relaxed font-normal">${data.logic || 'No signal logic returned.'}</p>
        `;
    }

    // Lot size — uses asset type detected from chart
    const bal     = parseFloat(localStorage.getItem('omni_balance')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_risk'))    || 0;

    if (bal && riskPct && data.entry && data.sl && risk > 0) {
        const riskAmt = bal * (riskPct / 100);
        const sp      = ASSET_SPECS[data.assetType] || ASSET_SPECS.CRYPTO;
        let   size    = riskAmt / risk;
        size /= sp.lotDivisor;
        update('lotVal', size.toFixed(4));
    } else {
        update('lotVal', bal ? 'SET RISK' : 'SET BAL');
    }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function toBase64(file) {
    return new Promise(res => {
        const r = new FileReader();
        r.readAsDataURL(file);
        r.onload = () => res(r.result);
    });
}

function showAlert(msg) {
    const el = document.getElementById('alertBanner');
    if (el) {
        el.innerText = msg;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 6000);
    } else {
        alert(msg);
    }
}
