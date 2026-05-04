import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0D0D0F",
  surface: "#16161A",
  surfaceAlt: "#1E1E24",
  border: "#2A2A35",
  amber: "#C8963E",
  amberLight: "#E8B86D",
  amberDim: "#7A5A25",
  cream: "#F0E6D3",
  muted: "#6B6B7A",
  success: "#4CAF7D",
  text: "#E8E0D5",
};

const TIERS = {
  low: {
    label: "A spontaneous one",
    sublabel: "Low-key & lovely",
    range: "Under £30",
    ideas: ["Free gallery + coffee", "Borough Market wander", "Tate Modern + hot chocolate", "Columbia Road flowers + brunch", "Southbank walk + street food"],
    color: "#4A9E7F",
    emoji: "🌿",
  },
  mid: {
    label: "Something with a bit of spark",
    sublabel: "Mid-range magic",
    range: "£30–£80",
    ideas: ["Sofar Sounds gig", "TodayTix rush tickets", "Cocktails at a hidden bar", "Street food market + drinks", "Jazz bar in Soho"],
    color: "#C8963E",
    emoji: "✨",
  },
  high: {
    label: "Make a night of it",
    sublabel: "The full experience",
    range: "£80+",
    ideas: ["West End theatre", "Tasting menu restaurant", "Afternoon tea", "Rooftop cocktail bar", "Private members club evening"],
    color: "#A06BC8",
    emoji: "🌙",
  },
};

const LONDON_RIDDLES = [
  { question: "I have a dome but no ceiling, a gallery that whispers but holds no secrets. What am I?", answer: "st pauls" },
  { question: "I run through every London borough but never move. What am I?", answer: "postcode" },
  { question: "I open every night but have no door. Thousands watch but I never perform. What am I?", answer: "sky" },
  { question: "Couples find me on bridges. Locals ignore me. I am not a landmark. What am I?", answer: "padlock" },
  { question: "I carry the Thames in my name but never touch water. What am I?", answer: "thames street" },
  { question: "I am always crowded but nobody lives in me. I move all day but go nowhere. What am I?", answer: "tube" },
  { question: "Every Londoner has passed through me but few remember my name. I connect cities but belong to neither. What am I?", answer: "st pancras" },
];

const PREFS = [
  { id: "vibe", question: "Tonight's vibe?", options: ["Cosy & intimate", "Lively & social"] },
  { id: "style", question: "You'd rather...", options: ["Sit down & settle in", "Wander & explore"] },
  { id: "type", question: "Culture or pleasure?", options: ["Art, music, theatre", "Food, drinks, indulgence"] },
];

function getRiddle() {
  return LONDON_RIDDLES[Math.floor(Math.random() * LONDON_RIDDLES.length)];
}

function getTier(amount) {
  if (amount < 30) return "low";
  if (amount < 80) return "mid";
  return "high";
}

