let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.5-flash-preview-09-2025";

function saveApiKey() {
    const input = document.getElementById('apiInput');
    if (input.value.trim().length < 10) return alert("Enter valid Gemini Key.");
    localStorage.setItem('omni_api_v3', input.value.trim());
    API_KEY = input.value.trim();
    alert("Key Saved! Refreshing...");
    location.reload();
}

function markFile(idx) {
    document.getElementById(`box${idx}`).classList.add('has-file');
}

function toggleDrawer() { 
    document.getElementById('sideDrawer').classList.toggle('open'); 
    document.getElementById('overlay').classList.toggle('hidden'); 
}

function openSub(id) { document.getElementById(id).classList.add('active'); }
function closeSub(id) { document.getElementById(id).classList.remove('active'); }

async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ inlineData: { mimeType: "image/jpeg", data: reader.result.split(',')[1] } });
    });
}

async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        if (retries <= 0) throw err;
        await new Promise(r => setTimeout(r, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
}

async function executeScan() {
    if (!API_KEY) return alert("Please set your API Key in the sidebar.");
    const btn = document.getElementById('scanBtn');
    const resultBox = document.getElementById('resultBox');
    
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Please upload all 4 charts.");

    btn.innerText = "EXTRACTING PIXEL DATA...";
    btn.classList.add('scanning');
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(fileToPart));
        const prompt = "Analyze these 4 charts. Provide market bias and levels based on technical structure (SMC/ICT). Respond ONLY with JSON: {\"strategy\":\"string\",\"bias\":\"BUY/SELL\",\"entry\":number,\"sl\":number,\"support\":number,\"resistance\":number,\"logic\":\"string\"}";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
        
        const data = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const rawText = data.candidates[0].content.parts[0].text;
        const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const res = JSON.parse(jsonStr);

        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1.0;
        const riskAmt = bal * (risk / 100);
        const slDist = Math.abs(res.entry - res.sl);
        const lotSize = slDist > 0 ? (riskAmt / (slDist * 10)).toFixed(2) : "0.01";
        const tp = res.bias === 'BUY' ? (res.entry + (slDist * 3)) : (res.entry - (slDist * 3));

        document.getElementById('strategyType').innerText = `${res.strategy} ENGINE`;
        document.getElementById('actionText').innerText = res.bias;
        document.getElementById('actionText').className = `text-4xl font-black italic uppercase ${res.bias === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(5);
        document.getElementById('slText').innerText = res.sl.toFixed(5);
        document.getElementById('tpText').innerText = tp.toFixed(5);
        document.getElementById('supText').innerText = res.support.toFixed(5);
        document.getElementById('resText').innerText = res.resistance.toFixed(5);
        document.getElementById('lotText').innerText = Math.max(lotSize, 0.01);
        document.getElementById('logicText').innerText = res.logic;

        resultBox.classList.remove('hidden');

    } catch (e) {
        alert("CRITICAL ERROR: " + e.message);
    } finally {
        btn.innerText = "Initiate Real-Time Analysis";
        btn.classList.remove('scanning');
        btn.disabled = false;
    }
}
