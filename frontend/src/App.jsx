import { useState, useEffect, useRef } from "react";

/* ───────── 1. CONNECT YOUR BACKEND (only part you need to edit) ───────── */
const API_URL = "https://customer-churn-api-1dzf.onrender.com/predict";

// Match these keys to what your model/API expects.

const buildPayload = (f) => ({
  tenure: Number(f.tenure),
  monthly_charges: Number(f.monthly),
  total_charges: Number(f.total),
  contract: f.contract,
  internet_service: f.internet,
  payment_method: f.payment,
});

// Accepts 0–1 or 0–100, under several common key names.
const readProbability = (d) => {
  const raw = d.churn_probability ?? d.probability ?? d.churnProbability ?? d.prob ?? 0;
  return raw <= 1 ? raw * 100 : raw;
};
/* ──────────────────────────────────────────────────────────────────────── */

const OPTIONS = {
  contract: ["Month-to-month", "One year", "Two year"],
  internet: ["No", "DSL", "Fiber optic"],
  payment: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
};

function useCountUp(target, ms = 1400) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const k = Math.min((t - start) / ms, 1);
      const e = 1 - Math.pow(1 - k, 4);
      setV(a + (target - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Chips({ label, name, value, onChange }) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="chips">
        {OPTIONS[name].map((o) => (
          <button type="button" key={o} className={"chip" + (value === o ? " on" : "")}
            aria-pressed={value === o} onClick={() => onChange(name, o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Num({ label, name, value, onChange, prefix }) {
  return (
    <label className="field">
      <span className="lg">{label}</span>
      <span className="num">
        {prefix && <i>{prefix}</i>}
        <input type="number" min="0" value={value} onChange={(e) => onChange(name, e.target.value)} />
      </span>
    </label>
  );
}

export default function App() {
  const [f, setF] = useState({
    tenure: 12, monthly: 10, total: 1000,
    contract: "One year", internet: "No", payment: "Credit card (automatic)",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [prob, setProb] = useState(0);
  const [churn, setChurn] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const shown = useCountUp(status === "done" ? prob : 0);
  const p = status === "done" ? prob : 0;
  const hue = Math.round(168 - Math.min(p, 100) * 1.62); // teal → coral
  const angle = -90 + (status === "done" ? prob : 0) * 1.8;

  async function predict(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const [res] = await Promise.all([
        fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(f)),
        }),
        new Promise((r) => setTimeout(r, 900)), // lets the scan animation breathe
      ]);
      if (!res.ok) throw new Error("bad status");
      const d = await res.json();
      const pr = Math.max(0, Math.min(100, readProbability(d)));
      setProb(pr);
      setChurn(typeof d.churn === "boolean" ? d.churn : pr >= 50);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const verdict =
    status === "done" ? (churn ? "Likely to leave" : "Likely to stay")
    : status === "loading" ? "Reading the signals…"
    : status === "error" ? "Couldn’t reach the model"
    : "Waiting for details";

  return (
    <div className="app" style={{ "--h": status === "done" ? hue : 200 }}>
      <style>{CSS}</style>
      <div className="glow" aria-hidden />

      <header>
        <h1>Will they stay?</h1>
        <p>Enter a customer’s plan details and the model estimates their chance of cancelling.</p>
      </header>

      <main>
        <form className="panel form" onSubmit={predict}>
          <div className="row3">
            <Num label="Tenure (months)" name="tenure" value={f.tenure} onChange={set} />
            <Num label="Monthly charges" name="monthly" value={f.monthly} onChange={set} prefix="₹" />
            <Num label="Total charges" name="total" value={f.total} onChange={set} prefix="₹" />
          </div>
          <Chips label="Contract" name="contract" value={f.contract} onChange={set} />
          <Chips label="Internet service" name="internet" value={f.internet} onChange={set} />
          <Chips label="Payment method" name="payment" value={f.payment} onChange={set} />
          <button className="go" disabled={status === "loading"}>
            <span>{status === "loading" ? "Analysing…" : "Predict churn"}</span>
          </button>
        </form>

        <section className="panel result" aria-live="polite">
          <svg viewBox="0 0 300 175" className="gauge" role="img"
            aria-label={status === "done" ? `Churn probability ${prob.toFixed(1)} percent` : "Churn gauge"}>
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0" stopColor="hsl(168 80% 55%)" />
                <stop offset=".5" stopColor="hsl(45 95% 60%)" />
                <stop offset="1" stopColor="hsl(6 90% 62%)" />
              </linearGradient>
            </defs>
            <path d="M30 150 A120 120 0 0 1 270 150" className="track" pathLength="100" />
            <path d="M30 150 A120 120 0 0 1 270 150" className="fill" pathLength="100"
              strokeDasharray={`${p} 100`} />
            <g className="needle" style={{ transform: `rotate(${angle}deg)` }}>
              <g className={status === "loading" ? "wobble" : ""}>
                <line x1="150" y1="150" x2="150" y2="48" />
                <circle cx="150" cy="48" r="5" />
              </g>
            </g>
            <circle cx="150" cy="150" r="11" className="hub" />
            <text x="22" y="170" className="end">Stay</text>
            <text x="278" y="170" className="end" textAnchor="end">Leave</text>
          </svg>

          <div className="big">
            {status === "done" ? shown.toFixed(1) : "—"}
            <small>%</small>
          </div>
          <div className="small">churn probability</div>
          <div className={"verdict " + status}>{verdict}</div>
          {status === "error" && (
            <p className="err">Check that the API address in App.jsx is correct and the server is running, then try again.</p>
          )}
        </section>
      </main>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box}
body{margin:0;background:#0d1117}
.app{--tone:hsl(var(--h) 85% 60%);min-height:100vh;color:#e9eef5;font-family:'DM Sans',system-ui,sans-serif;
  padding:56px 24px 64px;position:relative;overflow:hidden;background:#0d1117}
.glow{position:absolute;inset:-20% -10% auto;height:70vh;pointer-events:none;
  background:radial-gradient(50% 60% at 70% 30%,hsl(var(--h) 80% 45% / .28),transparent 70%),
             radial-gradient(40% 50% at 20% 20%,hsl(260 70% 50% / .18),transparent 70%);
  transition:background 1.2s ease;animation:drift 14s ease-in-out infinite alternate}
@keyframes drift{to{transform:translate3d(-3%,4%,0) scale(1.08)}}
header,main{position:relative;max-width:1040px;margin:0 auto}
h1{font:800 clamp(2.6rem,6vw,4.4rem)/1 'Bricolage Grotesque',sans-serif;margin:0 0 14px;letter-spacing:-.03em;
  background:linear-gradient(100deg,#fff 20%,var(--tone));-webkit-background-clip:text;background-clip:text;color:transparent;
  background-size:200% 100%;animation:sheen 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes sheen{from{background-position:100% 0;opacity:0;transform:translateY(14px)}to{background-position:0 0;opacity:1;transform:none}}
header p{margin:0 0 36px;color:#9aa7b8;max-width:46ch;line-height:1.55;font-size:1.05rem}
main{display:grid;grid-template-columns:1.15fr .85fr;gap:22px;align-items:start}
@media(max-width:860px){main{grid-template-columns:1fr}}
.panel{background:rgb(255 255 255 / .045);border:1px solid rgb(255 255 255 / .09);border-radius:22px;padding:26px;
  backdrop-filter:blur(14px)}
.form{display:grid;gap:22px}
.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
@media(max-width:560px){.row3{grid-template-columns:1fr}}
.field{border:0;padding:0;margin:0;display:grid;gap:9px;min-width:0}
legend,.lg{font-size:.82rem;font-weight:600;color:#9aa7b8;padding:0;margin-bottom:9px}
.field .lg{margin:0}
.num{display:flex;align-items:center;background:#0b0f16;border:1px solid rgb(255 255 255 / .1);border-radius:12px;
  padding:0 14px;transition:border-color .2s,box-shadow .2s}
.num:focus-within{border-color:var(--tone);box-shadow:0 0 0 4px hsl(var(--h) 85% 60% / .18)}
.num i{font-style:normal;color:#6b7788;margin-right:6px}
.num input{all:unset;width:100%;padding:14px 0;font-weight:600;font-size:1.05rem;font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font:500 .92rem 'DM Sans',sans-serif;color:#c3cdda;background:#0b0f16;border:1px solid rgb(255 255 255 / .1);
  border-radius:999px;padding:9px 16px;cursor:pointer;transition:transform .18s,background .25s,border-color .25s,color .25s}
.chip:hover{border-color:rgb(255 255 255 / .28)}
.chip:active{transform:scale(.95)}
.chip.on{background:var(--tone);border-color:var(--tone);color:#07110f;font-weight:600;animation:pop .32s cubic-bezier(.3,1.6,.5,1)}
@keyframes pop{0%{transform:scale(.92)}100%{transform:scale(1)}}
.go{all:unset;box-sizing:border-box;text-align:center;cursor:pointer;font:700 1.05rem 'Bricolage Grotesque',sans-serif;
  padding:17px;border-radius:14px;color:#07110f;position:relative;overflow:hidden;
  background:linear-gradient(110deg,#8b5cf6,var(--tone),#8b5cf6);background-size:220% 100%;
  transition:background-position .6s,transform .15s,filter .2s}
.go:hover{background-position:100% 0}
.go:active{transform:scale(.985)}
.go:disabled{filter:saturate(.6);cursor:progress}
.go:disabled::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgb(255 255 255 / .55),transparent 70%);
  animation:sweep 1s linear infinite}
@keyframes sweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.chip:focus-visible,.go:focus-visible{outline:2px solid #fff;outline-offset:3px}
.result{text-align:center;position:sticky;top:24px}
.gauge{width:100%;max-width:340px;overflow:visible}
.track,.fill{fill:none;stroke-width:16;stroke-linecap:round}
.track{stroke:rgb(255 255 255 / .08)}
.fill{stroke:url(#g);transition:stroke-dasharray 1.4s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 0 8px hsl(var(--h) 90% 55% / .55))}
.needle{transform-origin:150px 150px;transform-box:view-box;transition:transform 1.4s cubic-bezier(.34,1.4,.5,1)}
.wobble{transform-origin:150px 150px;transform-box:view-box;animation:wob .9s ease-in-out infinite alternate}
@keyframes wob{from{transform:rotate(-70deg)}to{transform:rotate(70deg)}}
.needle line{stroke:#fff;stroke-width:3;stroke-linecap:round}
.needle circle{fill:var(--tone)}
.hub{fill:#0d1117;stroke:#fff;stroke-width:3}
.end{fill:#6b7788;font-size:11px;font-family:'DM Sans',sans-serif}
.big{font:800 4.2rem/1 'Bricolage Grotesque',sans-serif;margin-top:6px;font-variant-numeric:tabular-nums;color:var(--tone);
  transition:color 1s}
.big small{font-size:1.6rem;opacity:.7;margin-left:3px}
.small{color:#9aa7b8;font-size:.9rem;margin:4px 0 16px}
.verdict{display:inline-block;padding:9px 18px;border-radius:999px;font-weight:600;background:rgb(255 255 255 / .07);
  transition:background .6s,color .6s}
.verdict.done{background:hsl(var(--h) 85% 60% / .16);color:var(--tone);animation:pop .5s cubic-bezier(.3,1.6,.5,1)}
.verdict.loading{animation:blink 1s ease-in-out infinite}
@keyframes blink{50%{opacity:.45}}
.err{color:#ff9b8f;font-size:.9rem;line-height:1.5;margin:14px 0 0}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition-duration:.01ms!important}}
`;