async function getRecommendation(tier, combinedPrefs, savingsGap) {
  const tierData = TIERS[tier];
  const prompt = `You are the voice of "The Date Fund" — a romantic, warm, and slightly poetic tool for London couples planning date nights together.

Generate a date night recommendation for a London couple. Here's their context:
- Budget tier: ${tierData.sublabel} (${tierData.range})
- Their combined preferences: ${JSON.stringify(combinedPrefs)}
- Possible ideas for this tier: ${tierData.ideas.join(", ")}
${savingsGap > 0 ? `- They're £${savingsGap} away from the next tier up — mention this as a warm, encouraging savings seed` : ""}

Write:
1. A specific date night recommendation (2–3 sentences, warm and specific to London, not generic)
2. One practical tip (booking, timing, or local insider knowledge)
${savingsGap > 0 ? "3. A one-line savings nudge — gentle, not financial-advice-y" : ""}

Tone: romantic but not saccharine. Smart. Like a friend who knows London really well and genuinely wants the night to be good. Keep it under 120 words total. No headers, just flowing paragraphs.`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  console.log("VITE_ANTHROPIC_API_KEY:", apiKey);
  if (!apiKey) throw new Error("API key not found — set VITE_ANTHROPIC_API_KEY in Cloudflare Pages environment variables");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.content[0].text;
  } catch (err) {
    throw new Error(err.message || "Unknown error");
  }
}

// ── Screens ──────────────────────────────────────────────────────────────────

function Intro({ onStart }) {
  return (
    <div style={styles.screen}>
      <div style={styles.introGlow} />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={styles.logo}>✦</div>
        <h1 style={styles.heroTitle}>The Date Fund</h1>
        <p style={styles.heroSub}>A private pot. A shared night. No awkward conversations about money.</p>
        <p style={{ ...styles.body, color: COLORS.muted, marginTop: 16, maxWidth: 280, margin: "16px auto 0" }}>
          Built for London couples who want to make the most of tonight — whatever their budget.
        </p>
        <button style={styles.btnPrimary} onClick={onStart}>Start a date night →</button>
      </div>
    </div>
  );
}

function RoomSetup({ onCreate }) {
  const [name, setName] = useState("");
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <p style={styles.label}>Your name</p>
        <input
          style={styles.input}
          placeholder="e.g. Alice"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <p style={{ ...styles.caption, marginTop: 20 }}>
          Once you continue, you'll get a code to share with your partner.
        </p>
        <button
          style={{ ...styles.btnPrimary, opacity: name ? 1 : 0.4 }}
          disabled={!name}
          onClick={() => onCreate({ name, code })}
        >
          Create the fund →
        </button>
      </div>
    </div>
  );
}

function AmountInput({ partnerName, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={styles.heading}>Locked in.</h2>
          <p style={styles.body}>Your contribution is sealed. Waiting for {partnerName}...</p>
          <div style={styles.pulse} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <p style={styles.label}>What are you comfortable spending tonight?</p>
        <p style={{ ...styles.caption, marginBottom: 20 }}>Just you. {partnerName} won't see this number.</p>
        <div style={styles.amountRow}>
          <span style={styles.currency}>£</span>
          <input
            style={{ ...styles.input, fontSize: 36, width: 140, textAlign: "center" }}
            type="number"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <button
          style={{ ...styles.btnPrimary, opacity: amount ? 1 : 0.4 }}
          disabled={!amount}
          onClick={() => { setSubmitted(true); onSubmit(Number(amount)); }}
        >
          Seal it →
        </button>
      </div>
    </div>
  );
}

function Reveal({ tier, savingsGap, onContinue }) {
  const t = TIERS[tier];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 400);
  }, []);

  return (
    <div style={styles.screen}>
      <div style={{ textAlign: "center", transition: "opacity 0.8s", opacity: visible ? 1 : 0 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{t.emoji}</div>
        <p style={{ ...styles.label, color: t.color }}>Tonight feels like</p>
        <h2 style={{ ...styles.heroTitle, fontSize: 28, marginBottom: 4 }}>{t.label}</h2>
        <p style={{ ...styles.caption, color: COLORS.muted }}>{t.sublabel} · {t.range}</p>

        {savingsGap > 0 && (
          <div style={styles.savingsPill}>
            <span>💛</span>
            <span>You're £{savingsGap} away from the next tier — want to start saving toward it?</span>
          </div>
        )}

        <button style={{ ...styles.btnPrimary, marginTop: 32 }} onClick={onContinue}>
          Find tonight's date →
        </button>
      </div>
    </div>
  );
}

function Preferences({ userName, partnerName, tier, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = PREFS[step];

  function choose(val) {
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    if (step < PREFS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(next);
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <p style={styles.caption}>{step + 1} of {PREFS.length}</p>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${((step + 1) / PREFS.length) * 100}%` }} />
        </div>
        <h3 style={{ ...styles.heading, marginTop: 24 }}>{q.question}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {q.options.map(opt => (
            <button key={opt} style={styles.optionBtn} onClick={() => choose(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Recommendation({ tier, prefs1, prefs2, amount1, amount2, onMiniGame }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const disagreement = Object.keys(prefs1).some(k => prefs1[k] !== prefs2[k]);
  const lowerAmount = Math.min(amount1, amount2);
  const higherAmount = Math.max(amount1, amount2);
  const nextTierThreshold = tier === "low" ? 30 : tier === "mid" ? 80 : null;
  const savingsGap = nextTierThreshold ? Math.max(0, nextTierThreshold - lowerAmount) : 0;

  useEffect(() => {
    if (!disagreement) {
      getRecommendation(tier, prefs1, savingsGap)
        .then(r => { setRec(r); setLoading(false); })
        .catch(err => { setError(err.message); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  if (disagreement) {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
          <h2 style={styles.heading}>You didn't quite agree.</h2>
          <p style={styles.body}>That's okay. There's only one fair way to settle this.</p>
          <button style={{ ...styles.btnPrimary, marginTop: 24 }} onClick={onMiniGame}>
            Play for it →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      {loading ? (
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner} />
          <p style={{ ...styles.caption, marginTop: 16 }}>Finding your perfect night...</p>
        </div>
      ) : error ? (
        <div style={styles.card}>
          <p style={{ ...styles.label, color: "#e05c5c" }}>Something went wrong</p>
          <p style={{ ...styles.body, marginTop: 12, color: COLORS.muted }}>{error}</p>
        </div>
      ) : (
        <div style={styles.card}>
          <p style={{ ...styles.label, color: COLORS.amber }}>Tonight's recommendation</p>
          <p style={{ ...styles.body, marginTop: 12, lineHeight: 1.8 }}>{rec}</p>
          {savingsGap > 0 && (
            <div style={styles.savingsPill}>
              <span>🎯</span>
              <span>Next goal: save £{savingsGap} together for the next tier</span>
            </div>
          )}
          <button style={{ ...styles.btnPrimary, marginTop: 28 }} onClick={() => window.location.reload()}>
            Plan another night →
          </button>
        </div>
      )}
    </div>
  );
}

function MiniGame({ tier, prefs, amount1, amount2, onResult }) {
  const [phase, setPhase] = useState("intro"); // intro | playing | result
  const [riddle] = useState(getRiddle());
  const [answer, setAnswer] = useState("");
  const [winner, setWinner] = useState(null);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const nextTierThreshold = tier === "low" ? 30 : tier === "mid" ? 80 : null;
  const lowerAmount = Math.min(amount1, amount2);
  const savingsGap = nextTierThreshold ? Math.max(0, nextTierThreshold - lowerAmount) : 0;

  function submitAnswer(gaveUp = false) {
    if (gaveUp) {
      finishGame("Claude decides");
      return;
    }
    const correct = answer.toLowerCase().trim().includes(riddle.answer);
    if (correct) {
      finishGame("You solved it!");
    } else {
      finishGame("Neither solved it — fate decides");
    }
  }

  function finishGame(result) {
    setWinner(result);
    setPhase("result");
    setLoading(true);
    getRecommendation(tier, prefs, savingsGap)
      .then(r => { setRec(r); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }

  if (phase === "intro") {
    return (
      <div style={styles.screen}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧩</div>
          <h2 style={styles.heading}>A London riddle</h2>
          <p style={styles.body}>First to answer correctly wins the pick. First to give up — loses it.</p>
          <p style={{ ...styles.caption, color: COLORS.muted, marginTop: 8 }}>If neither solves it, Claude decides.</p>
          <button style={{ ...styles.btnPrimary, marginTop: 28 }} onClick={() => setPhase("playing")}>
            Show the riddle →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "playing") {
    return (
      <div style={styles.screen}>
        <div style={styles.card}>
          <div style={styles.riddleBox}>
            <p style={styles.riddleText}>"{riddle.question}"</p>
          </div>
          <input
            style={{ ...styles.input, marginTop: 24 }}
            placeholder="Your answer..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
          <button
            style={{ ...styles.btnPrimary, opacity: answer ? 1 : 0.4, marginTop: 16 }}
            disabled={!answer}
            onClick={() => submitAnswer(false)}
          >
            Submit answer →
          </button>
          <button
            style={{ ...styles.btnGhost, marginTop: 12 }}
            onClick={() => submitAnswer(true)}
          >
            I give up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.screen}>
      {loading ? (
        <div style={{ textAlign: "center" }}>
          <div style={styles.spinner} />
          <p style={{ ...styles.caption, marginTop: 16 }}>Settling the matter...</p>
        </div>
      ) : error ? (
        <div style={styles.card}>
          <p style={{ ...styles.label, color: "#e05c5c" }}>Something went wrong</p>
          <p style={{ ...styles.body, marginTop: 12, color: COLORS.muted }}>{error}</p>
        </div>
      ) : (
        <div style={styles.card}>
          <p style={{ ...styles.label, color: COLORS.amber }}>{winner}</p>
          <p style={{ ...styles.caption, color: COLORS.muted, marginTop: 4 }}>Tonight's recommendation</p>
          <p style={{ ...styles.body, marginTop: 16, lineHeight: 1.8 }}>{rec}</p>
          {savingsGap > 0 && (
            <div style={styles.savingsPill}>
              <span>🎯</span>
              <span>Next goal: save £{savingsGap} together</span>
            </div>
          )}
          <button style={{ ...styles.btnPrimary, marginTop: 28 }} onClick={() => window.location.reload()}>
            Plan another night →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("intro");
  const [user1, setUser1] = useState(null);
  const [amount1, setAmount1] = useState(null);
  const [amount2, setAmount2] = useState(null);
  const [tier, setTier] = useState(null);
  const [savingsGap, setSavingsGap] = useState(0);
  const [prefs1, setPrefs1] = useState(null);
  const [prefs2, setPrefs2] = useState(null);

  // Simulate partner 2 for demo purposes
  const DEMO_PARTNER = { name: "Jordan", amount: 65 };

  function handleCreate(userData) {
    setUser1(userData);
    setScreen("amount1");
  }

  function handleAmount1(amount) {
    setAmount1(amount);
    // In real app: wait for partner. For demo: auto-submit partner 2
    setTimeout(() => {
      const a2 = DEMO_PARTNER.amount;
      setAmount2(a2);
      const lower = Math.min(amount, a2);
      const higher = Math.max(amount, a2);
      const t = getTier(lower);
      setTier(t);
      const nextThreshold = t === "low" ? 30 : t === "mid" ? 80 : null;
      setSavingsGap(nextThreshold ? Math.max(0, nextThreshold - lower) : 0);
      setScreen("reveal");
    }, 1800);
  }

  function handlePrefs1(p) {
    setPrefs1(p);
    // Demo: auto-generate partner 2 prefs with slight variation
    const p2 = {
      vibe: Math.random() > 0.5 ? p.vibe : (p.vibe === "Cosy & intimate" ? "Lively & social" : "Cosy & intimate"),
      style: p.style,
      type: Math.random() > 0.6 ? p.type : (p.type === "Art, music, theatre" ? "Food, drinks, indulgence" : "Art, music, theatre"),
    };
    setPrefs2(p2);
    setScreen("recommendation");
  }

  return (
    <div style={styles.root}>
      <div style={styles.app}>
        {/* Header */}
        {screen !== "intro" && (
          <div style={styles.header}>
            <span style={styles.headerLogo}>✦ The Date Fund</span>
            {user1 && <span style={styles.headerUser}>{user1.name} & {DEMO_PARTNER.name}</span>}
          </div>
        )}

        {screen === "intro" && <Intro onStart={() => setScreen("setup")} />}
        {screen === "setup" && <RoomSetup onCreate={handleCreate} />}
        {screen === "amount1" && (
          <AmountInput partnerName={DEMO_PARTNER.name} onSubmit={handleAmount1} />
        )}
        {screen === "reveal" && (
          <Reveal
            tier={tier}
            savingsGap={savingsGap}
            onContinue={() => setScreen("prefs")}
          />
        )}
        {screen === "prefs" && (
          <Preferences
            userName={user1?.name}
            partnerName={DEMO_PARTNER.name}
            tier={tier}
            onComplete={handlePrefs1}
          />
        )}
        {screen === "recommendation" && prefs1 && prefs2 && (
          <Recommendation
            tier={tier}
            prefs1={prefs1}
            prefs2={prefs2}
            amount1={amount1}
            amount2={amount2}
            onMiniGame={() => setScreen("minigame")}
          />
        )}
        {screen === "minigame" && (
          <MiniGame
            tier={tier}
            prefs={prefs1}
            amount1={amount1}
            amount2={amount2}
          />
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: COLORS.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Cormorant Garamond', 'Georgia', 'Times New Roman', serif",
    padding: 16,
  },
  app: {
    width: "100%",
    maxWidth: 420,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0 0",
    marginBottom: 8,
  },
  headerLogo: {
    color: COLORS.amber,
    fontSize: 13,
    letterSpacing: "0.12em",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  headerUser: {
    color: COLORS.muted,
    fontSize: 12,
    letterSpacing: "0.08em",
  },
  screen: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: "32px 0",
    position: "relative",
  },
  introGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,150,62,0.12) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  logo: {
    fontSize: 32,
    color: COLORS.amber,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 38,
    color: COLORS.cream,
    margin: "0 0 12px",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  heroSub: {
    fontSize: 15,
    color: COLORS.amberLight,
    margin: 0,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  heading: {
    fontSize: 24,
    color: COLORS.cream,
    fontWeight: 400,
    margin: "0 0 8px",
    letterSpacing: "-0.01em",
  },
  body: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 1.6,
    margin: 0,
  },
  label: {
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: COLORS.muted,
    margin: "0 0 8px",
  },
  caption: {
    fontSize: 13,
    color: COLORS.muted,
    margin: 0,
    lineHeight: 1.5,
  },
  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: 28,
    width: "100%",
  },
  input: {
    width: "100%",
    background: COLORS.surfaceAlt,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    color: COLORS.cream,
    fontSize: 16,
    padding: "14px 16px",
    outline: "none",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    boxSizing: "border-box",
  },
  amountRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    marginBottom: 24,
  },
  currency: {
    fontSize: 28,
    color: COLORS.amber,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  btnPrimary: {
    width: "100%",
    background: COLORS.amber,
    color: COLORS.bg,
    border: "none",
    borderRadius: 10,
    padding: "16px 24px",
    fontSize: 15,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    cursor: "pointer",
    marginTop: 20,
    letterSpacing: "0.02em",
    transition: "opacity 0.2s",
  },
  btnGhost: {
    width: "100%",
    background: "transparent",
    color: COLORS.muted,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "14px 24px",
    fontSize: 14,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  optionBtn: {
    width: "100%",
    background: COLORS.surfaceAlt,
    color: COLORS.cream,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "16px 20px",
    fontSize: 15,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s",
  },
  savingsPill: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "rgba(200,150,62,0.08)",
    border: `1px solid ${COLORS.amberDim}`,
    borderRadius: 10,
    padding: "12px 16px",
    marginTop: 20,
    fontSize: 13,
    color: COLORS.amberLight,
    lineHeight: 1.5,
  },
  progressBar: {
    height: 2,
    background: COLORS.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: COLORS.amber,
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  riddleBox: {
    background: COLORS.surfaceAlt,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
  },
  riddleText: {
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 1.7,
    margin: 0,
    fontStyle: "italic",
  },
  spinner: {
    width: 32,
    height: 32,
    border: `2px solid ${COLORS.border}`,
    borderTopColor: COLORS.amber,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: COLORS.amber,
    margin: "24px auto 0",
    animation: "pulse 1.4s ease-in-out infinite",
  },
};

// Inject keyframes
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
  input:focus { border-color: #C8963E !important; }
  button:hover { opacity: 0.88; }
`;
document.head.appendChild(styleEl);
