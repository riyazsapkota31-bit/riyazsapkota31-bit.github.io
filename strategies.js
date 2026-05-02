/** * OMNI-REAL | INFINITY SCALPER V8.2
 * VERSION-PINNED CALIBRATION 
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";

// 1. CHANGE: Use a hard-coded version instead of an alias to stop the "Not Found" error
const MODEL = "gemini-1.5-flash-001"; 

let marketData = [null, null, null, null]; 

// ... (markFile and fileToPart stay the same to prevent "Data Gaps")

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    const btn = document.getElementById('scanBtn');
    
    if (marketData.some(f => f === null)) {
        return alert("Data Gap: Upload all 4 Market Tiers."); 
    }

    btn.innerText = "SYNCHRONIZING...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(marketData.map(fileToPart));
        
        const prompt = `Act as an SMC Analyst. Analyze charts for confluence. Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"support":number,"resistance":number,"logic":"string"}`;

        // 2. CHANGE: Using /v1/ instead of /v1beta/ for maximum stability
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, ...imageParts] }]
            })
        });

        // 3. CHANGE: Enhanced Error Catching
        if (!response.ok) {
            const errorBody = await response.json();
            // If the model name was still the issue, it would say so here.
            throw new Error(errorBody.error?.message || "Connection Refused");
        }

        const data = await response.json();
        const rawResponse = data.candidates[0].content.parts[0].text;
        const res = JSON.parse(rawResponse.replace(/```json/g, '').replace(/```/g, '').trim());

        renderOutput(res, document.getElementById('resultBox'));

    } catch (e) {
        // This will now tell us if the error shifted from "Model Not Found" to something else
        alert("TERMINAL ERROR: " + e.message); 
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
