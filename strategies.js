// --- OMNI-REAL HYBRID STRATEGY ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "RUNNING MULTI-STRATEGY AGGREGATOR...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // DYNAMIC MULTI-STRATEGY PROMPT
        const prompt = `System: Master Quant Analyst. 
        Analyze the 4 provided charts using ALL relevant concepts: 
        - SMC (Order Blocks, FVG, Liquidity Sweeps)
        - Classic Price Action (Trendlines, Support/Resistance, Chart Patterns)
        - Volume Profile (High Volume Nodes, Point of Control)
        - Harmonics (Gartley, Bat, Butterfly patterns if visible)
        - Elliot Wave (Cycle stages)

        TASK: 
        1. Identify the MOST suitable strategy for the current market condition. 
        2. If market is sideways, return "WAIT" with a specific Breakout Point.
        3. If a trend or reversal is confirmed, provide the trade setup.
        Return ONLY JSON: {"strategy":"NAME_OF_CHOSEN_STRATEGY","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"Detailed explanation of why this strategy was chosen over others","breakoutPoint":number}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim());

        // --- DYNAMIC UI UPDATE ---
        if (res.bias === "WAIT") {
            document.getElementById('actionText').innerText = "NO TRADE";
            document.getElementById('actionText').className = "text-5xl font-extrabold italic mb-10 text-slate-500 glow-text";
            document.getElementById('entText').innerText = res.breakoutPoint ? `WATCH ${res.breakoutPoint.toFixed(2)}` : "---";
            ['slText','tpText','lotText'].forEach(id => document.getElementById(id).innerText = "---");
            document.getElementById('strategyType').innerText = "FILTER: CONSOLIDATION";
        } else {
            const slDist = Math.abs(res.entry - res.sl);
            const bal = parseFloat(document.getElementById('bal').value) || 10000;
            const riskVal = bal * (parseFloat(document.getElementById('risk').value) / 100);
            
            let tpVal = res.tp;
            if (Math.abs(res.entry - tpVal) / slDist < 1.5) {
                tpVal = res.bias === 'BUY' ? res.entry + (slDist * 1.5) : res.entry - (slDist * 1.5);
            }
            const lotSize = slDist > 0 ? (riskVal / (slDist * 10)).toFixed(2) : "0.10";

            document.getElementById('strategyType').innerText = res.strategy;
            document.getElementById('actionText').innerText = res.bias;
            document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
            document.getElementById('entText').innerText = res.entry.toFixed(5);
            document.getElementById('slText').innerText = res.sl.toFixed(5);
            document.getElementById('tpText').innerText = tpVal.toFixed(5);
            document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        }

        document.getElementById('logicText').innerText = res.logic;
        document.getElementById('supText').innerText = res.support ? res.support.toFixed(2) : "---";
        document.getElementById('resText').innerText = res.resistance ? res.resistance.toFixed(2) : "---";
        
        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("TERMINAL ERROR: Ensure your charts are clear and API key is active.");
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
