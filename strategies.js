let API_KEY = localStorage.getItem('omni_api_v3') || "";
// UPDATED: Using the active model name to prevent 404 errors
const MODEL = "gemini-2.5-flash"; 

window.onload = () => { if (API_KEY) lockUI(); };

function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    if (d && o) { d.classList.toggle('open'); o.classList.toggle('hidden'); }
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    const icon = document.getElementById(`icon${idx}`);
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

// --- IMAGE OPTIMIZER: Fixes the Timeout problem ---
async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Downscale to 700px to ensure the connection doesn't time out
                const scale = 700 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                resolve({ inlineData: { mimeType: "image/jpeg", data: dataUrl.split(',')[1] } });
            };
        };
    });
}

async function executeScan() {
    if (!API_KEY) return alert("Enter API Key in Settings.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    
    if (files.some(f => !f)) return alert("Upload all 4 charts.");

    btn.innerText = "ANALYZING MARKET DATA...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        
        const prompt = `Act as an expert Quant Analyst. Analyze these 4 charts (HTF, LTF, Entry, DXY). 
        Determine bias (BUY, SELL, or WAIT) using SMC and Price Action.
        Return ONLY valid JSON: {"strategy":"string","bias":"BUY|SELL|WAIT","entry":number,"sl":number,"tp":number,"logic":"string"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(cleanJson);

        // Update UI
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-5xl font-extrabold italic mb-10 glow-text ${res.bias === 'BUY' ? 'text-emerald-400' : (res.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500')}`;
        document.getElementById('entText').innerText = res.entry || "---";
        document.getElementById('slText').innerText = res.sl || "---";
        document.getElementById('tpText').innerText = res.tp || "---";
        document.getElementById('logicText').innerText = res.logic;

        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        alert("TERMINAL ERROR: " + e.message);
        console.error(e);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}
