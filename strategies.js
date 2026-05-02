/**
 * OMNI-REAL | PRECISION V11 (CORE ENGINE REPAIR)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";

// STABLE ENGINE: This specific ID is required to bypass the "Model Not Found" error
const MODEL = "gemini-1.5-flash-8b"; 

// --- TRADING ENGINE ---
async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    
    // Ensure all 4 charts are actually loaded
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        
        // Use the v1beta endpoint with the corrected model ID
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ 
                    role: "user", 
                    parts: [
                        { text: "Analyze these 4 trading charts for SMC/ICT alignment. Return ONLY JSON: {'bias':'BUY|SELL|WAIT','entry':number,'sl':number,'tp':number,'logic':'string'}" }, 
                        ...imageParts
                    ] 
                }] 
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message); 
        }

        const data = await response.json();
        // Extract and parse the JSON response
        const resText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(resText);

        renderOutput(res, resultBox);

    } catch (e) {
        console.error(e);
        alert(`TERMINAL ERROR: ${e.message}`);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
