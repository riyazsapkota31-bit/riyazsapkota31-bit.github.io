<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>OMNI-BLACK | SCALPER ELITE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background: #000; color: #fff; font-family: system-ui, sans-serif; padding: 20px; -webkit-font-smoothing: antialiased; }
        .glass { background: rgba(10, 10, 12, 0.99); border: 1px solid rgba(255,255,255,0.08); border-radius: 45px; }
        .tier-box { border: 2px dashed #222; border-radius: 50px; min-height: 190px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
        .has-file { border: 3px solid #10b981; background: rgba(16, 185, 129, 0.05); box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); }
        .glow-bias { text-shadow: 0 0 60px currentColor; font-size: clamp(7.5rem, 20vw, 11rem); font-weight: 900; line-height: 0.8; letter-spacing: -0.05em; font-style: italic; filter: brightness(1.3); }
        .btn-exec { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 38px; padding: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.4); }
        .btn-exec:active { transform: scale(0.95); filter: contrast(1.2); }
        .status-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
    </style>
</head>
<body>

    <header class="flex justify-between items-center mb-12 px-4">
        <div>
            <h1 class="text-4xl font-black italic tracking-tighter leading-none">OMNI-BLACK</h1>
            <p class="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.6em] mt-1">Quantum Scalper V10</p>
        </div>
        <div id="status" class="w-5 h-5 rounded-full bg-rose-600 shadow-[0_0_25px_rgba(225,29,72,0.6)]"></div>
    </header>

    <div class="glass p-8 mb-10 border-l-[12px] border-indigo-600 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5"><i class="fa-solid fa-microchip text-6xl"></i></div>
        <p class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Active Intelligence Stream</p>
        <h2 id="assetDisplay" class="text-3xl font-black text-white italic uppercase tracking-tighter">[ READY FOR DATA ]</h2>
    </div>

    <div class="grid grid-cols-2 gap-6 mb-12">
        <div id="box0" class="tier-box">
            <input type="file" id="i0" accept="image/*" onchange="sync(0)" class="absolute inset-0 opacity-0 z-30 cursor-pointer">
            <div id="t0" class="text-center"><i class="fa-solid fa-compass text-indigo-500 text-4xl mb-2"></i><p class="text-[11px] font-black text-slate-400 uppercase">1H Bias</p></div>
        </div>
        <div id="box1" class="tier-box">
            <input type="file" id="i1" accept="image/*" onchange="sync(1)" class="absolute inset-0 opacity-0 z-30 cursor-pointer">
            <div id="t1" class="text-center"><i class="fa-solid fa-sitemap text-indigo-500 text-4xl mb-2"></i><p class="text-[11px] font-black text-slate-400 uppercase">15M Struct</p></div>
        </div>
        <div id="box2" class="tier-box">
            <input type="file" id="i2" accept="image/*" onchange="sync(2)" class="absolute inset-0 opacity-0 z-30 cursor-pointer">
            <div id="t2" class="text-center"><i class="fa-solid fa-crosshairs text-indigo-500 text-4xl mb-2"></i><p class="text-[11px] font-black text-slate-400 uppercase">1M Entry</p></div>
        </div>
        <div id="box3" class="tier-box">
            <input type="file" id="i3" accept="image/*" onchange="sync(3)" class="absolute inset-0 opacity-0 z-30 cursor-pointer">
            <div id="t3" class="text-center"><i class="fa-solid fa-bolt-lightning text-indigo-500 text-4xl mb-2"></i><p class="text-[11px] font-black text-slate-400 uppercase">DXY Matrix</p></div>
        </div>
    </div>

    <button id="go" onclick="runAnalysis()" class="btn-exec w-full text-white text-xl mb-14">Initiate Scalp Scan</button>

    <div id="results" class="hidden space-y-12 pb-24">
        
        <div id="waitBox" class="hidden p-10 rounded-[50px] bg-amber-500/10 border-2 border-amber-500/30 text-center relative">
            <p class="text-[12px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2">Scalp Trigger Pending</p>
            <h3 id="waitMsg" class="text-4xl font-black text-white italic tracking-tighter"></h3>
        </div>

        <div class="text-center"><h2 id="bias" class="glow-bias"></h2></div>

        <div class="grid grid-cols-2 gap-6 text-center">
            <div class="glass p-8"><p class="text-[11px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Entry</p><p id="ent" class="text-4xl font-mono text-white">--</p></div>
            <div class="glass p-8 text-indigo-400"><p class="text-[11px] font-bold uppercase mb-2 tracking-widest">Lot Size</p><p id="lot" class="text-4xl font-mono">--</p></div>
            <div class="glass p-8 text-rose-500"><p class="text-[11px] font-bold uppercase mb-2 tracking-widest">Stop</p><p id="sl" class="text-4xl font-mono">--</p></div>
            <div class="glass p-8 text-emerald-500"><p class="text-[11px] font-bold uppercase mb-2 tracking-widest">Target</p><p id="tp" class="text-4xl font-mono">--</p></div>
        </div>

        <div class="glass p-12 border-t-[8px] border-indigo-600 shadow-inner">
            <p class="text-[12px] text-indigo-400 font-black uppercase mb-6 flex items-center gap-3">
                <span class="w-4 h-4 rounded-full bg-indigo-500 status-pulse"></span> Tactical Logic At-Point
            </p>
            <p id="logic" class="text-xl text-slate-200 leading-tight font-bold italic whitespace-pre-wrap"></p>
        </div>
    </div>

    <div class="mt-24 p-12 glass opacity-10 hover:opacity-100 transition-all duration-700 text-center border-dashed">
        <input type="password" id="keyInput" placeholder="Connect Neural API Key" class="bg-transparent border-b-2 border-white/10 w-full mb-10 p-4 text-center text-md outline-none text-indigo-400 font-mono">
        <button onclick="saveKey()" class="text-[12px] font-black uppercase text-slate-500 tracking-[0.6em]">Sync System Link</button>
    </div>

    <script>
        let API_KEY = localStorage.getItem('omni_scalper_v10') || "";
        let tiers = [null, null, null, null];

        if (API_KEY) validateKey(API_KEY);

        async function validateKey(k) {
            const s = document.getElementById('status');
            const d = document.getElementById('assetDisplay');
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${k}`, {
                    method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
                });
                if (res.ok) {
                    s.className = "w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_25px_#10b981] status-pulse";
                    d.innerText = "[ QUANTUM LINK READY ]";
                } else throw new Error();
            } catch (e) {
                s.className = "w-5 h-5 rounded-full bg-rose-600 shadow-[0_0_25px_#e11d48]";
                d.innerText = "[ AUTH REJECTED ]";
            }
        }

        function saveKey() {
            const v = document.getElementById('keyInput').value.trim();
            if (v) { localStorage.setItem('omni_scalper_v10', v); location.reload(); }
        }

        function sync(i) {
            tiers[i] = document.getElementById(`i${i}`).files[0];
            document.getElementById(`box${i}`).classList.add('has-file');
            document.getElementById(`t${i}`).innerHTML = `<i class="fa-solid fa-check-double text-emerald-500 text-6xl"></i>`;
        }

        async function runAnalysis() {
            if (!API_KEY || tiers.includes(null)) return alert("Full Data Sync Required.");
            
            const btn = document.getElementById('go');
            const disp = document.getElementById('assetDisplay');
            btn.innerHTML = `<i class="fa-solid fa-brain animate-spin mr-3"></i> DECODING MULTIVERSE...`;
            disp.innerText = "SMC SCALPER MODE ACTIVE...";

            try {
                const parts = await Promise.all(tiers.map(f => {
                    return new Promise(r => {
                        const rd = new FileReader();
                        rd.readAsDataURL(f);
                        rd.onload = () => r({ inlineData: { mimeType: f.type, data: rd.result.split(',')[1] } });
                    });
                }));

                const prompt = `Act as an Elite High-Frequency Scalper (Einstein Logic).
                1. Detect Ticker/Price from images. 
                2. Evaluate: 1H Momentum + 15M Sweep + 1M MSS + DXY Weight.
                3. Precision: Confidence > 65% triggers BUY/SELL. RR must be > 1:2.
                4. Self-Correct: Double-check axis digits to prevent hallucination.
                5. Logic: Strictly 30-40 words, bullet format.

                FORMAT:
                CONTEXT: [1M Momentum]
                TRAP: [Immediate Liquidity Target]
                TRIGGER: [Immediate 1M Candle Requirement]

                JSON ONLY:
                {
                    "p": "PAIR", "b": "BUY|SELL|WAIT", "e": number, "s": number, "t": number, "tr": number, "conf": number,
                    "l": "CONTEXT: [At-Point]\\nTRAP: [At-Point]\\nTRIGGER: [At-Point]"
                }`;

                const req = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...parts] }] })
                });

                const raw = await req.json();
                const res = JSON.parse(raw.candidates[0].content.parts[0].text.match(/\{[\s\S]*\}/)[0]);
                
                disp.innerText = `${res.p} | CONF: ${res.conf}%`;
                render(res);
            } catch (e) { alert("SCAN ERROR: Ensure images are sharp."); }
            finally { btn.innerText = "Initiate Scalp Scan"; }
        }

        function render(d) {
            document.getElementById('results').classList.remove('hidden');
            const b = document.getElementById('bias');
            const w = document.getElementById('waitBox');
            
            b.innerText = d.b;
            if (d.b === "WAIT") {
                w.classList.remove('hidden');
                document.getElementById('waitMsg').innerText = `TRIGGER PRICE: ${d.tr || '--'}`;
                b.className = "glow-bias text-amber-500";
            } else {
                w.classList.add('hidden');
                b.className = d.b === 'BUY' ? "glow-bias text-emerald-500" : "glow-bias text-rose-600";
            }

            document.getElementById('ent').innerText = d.e || "--";
            document.getElementById('sl').innerText = d.s || "--";
            document.getElementById('tp').innerText = d.t || "--";
            document.getElementById('logic').innerText = d.l;
            
            const dist = Math.abs(d.e - d.s);
            document.getElementById('lot').innerText = dist > 0 ? ((1000 * 0.01) / (dist * 10)).toFixed(2) : "0.01";
            document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
