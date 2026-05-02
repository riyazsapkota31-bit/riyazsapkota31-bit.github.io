// ============================================================
//  OMNI-REAL | INFINITY SCALPER V8.2 — strategies.js
//  Upgraded: Multi-Strategy Engine | Same UI Format
// ============================================================

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash";

window.onload = () => { if (API_KEY) lockUI(); };

// ─── UI HELPERS (unchanged from original) ────────────────────

function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    if (d && o) { d.classList.toggle('open'); o.classList.toggle('hidden'); }
}

function markFile(idx) {
    const box   = document.getElementById(`box${idx}`);
    const icon  = document.getElementById(`icon${idx}`);
    const label = document.getElementById(`label${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        label.classList.add('hidden');
        icon.classList.remove('hidden');
    }
}

function lockUI() {
    const input = document.getElementById('apiInput');
    input.value = "••••••••••••••••••••";
    input.disabled = true;
    document.getElementById('lockBtn').classList.add('hidden');
    document.getElementById('editBtn').classList.remove('hidden');
}

function enableEdit() {
    const input = document.getElementById('apiInput');
    input.value = ""; input.disabled = false;
    document.getElementById('lockBtn').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}

function saveApiKey() {
    const val = document.getElementById('apiInput').value.trim();
    if (!val) return alert("Enter key.");
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val; lockUI(); toggleDrawer();
}

// ─── IMAGE OPTIMIZER (unchanged from original) ────────────────

async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale  = 800 / Math.max(img.width, img.height);
                canvas.width  = img.width  * scale;
                canvas.height = img.height * scale;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                resolve({ inlineData: { mimeType: "image/jpeg", data: dataUrl.split(',')[1] } });
            };
        };
    });
}

// ─── UPGRADED: MULTI-STRATEGY PROMPT ─────────────────────────

function buildPrompt() {
    return `You are an elite institutional Quant Analyst.
Analyze the 4 uploaded charts: Chart 1 = 1H (HTF Bias), Chart 2 = 15M (Structure), Chart 3 = 1M (Entry), Chart 4 = DXY 1M (Correlation).

Internally evaluate all 4 strategies below, score each, then return ONLY the best one:

STRATEGY 1 - SMC: Look for CHoCH, BOS, FVG, Order Blocks. Entry on FVG or OB retest after structure confirmation.
STRATEGY 2 - Supply & Demand: Find fresh untested S&D zones on 1H. Enter on 15M reaction candle at zone edge.
STRATEGY 3 - Trend Continuation: 1H must show clear HH/HL or LH/LL. Enter on 15M pullback resuming HTF trend.
STRATEGY 4 - Breakout & Retest: 15M consolidation breakout with 1M retest confirmation candle.

INTERNAL SCORING (do not show in output):
+2 all 3 timeframes confirm same direction
+2 DXY confirms (inverse for BUY, same for SELL)
+1 entry at clean S/R level
+1 RR is 1:2 or better
+1 no recent spike candles (not chasing)
+1 15M momentum confirms direction
-2 DXY strongly contradicts
-2 price just spiked hard
-1 1H is ranging or unclear
-1 strategy only partially valid

If best score is below 4, return bias WAIT.

Return ONLY this exact JSON format, no markdown, no extra text:
{"strategy":"strategy name","bias":"BUY or SELL or WAIT","entry":number,"sl":number,"tp":number,"score":number,"logic":"3 sentences max: what triggered it, why entry is valid now, what invalidates it."}`;
}

// ─── UPGRADED: LOT SIZE CALC ──────────────────────────────────
// Detects instrument from chart labels automatically

function calcLotSize(entry, sl, balance, riskPercent) {
    const pipsAtRisk = Math.abs(entry - sl);
    if (pipsAtRisk === 0) return 0;
    const riskAmount = balance * (riskPercent / 100);

    // Auto-detect instrument by price range
    let pipValue;
    if (entry > 50000)      pipValue = 1;    // BTC range
    else if (entry > 1000)  pipValue = 100;  // GOLD range
    else if (entry > 100)   pipValue = 1;    // US30/indices
    else                    pipValue = 10;   // FOREX pairs

    return riskAmount / (pipsAtRisk * pipValue);
}

// ─── UPGRADED: R:R CALCULATOR ────────────────────────────────

function calcRR(entry, sl, tp) {
    const risk   = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return "N/A";
    return `1:${(reward / risk).toFixed(1)}`;
}

// ─── MAIN SCAN FUNCTION ───────────────────────────────────────

async function executeScan() {
    if (!API_KEY) return alert("Enter API Key in Settings.");

    const btn       = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files     = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);

    if (files.some(f => !f)) return alert("Please upload all 4 required charts.");

    const balance     = parseFloat(document.getElementById('bal').value)  || 10000;
    const riskPercent = parseFloat(document.getElementById('risk').value) || 1;

    btn.innerText = "AGGREGATING ALL STRATEGIES...";
    btn.disabled  = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role:  "user",
                        parts: [{ text: buildPrompt() }, ...imageParts]
                    }],
                    generationConfig: { temperature: 0.2 }
                })
            }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawText   = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const res       = JSON.parse(cleanJson);

        // ── Risk calculations ──
        const lot   = (res.bias !== 'WAIT') ? calcLotSize(res.entry, res.sl, balance, riskPercent) : 0;
        const rr    = (res.bias !== 'WAIT') ? calcRR(res.entry, res.sl, res.tp) : '—';
        const score = Math.min(Math.max(res.score || 0, 0), 10);

        // ── Update strategy label (minor change: shows strategy name + score) ──
        const stratLabel = document.getElementById('strategyType');
        if (stratLabel) {
            stratLabel.innerText = `${res.strategy || 'Quant Algorithm V8.2'}  ·  Score ${score}/10`;
        }

        // ── BUY/SELL/WAIT text (unchanged styling) ──
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${
            res.bias === 'BUY'  ? 'text-emerald-400' :
            res.bias === 'SELL' ? 'text-rose-500'    : 'text-slate-500'
        }`;

        // ── Entry / SL / TP / Lot (same fields, WAIT shows dashes) ──
        if (res.bias !== 'WAIT') {
            document.getElementById('entText').innerText = res.entry.toFixed(2);
            document.getElementById('slText').innerText  = res.sl.toFixed(2);
            document.getElementById('tpText').innerText  = res.tp.toFixed(2);
            document.getElementById('lotText').innerText = lot.toFixed(2);
        } else {
            document.getElementById('entText').innerText = '—';
            document.getElementById('slText').innerText  = '—';
            document.getElementById('tpText').innerText  = '—';
            document.getElementById('lotText').innerText = '—';
        }

        // ── Logic text (minor change: prepends R:R to logic) ──
        const logicDisplay = res.bias !== 'WAIT'
            ? `R:R ${rr}  ·  ${res.logic}`
            : `No valid setup found across all 4 strategies. Wait for better conditions.`;

        document.getElementById('logicText').innerText = logicDisplay;

        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        if (e.message.includes('JSON') || e.message.includes('parse')) {
            alert("Gemini returned unreadable format. Try scanning again.");
        } else if (e.message.includes('key') || e.message.includes('API_KEY')) {
            alert("Invalid API Key. Check your key in Settings.");
        } else if (e.message.includes('quota') || e.message.includes('limit')) {
            alert("API quota exceeded. Wait or upgrade your Gemini plan.");
        } else if (e.message.includes('timeout') || e.message.includes('network')) {
            alert("Connection timeout. Check your internet and retry.");
        } else {
            alert("TERMINAL ERROR: " + e.message);
        }
        console.error("Analysis Failed:", e);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled  = false;
    }
}
