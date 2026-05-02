/**
 * OMNI-REAL | PRECISION V11 (API & ENGINE RESTORE)
 */

let API_KEY = localStorage.getItem('omni_api_v3') || "";
// FIX: Using stable identifier for v1beta compatibility
const MODEL = "gemini-1.5-flash-latest"; 

window.onload = () => { if (API_KEY) lockUI(); };

// --- MASTER CONTROL (REPAIRED) ---

/**
 * Call this function from your "Edit" button or 
 * double-click the API input to unlock it.
 */
function enableEdit() {
    const input = document.getElementById('apiInput');
    input.value = ""; 
    input.disabled = false;
    input.classList.remove('opacity-40');
    input.focus();
}

function saveApiKey() {
    const input = document.getElementById('apiInput');
    const val = input.value.trim();
    
    // Safety check: prevents saving the dot mask
    if (!val || val.includes("•")) return alert("Please enter a valid Terminal Key.");
    
    localStorage.setItem('omni_api_v3', val);
    API_KEY = val;
    lockUI();
    toggleDrawer();
}

function lockUI() {
    const input = document.getElementById('apiInput');
    if (input) {
        input.value = "••••••••••••••••••••";
        input.disabled = true;
        input.classList.add('opacity-40');
    }
}

function toggleDrawer() {
    document.getElementById('sideDrawer').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('hidden');
}

// --- TRADING ENGINE (FIXED) ---

/** * REPAIR: Restoring missing fileToPart function 
 * to fix 'not defined' error
 */
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ 
            inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } 
        });
    });
}

async function executeScan() {
    if (!API_KEY) return alert("System Offline: Sync Terminal Key.");
    
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Data Gap: Upload all 4 Market Tiers.");

    btn.innerText = "CALIBRATING CONFLUENCE...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        const prompt = `System: SMC Analyst. Analyze 4 charts for structural alignment. 
        Return ONLY JSON: {"bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error.message); 
        }

        const data = await response.json();
        const rawJson = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(rawJson);

        renderOutput(res, resultBox);

    } catch (e) {
        console.error(e);
        alert(`TERMINAL ERROR: ${e.message}`);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

// --- UI DYNAMICS (SYNC TICK) ---
function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const fileInput = document.getElementById(`img${idx}`);
    
    if (fileInput && fileInput.files.length > 0) {
        box.classList.add('has-file');
        box.style.border = "2px solid #10b981";
        
        // Ref: 1000040692.jpg
        const content = box.querySelector('center') || box;
        content.innerHTML = `
            <div style="background:#10b981; width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 10px;">
                <span style="color:white; font-size:1.5rem;">✓</span>
            </div>
            <p style="color:#10b981; font-weight:bold; font-size:0.75rem;">CHART SYNCED</p>
        `;
    }
}
