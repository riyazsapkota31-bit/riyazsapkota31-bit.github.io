```javascript
/**
 * OMNI-TRADER ELITE | CORE ENGINE
 * Logic: Multi-Strategy Institutional Analysis (SMC/Wyckoff/ICT)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-preview-09-2025";

/**
 * Converts a File object to a Gemini-compatible Base64 part
 */
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ 
            inlineData: { 
                mimeType: "image/jpeg", 
                data: reader.result.split(',')[1] 
            } 
        });
    });
}

/**
 * Fetch wrapper with Exponential Backoff (Mandatory Requirement)
 * Retries on failure with delays: 1s, 2s, 4s, 8s, 16s
 */
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error?.message || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        if (retries <= 0) throw err;
        console.warn(`Retrying... attempts left: ${retries}`);
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
}

/**
 * Main Analysis Execution
 */
async function executeScan() {
    const btn = document.getElementById('scanBtn');
    
    // 1. Validation
    if (!API_KEY) return alert("Please set your Gemini API Key.");
    
    const files = [0, 1, 2, 3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Please upload all 4 required charts.");

    // 2. UI State Update
    btn.innerText = "EXTRACTING PIXEL DATA...";
    btn.disabled = true;

    try {
        // 3. Prepare Image Data
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // 4. Multi-Strategy Prompting
        const prompt = `Task: Professional Level Trade Execution Analysis.
Analyze 4 charts for a high-probability real trading setup. 
Logic:
1. Run SMC (Order Blocks/CHoCH), Wyckoff (Schematics), and ICT (FVG/Power of 3) strategies.
2. Select the strategy with the highest confluence.
3. Identify exact entry and stop loss based on wick pixel levels.
4. Output MUST be ONLY a JSON object. No conversational text.

JSON Schema: 
{
  "strategy": "SMC | WYCKOFF | ICT",
  "bias": "BUY | SELL",
  "entry": number,
  "sl": number,
  "support": number,
  "resistance": number,
  "logic": "brief professional reasoning"
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        
        // 5. API Request
        const data = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] 
            })
        });

        // 6. Data Sanitization & Parsing
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("No data returned from model.");
        
        // Strip Markdown and parse JSON
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(jsonStr);

        // 7. Real Sizing & Risk Management Logic
        const balance = parseFloat(document.getElementById('bal').value) || 10000;
        const riskPercent = parseFloat(document.getElementById('risk').value) || 1.0;
        const rewardRatio = parseFloat(document.getElementById('ratio').value) || 3.0;
        
        const riskAmount = balance * (riskPercent / 100);
        const pointDifference = Math.abs(res.entry - res.sl);
        
        /**
         * Lot Calculation Formula:
         * For Forex/Gold: Risk / (SL Distance in Pips * Value Per Pip)
         * This generalized logic provides a safe lot estimation.
         */
        const lotSize = pointDifference > 0 ? (riskAmount / (pointDifference * 10)).toFixed(2) : "0.01";
        
        const targetDistance = pointDifference * rewardRatio;
        const takeProfit = res.bias === 'BUY' ? (res.entry + targetDistance) : (res.entry - targetDistance);

        // 8. Final UI Output Dispatch
        const finalResults = { 
            ...res, 
            tp: takeProfit, 
            calculatedLots: Math.max(lotSize, 0.01) 
        };
        
        console.log("Analysis Complete:", finalResults);
        // (UI update function call would go here)

    } catch (e) {
        console.error("Engine Error:", e);
        alert("Technical Failure: " + e.message);
    } finally {
        btn.innerText = "Initiate Real-Time Analysis";
        btn.disabled = false;
    }
}

```
