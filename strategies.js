let API = localStorage.getItem('omni_v10_final') || "";
let data = [null, null, null, null];

if (API) document.getElementById('status').className = "w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]";

function save() {
    const v = document.getElementById('key').value.trim();
    if (v) { localStorage.setItem('omni_v10_final', v); location.reload(); }
}

function sync(i) {
    data[i] = document.getElementById(`img${i}`).files[0];
    document.getElementById(`box${i}`).classList.add('has-file');
    document.getElementById(`c${i}`).innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 text-3xl"></i><p class="text-[10px] font-black text-emerald-500 mt-2 uppercase">SYCHRONIZED</p>`;
}

async function run() {
    if (!API) return alert("System Offline: Connect API Key.");
    if (data.includes(null)) return alert("Data Gap: Upload 4-Tier Strategic Set.");
    
    const btn = document.getElementById('go');
    const asset = document.getElementById('assetDisplay');
    btn.innerHTML = `<i class="fa-solid fa-microchip fa-spin mr-3"></i> ANALYZING MARKET...`;
    asset.innerText = "DETECTING PAIR...";

    try {
        const parts = await Promise.all(data.map(f => {
            return new Promise(r => {
                const fr = new FileReader();
                fr.readAsDataURL(f);
                fr.onload = () => r({ inlineData: { mimeType: f.type, data: fr.result.split(',')[1] } });
            });
        }));

        const prompt = `Task: Institutional Trade Analysis. 
        1. Look at all 4 charts (1H, 15M, 1M, DXY) and detect the Asset Pair.
        2. Aggregator: Combine SMC, Price Action, and DXY Correlation.
        3. IF CHOPPY: Set bias "WAIT" and give trigger_price. 
        4. MENTOR LOGIC: Max 2 simple, punchy sentences per point.

        JSON ONLY:
        {
            "p": "PAIR", "b": "BUY|SELL|WAIT", "e": number, "s": number, "t": number, "tr": number,
            "l": "1. THE STORY: [Short]\\n2. THE TRAP: [Short]\\n3. THE TRIGGER: [Short]"
        }`;

        const req = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...parts] }] })
        });

        const d = await req.json();
        const res = JSON.parse(d.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/)[0]);
        
        asset.innerText = `TARGET: ${res.p}`;
        render(res);
    } catch (e) { alert("SYSTEM ALERT: Critical Sync Error."); }
    finally { btn.innerText = "Perform Multi-Strategy Scan"; }
}

function render(r) {
    document.getElementById('results').classList.remove('hidden');
    const b = document.getElementById('bias');
    const w = document.getElementById('waitBox');
    
    b.innerText = r.b;
    if (r.b === "WAIT" && r.tr) {
        w.classList.remove('hidden');
        document.getElementById('waitMsg').innerText = `WAIT FOR TRIGGER: ${r.tr}`;
        b.className = "text-[10rem] font-black italic glow-bias text-amber-500";
    } else {
        w.classList.add('hidden');
        b.className = r.b === 'BUY' ? "text-[10rem] font-black italic glow-bias text-emerald-500" : "text-[10rem] font-black italic glow-bias text-rose-600";
    }

    document.getElementById('e').innerText = r.e || "--";
    document.getElementById('s').innerText = r.s || "--";
    document.getElementById('t').innerText = r.t || "--";
    document.getElementById('logic').innerText = r.l;
    
    const dist = Math.abs(r.e - r.s);
    document.getElementById('l').innerText = dist > 0 ? ((1000 * 0.01) / (dist * 10)).toFixed(2) + " Lots" : "ADAPTIVE";
    
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}
