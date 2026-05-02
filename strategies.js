let API_KEY = localStorage.getItem('omni_api_v3') || "";
const MODEL = "gemini-2.0-flash"; 

window.onload = () => { if (API_KEY) lockUI(); };

function toggleDrawer() {
    const d = document.getElementById('sideDrawer');
    const o = document.getElementById('overlay');
    if (d && o) { d.classList.toggle('open'); o.classList.toggle('hidden'); }
}

function markFile(idx) {
    const box = document.getElementById(`box${idx}`);
    if (document.getElementById(`img${idx}`).files.length > 0) {
        box.classList.add('has-file');
        const icon = document.getElementById(`icon${idx}`);
        const label = document.getElementById(`label${idx}`);
        if(icon) icon.classList.remove('hidden');
        if(label) label.classList.add('hidden');
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

async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 1000 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve({ inlineData: { mimeType: "image/jpeg", data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1] } });
            };
        };
    });
}

async function executeScan() {
    if (!API_KEY) return alert("Enter API Key.");
    const btn = document.getElementById('scanBtn');
    const files = [0,1,2,3].map(i => document.getElementById(`img${i}`).files[0]);
    if (files.some(f => !f)) return alert("Upload all charts.");

    btn.innerText = "SCORING STRATEGIES...";
    btn.disabled = true;

    try {
        const imageParts = await Promise.all(files.map(processImage));
        const prompt = `Senior Quant: Eval 4 strategies (SMC, Supply/Demand, Trend, Breakout). 
        Score 0-10. If score < 4, bias must be WAIT.
        JSON: {"strategy":"name","bias":"BUY|SELL|WAIT","entry":num,"sl":num,"tp":num,"score":num,"logic":"short text"}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }] })
        });

        const data = await response.json();
        const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());

        renderResults(res);
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.innerText = "Perform Multi-Chart Scan";
        btn.disabled = false;
    }
}

function renderResults(res) {
    const resultBox = document.getElementById('resultBox');
    const actionTxt = document.getElementById('actionText');
    const scoreBar = document.getElementById('scoreBar');

    if (res.bias === 'WAIT' || res.score < 4) {
        actionTxt.innerText = "WAIT";
        actionTxt.className = "text-5xl font-extrabold italic mb-10 text-slate-500 uppercase";
        ['entText', 'slText', 'tpText', 'lotText'].forEach(id => document.getElementById(id).innerText = "---");
    } else {
        actionTxt.innerText = res.bias;
        actionTxt.className = `text-5xl font-extrabold italic mb-10 glow-text uppercase ${res.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
        document.getElementById('entText').innerText = res.entry.toFixed(2);
        document.getElementById('slText').innerText = res.sl.toFixed(2);
        document.getElementById('tpText').innerText = res.tp.toFixed(2);

        const bal = parseFloat(document.getElementById('bal').value) || 10000;
        const risk = parseFloat(document.getElementById('risk').value) || 1;
        const inst = document.getElementById('instrument').value;

        let pipMult = (inst === 'GOLD') ? 100 : (inst === 'BTC' ? 1 : 10);
        const lots = (bal * (risk / 100)) / (Math.abs(res.entry - res.sl) * pipMult);
        document.getElementById('lotText').innerText = lots.toFixed(2);
    }

    document.getElementById('strategyText').innerText = res.strategy;
    document.getElementById('logicText').innerText = res.logic;
    if (scoreBar) scoreBar.style.width = (res.score * 10) + "%";
    
    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth' });
}
