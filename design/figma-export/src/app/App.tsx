import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

type Screen = "home" | "tournaments" | "rating" | "myTournament" | "profile";
type TournTab = "upcoming" | "completed";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes chip-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes btn-shine {
    0%, 73%, 100% { transform: translateX(-220%); opacity: 0; }
    78% { opacity: 1; }
    88% { transform: translateX(220%); opacity: 0; }
  }
  @keyframes float-hero {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes xp-grow { from { width: 0%; } }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(199,154,61,0); }
    50% { box-shadow: 0 0 20px 3px rgba(199,154,61,0.2); }
  }
  @keyframes ticker-glow {
    0%, 100% { text-shadow: 0 0 8px rgba(247,217,138,0.3); }
    50% { text-shadow: 0 0 20px rgba(247,217,138,0.75); }
  }
  @keyframes nav-glow {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(199,154,61,0.4)); }
    50% { filter: drop-shadow(0 0 7px rgba(247,217,138,0.7)); }
  }

  .chip-spin { animation: chip-spin 30s linear infinite; }
  .float-hero { animation: float-hero 7s ease-in-out infinite; }
  .xp-grow { animation: xp-grow 1.8s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.4s; }

  .btn-shine { position: relative; overflow: hidden; }
  .btn-shine::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.13) 50%, transparent 100%);
    transform: translateX(-220%);
    opacity: 0;
    animation: btn-shine 7s ease-in-out infinite;
  }

  .gold-text {
    background: linear-gradient(135deg, #9C6A1F 0%, #C89A3D 30%, #F7D98A 55%, #C89A3D 75%, #9C6A1F 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gold-text-sm {
    background: linear-gradient(135deg, #C89A3D 0%, #F7D98A 50%, #C89A3D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .deco-lines {
    background-image: repeating-linear-gradient(
      90deg,
      rgba(199,154,61,0.04) 0px, rgba(199,154,61,0.04) 1px,
      transparent 1px, transparent 48px
    );
  }
  .vip-card {
    background: linear-gradient(145deg, #1C1916 0%, #161310 50%, #111009 100%);
    border: 1px solid rgba(199,154,61,0.25);
    border-top-color: rgba(247,217,138,0.3);
    box-shadow:
      0 6px 32px rgba(0,0,0,0.65),
      inset 0 1px 0 rgba(247,217,138,0.07),
      inset 0 0 40px rgba(156,106,31,0.025);
  }
  .vip-card-hero {
    background: linear-gradient(145deg, #211D14 0%, #1A1710 45%, #13110A 100%);
    border: 1px solid rgba(199,154,61,0.38);
    border-top-color: rgba(247,217,138,0.45);
    box-shadow:
      0 12px 56px rgba(0,0,0,0.75),
      0 0 80px rgba(156,106,31,0.07),
      inset 0 1px 0 rgba(247,217,138,0.1);
  }

  .card-pressed { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .card-pressed:active { transform: scale(0.982) translateY(1px); }

  .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
  .ticker-glow { animation: ticker-glow 2s ease-in-out infinite; }
  .nav-active-glow { animation: nav-glow 3s ease-in-out infinite; }

  .hs::-webkit-scrollbar { display: none; }
  .hs { -ms-overflow-style: none; scrollbar-width: none; }

  .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
  .sans { font-family: 'Inter', system-ui, sans-serif; }

  /* Tabular numbers — prevents digits jumping up and down */
  .num {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1, "lnum" 1;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .gold-divider { background: linear-gradient(90deg, transparent, rgba(199,154,61,0.4), transparent); height: 1px; }
  .gold-border-thin { border: 1px solid rgba(199,154,61,0.22); }
  .status-upcoming { background: rgba(199,154,61,0.1); border: 1px solid rgba(199,154,61,0.35); color: #C89A3D; }
  .status-done { background: rgba(80,80,80,0.12); border: 1px solid rgba(100,100,100,0.25); color: #666; }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────
const P = {
  name: "Александр Воронов", initials: "АВ", level: "Platinum Member",
  levelLabel: "Платиновый участник",
  since: "март 2021", xp: 7840, xpNext: 10000, rank: 4,
  played: 47, wins: 12, winnings: "₽2 840 000", best: "1-е место",
};

const TOURN = [
  {
    id: 1, name: "Чемпионат Миллионной", sub: "Гранд-событие сезона",
    date: "Сб, 18 июл 2026", time: "19:00", buyIn: "₽50 000", xp: 500,
    reg: 18, max: 24, pool: "₽1 200 000", upcoming: true, mine: true,
    desc: "Флагманский турнир GUTSHOT Poker Club. Дип-стек No-Limit Hold'em в главном зале клуба — для глубокой, изящной и содержательной игры.",
    structure: "No-Limit Hold'em", blinds: "30 мин", stack: "50 000",
    table: 3, seat: "A2", target: new Date("2026-07-18T16:00:00Z"),
  },
  {
    id: 2, name: "High Roller Invitational", sub: "Только для VIP-членов",
    date: "Пт, 24 июл 2026", time: "20:00", buyIn: "₽200 000", xp: 1500,
    reg: 9, max: 12, pool: "₽2 400 000", upcoming: true, mine: false,
    desc: "Турнир по приглашению для наиболее известных членов клуба. Камерная атмосфера, высокие ставки и незабываемая игра.",
    structure: "No-Limit Hold'em", blinds: "40 мин", stack: "100 000",
    table: null, seat: null, target: new Date("2026-07-24T17:00:00Z"),
  },
  {
    id: 3, name: "Вечерняя классика", sub: "Еженедельный турнир",
    date: "Сб, 25 июл 2026", time: "18:00", buyIn: "₽15 000", xp: 150,
    reg: 22, max: 30, pool: "₽450 000", upcoming: true, mine: false,
    desc: "Наш фирменный еженедельный турнир. Открыт для всех действующих членов клуба.",
    structure: "No-Limit Hold'em", blinds: "20 мин", stack: "30 000",
    table: null, seat: null, target: new Date("2026-07-25T15:00:00Z"),
  },
  {
    id: 4, name: "Летний Гран-при", sub: "Открытие сезона",
    date: "Сб, 5 июл 2026", time: "19:00", buyIn: "₽50 000", xp: 320,
    reg: 24, max: 24, pool: "₽1 200 000", upcoming: false, mine: false,
    myResult: "4-е место", myWinnings: "—", desc: "", structure: "", blinds: "", stack: "",
  },
  {
    id: 5, name: "Пятничный специальный", sub: "Еженедельный турнир",
    date: "Пт, 4 июл 2026", time: "20:00", buyIn: "₽20 000", xp: 180,
    reg: 18, max: 18, pool: "₽360 000", upcoming: false, mine: false,
    myResult: "1-е место", myWinnings: "₽180 000", desc: "", structure: "", blinds: "", stack: "",
  },
];

const RATINGS = [
  { r: 1, name: "Дмитрий Соколов",    ini: "ДС", xp: 14200, wins: 23, badge: "Чемпион" },
  { r: 2, name: "Михаил Петров",      ini: "МП", xp: 12850, wins: 19, badge: "Элита" },
  { r: 3, name: "Николай Волков",     ini: "НВ", xp: 11400, wins: 17, badge: "Мастер" },
  { r: 4, name: "Александр Воронов",  ini: "АВ", xp: 7840,  wins: 12, badge: "Platinum", me: true },
  { r: 5, name: "Сергей Морозов",     ini: "СМ", xp: 7200,  wins: 11, badge: "Platinum" },
  { r: 6, name: "Игорь Федоров",      ini: "ИФ", xp: 6950,  wins: 10, badge: "Gold" },
  { r: 7, name: "Павел Козлов",       ini: "ПК", xp: 6100,  wins: 9,  badge: "Gold" },
  { r: 8, name: "Виктор Новиков",     ini: "ВН", xp: 5800,  wins: 8,  badge: "Gold" },
  { r: 9, name: "Андрей Лебедев",     ini: "АЛ", xp: 4900,  wins: 6,  badge: "Silver" },
  { r: 10, name: "Роман Сидоров",     ini: "РС", xp: 4200,  wins: 5,  badge: "Silver" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const upd = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    upd();
    const id = setInterval(upd, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function useCountUp(to: number, delay = 300) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const dur = 1400;
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setVal(Math.floor(p * to));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [to, delay]);
  return val;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cfg = {
    sm: { title: 12, sub: 7.5, gap: 2 },
    md: { title: 16, sub: 9,   gap: 3 },
    lg: { title: 24, sub: 11,  gap: 4 },
  }[size];

  return (
    <div className="flex flex-col items-center" style={{ gap: cfg.gap }}>
      <div className="flex items-center gap-2">
        {/* left ornament */}
        <svg width={cfg.title * 0.55} height={cfg.title * 0.55} viewBox="0 0 20 20" fill="none">
          <path d="M10 1 L12.5 7.5 L19 8.5 L14.5 13 L15.8 19.5 L10 16.5 L4.2 19.5 L5.5 13 L1 8.5 L7.5 7.5 Z"
            fill="url(#lg1)" />
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="20" y2="20">
              <stop stopColor="#9C6A1F" /><stop offset="0.5" stopColor="#F7D98A" /><stop offset="1" stopColor="#9C6A1F" />
            </linearGradient>
          </defs>
        </svg>

        <span className="gold-text serif tracking-widest font-semibold"
          style={{ fontSize: cfg.title, letterSpacing: "0.2em", lineHeight: 1 }}>
          GUTSHOT
        </span>

        <svg width={cfg.title * 0.55} height={cfg.title * 0.55} viewBox="0 0 20 20" fill="none">
          <path d="M10 1 L12.5 7.5 L19 8.5 L14.5 13 L15.8 19.5 L10 16.5 L4.2 19.5 L5.5 13 L1 8.5 L7.5 7.5 Z"
            fill="url(#lg2)" />
          <defs>
            <linearGradient id="lg2" x1="0" y1="0" x2="20" y2="20">
              <stop stopColor="#9C6A1F" /><stop offset="0.5" stopColor="#F7D98A" /><stop offset="1" stopColor="#9C6A1F" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="gold-divider w-full" style={{ opacity: 0.55 }} />

      <span className="sans uppercase tracking-widest"
        style={{ fontSize: cfg.sub, color: "rgba(199,154,61,0.65)", letterSpacing: "0.28em", lineHeight: 1 }}>
        Poker Club
      </span>
    </div>
  );
}

// ─── Poker Chip ────────────────────────────────────────────────────────────────
function PokerChipBg() {
  const notches = Array.from({ length: 32 }, (_, i) => i);
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none">
      <defs>
        <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9C6A1F" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F7D98A" />
          <stop offset="100%" stopColor="#9C6A1F" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="200" r="196" stroke="url(#cg1)" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="188" stroke="rgba(199,154,61,0.45)" strokeWidth="0.5" />

      {notches.map((i) => {
        const angle = (i * 360) / 32;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const a1 = toRad(angle + 2), a2 = toRad(angle + 9.25);
        const r1 = 188, r2 = 196;
        const pts = [
          [200 + r1 * Math.cos(a1), 200 + r1 * Math.sin(a1)],
          [200 + r2 * Math.cos(a1), 200 + r2 * Math.sin(a1)],
          [200 + r2 * Math.cos(a2), 200 + r2 * Math.sin(a2)],
          [200 + r1 * Math.cos(a2), 200 + r1 * Math.sin(a2)],
        ];
        return (
          <path key={i}
            d={`M ${pts[0][0]},${pts[0][1]} L ${pts[1][0]},${pts[1][1]} L ${pts[2][0]},${pts[2][1]} L ${pts[3][0]},${pts[3][1]} Z`}
            fill={i % 2 === 0 ? "rgba(247,217,138,0.75)" : "rgba(80,50,10,0.35)"} />
        );
      })}

      <circle cx="200" cy="200" r="175" stroke="rgba(247,217,138,0.65)" strokeWidth="1" />
      <circle cx="200" cy="200" r="158" stroke="rgba(199,154,61,0.45)" strokeWidth="0.75" />

      <line x1="200" y1="45" x2="200" y2="355" stroke="rgba(199,154,61,0.22)" strokeWidth="0.75" />
      <line x1="45" y1="200" x2="355" y2="200" stroke="rgba(199,154,61,0.22)" strokeWidth="0.75" />
      <line x1="90" y1="90" x2="310" y2="310" stroke="rgba(199,154,61,0.16)" strokeWidth="0.5" />
      <line x1="310" y1="90" x2="90" y2="310" stroke="rgba(199,154,61,0.16)" strokeWidth="0.5" />

      {/* Circle text */}
      <path id="ct" d="M200,200 m-148,0 a148,148 0 1,1 296,0 a148,148 0 1,1 -296,0" fill="none" />
      <text>
        <textPath href="#ct" startOffset="0%"
          style={{ fontSize: "12px", fontFamily: "Cormorant Garamond,Georgia,serif", letterSpacing: "6px", fill: "rgba(247,217,138,1)" }}>
          GUTSHOT  •  POKER CLUB  •  SAINT PETERSBURG  •
        </textPath>
      </text>

      {/* Centre rings */}
      <circle cx="200" cy="200" r="76" stroke="rgba(247,217,138,0.55)" strokeWidth="1" fill="none" />
      <circle cx="200" cy="200" r="60" stroke="rgba(199,154,61,0.38)" strokeWidth="0.75" fill="none" />

      {/* Spade */}
      <text x="200" y="163" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: "24px", fill: "rgba(247,217,138,0.95)", fontFamily: "serif" }}>♠</text>

      {/* GUTSHOT */}
      <text x="200" y="196" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: "24px", fontFamily: "Cormorant Garamond,Georgia,serif", fontWeight: 600, fill: "rgba(247,217,138,1)", letterSpacing: "6px" }}>GUTSHOT</text>

      {/* divider line */}
      <line x1="144" y1="209" x2="256" y2="209" stroke="rgba(247,217,138,0.65)" strokeWidth="0.75" />

      {/* POKER CLUB */}
      <text x="200" y="224" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: "11px", fontFamily: "Cormorant Garamond,Georgia,serif", fontWeight: 400, fill: "rgba(247,217,138,0.88)", letterSpacing: "5px" }}>POKER CLUB</text>
    </svg>
  );
}

// ─── QR Code ─────────────────────────────────────────────────────────────────
function QRCodeSVG() {
  const cell = 9;
  const cols = 13;
  const size = cols * cell + 4;
  const data = [
    [8,0],[9,0],[11,0],[12,0],[8,1],[10,1],[12,1],[8,2],[9,2],[11,2],
    [8,3],[10,3],[11,3],[12,3],[9,4],[12,4],[8,5],[9,5],[11,5],[12,5],
    [0,8],[1,8],[3,8],[5,8],[6,8],[0,9],[2,9],[4,9],[6,9],
    [0,10],[1,10],[3,10],[5,10],[6,10],[0,11],[2,11],[4,11],[6,11],
    [1,12],[3,12],[5,12],[6,12],
    [8,8],[10,8],[12,8],[9,9],[11,9],[8,10],[9,10],[11,10],[12,10],
    [8,11],[10,11],[12,11],[8,12],[9,12],[10,12],[12,12],
  ];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
      <rect width={size} height={size} fill="#0C0B09" rx="4" />
      {[[0,0],[6*cell+4,0],[0,6*cell+4]].map(([cx,cy],i) => (
        <g key={i}>
          <rect x={cx+2} y={cy+2} width={7*cell} height={7*cell} rx="3"
            fill="rgba(199,154,61,0.08)" stroke="rgba(199,154,61,0.6)" strokeWidth="1" />
          <rect x={cx+2+2*cell} y={cy+2+2*cell} width={3*cell} height={3*cell} rx="1"
            fill="rgba(247,217,138,0.85)" />
        </g>
      ))}
      {data.map(([c,r],i) => (
        <rect key={i} x={c*cell+3} y={r*cell+3} width={cell-1} height={cell-1} rx="1"
          fill={`rgba(199,154,61,${0.55 + (i % 3) * 0.15})`} />
      ))}
    </svg>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────
function GoldBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 status-upcoming rounded-full sans ${className}`}
      style={{ fontSize: 9, letterSpacing: "0.12em" }}>
      {children}
    </span>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return <div className={`gold-divider ${className}`} />;
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-4 rounded-[18px] vip-card">
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="sans font-semibold" style={{ fontSize: 14, color: "#F5EDD6", lineHeight: 1.3 }}>{value}</span>
      <span className="sans uppercase" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.14em" }}>{label}</span>
    </div>
  );
}

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl vip-card" style={{ minWidth: 72 }}>
      <span className={`num font-semibold ${accent ? "gold-text" : ""}`}
        style={{ fontSize: 16, color: accent ? undefined : "#F5EDD6", lineHeight: 1 }}>
        {value}
      </span>
      <span className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.16em" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournCard({ t, onPress }: { t: typeof TOURN[0]; onPress: () => void }) {
  const pct = Math.round((t.reg / t.max) * 100);
  const seats = t.max - t.reg;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onPress}
      className="vip-card rounded-[22px] p-5 cursor-pointer card-pressed relative overflow-hidden"
      whileTap={{ scale: 0.984 }}
    >
      <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none rounded-[22px]" />

      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="serif font-semibold leading-snug" style={{ fontSize: 16, color: "#F5EDD6" }}>{t.name}</h3>
          <p className="sans mt-0.5" style={{ fontSize: 11, color: "#6B614E" }}>{t.sub}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full sans shrink-0 ${t.upcoming ? "status-upcoming" : "status-done"}`}
          style={{ fontSize: 9, letterSpacing: "0.08em" }}>
          {t.upcoming ? "Предстоящий" : "Завершён"}
        </span>
      </div>

      <Divider className="mb-3" />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.14em" }}>Взнос</p>
          <p className="gold-text-sm num font-semibold" style={{ fontSize: 13 }}>{t.buyIn}</p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.14em" }}>Дата</p>
          <p className="sans" style={{ fontSize: 11, color: "#D8CEBC" }}>{t.date}</p>
        </div>
        <div>
          <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.14em" }}>XP</p>
          <p className="gold-text-sm num font-semibold" style={{ fontSize: 13 }}>+{t.xp}</p>
        </div>
      </div>

      {t.upcoming && (
        <>
          <div className="flex justify-between mb-1.5">
            <span className="sans num" style={{ fontSize: 10, color: "#6B614E" }}>{t.reg} зарегистрировано</span>
            <span className="sans num" style={{ fontSize: 10, color: seats <= 3 ? "#C0392B" : "#6B614E" }}>
              {seats} {seats === 1 ? "место" : seats < 5 ? "места" : "мест"}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: "rgba(199,154,61,0.1)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              style={{ height: "100%", background: "linear-gradient(90deg, #9C6A1F, #C89A3D, #F7D98A)", borderRadius: 99 }}
            />
          </div>
        </>
      )}

      {!t.upcoming && (
        <div className="flex items-center justify-between">
          <span className="sans" style={{ fontSize: 11, color: "#6B614E" }}>Ваш результат</span>
          <span className="serif font-semibold" style={{ fontSize: 13, color: t.myResult?.startsWith("1") ? "#C89A3D" : "#F5EDD6" }}>
            {t.myResult}
          </span>
        </div>
      )}

      <div className="flex justify-end mt-2">
        <span style={{ color: "rgba(199,154,61,0.45)", fontSize: 17 }}>›</span>
      </div>
    </motion.div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ onTourn }: { onTourn: (id: number) => void }) {
  const xpPct = Math.round((P.xp / P.xpNext) * 100);
  const xpDisplay = useCountUp(P.xp);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const nextT = TOURN.find((t) => t.upcoming && t.mine)!;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="relative h-full overflow-hidden">

      {/* ── Rotating chip — full-screen background ── */}
      <div className="absolute pointer-events-none"
        style={{
          zIndex: 0,
          top: "50%",
          left: "50%",
          width: 500,
          height: 500,
          marginTop: -250,
          marginLeft: -250,
          transform: `translateY(${-scrollY * 0.25}px)`,
          transition: "transform 0.08s linear",
        }}>
        {/* Outer gold glow */}
        <div style={{
          position: "absolute", inset: 20,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(199,154,61,0.13) 0%, rgba(199,154,61,0.04) 50%, transparent 75%)",
          filter: "blur(8px)",
        }} />
        {/* The chip itself */}
        <div className="chip-spin" style={{ width: "100%", height: "100%", opacity: 0.22 }}>
          <PokerChipBg />
        </div>
      </div>

      {/* Subtle radial vignette so edges stay dark */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0,
        background: "radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(9,9,9,0.72) 80%)",
      }} />

      {/* ── Scrollable content ── */}
      <div ref={scrollRef} className="flex flex-col px-5 pb-6 gap-5 hs overflow-y-auto h-full"
        style={{ paddingTop: 52, position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-start justify-between">
          <div>
            <p className="sans" style={{ fontSize: 11, color: "#6B614E", letterSpacing: "0.06em" }}>Добрый вечер,</p>
            <h1 className="serif font-semibold" style={{ fontSize: 22, color: "#F5EDD6", lineHeight: 1.25, marginTop: 2 }}>{P.name}</h1>
            <div className="mt-2"><GoldBadge>{P.level}</GoldBadge></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo size="sm" />
            <div className="w-10 h-10 rounded-full flex items-center justify-center serif font-semibold"
              style={{ background: "linear-gradient(135deg, #9C6A1F, #C89A3D)", color: "#0A0A0A", fontSize: 14, marginTop: 4 }}>
              {P.initials}
            </div>
          </div>
        </motion.div>

        {/* Hero card */}
        <div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          onClick={() => onTourn(nextT.id)}
          className="float-hero vip-card-hero relative rounded-[22px] overflow-hidden cursor-pointer"
          whileTap={{ scale: 0.982 }}
        >
          <div className="absolute inset-0 deco-lines opacity-50 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(247,217,138,0.5), transparent)" }} />

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="status-upcoming rounded-full px-3 py-1 sans"
                style={{ fontSize: 9, letterSpacing: "0.1em" }}>● ПРЕДСТОЯЩИЙ</span>
              <span className="sans num" style={{ fontSize: 11, color: "#6B614E" }}>{nextT.time} · {nextT.date}</span>
            </div>

            <h2 className="serif font-semibold mb-1" style={{ fontSize: 23, lineHeight: 1.2, color: "#F5EDD6" }}>{nextT.name}</h2>
            <p className="sans mb-5" style={{ fontSize: 12, color: "#6B614E" }}>{nextT.sub}</p>

            <div className="flex gap-5 mb-5">
              <div>
                <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.16em" }}>Взнос</p>
                <p className="gold-text serif font-semibold num" style={{ fontSize: 20 }}>{nextT.buyIn}</p>
              </div>
              <div className="w-px" style={{ background: "rgba(199,154,61,0.2)" }} />
              <div>
                <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.16em" }}>Призовой фонд</p>
                <p className="serif font-semibold num" style={{ fontSize: 20, color: "#F5EDD6" }}>{nextT.pool}</p>
              </div>
              <div className="w-px" style={{ background: "rgba(199,154,61,0.2)" }} />
              <div>
                <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.16em" }}>XP</p>
                <p className="gold-text serif font-semibold num" style={{ fontSize: 20 }}>+{nextT.xp}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {["ДС", "МП", "НВ", "АВ", "СМ"].map((ini, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: "#111009",
                      background: i === 3 ? "linear-gradient(135deg,#9C6A1F,#C89A3D)" : "#2A2318",
                      color: i === 3 ? "#0A0A0A" : "#8A7A62",
                      fontSize: 8, fontFamily: "Inter,sans-serif", fontWeight: 500,
                    }}>
                    {ini}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center sans"
                  style={{ borderColor: "#111009", background: "#1C1812", color: "#6B614E", fontSize: 8 }}>
                  +{nextT.reg - 5}
                </div>
              </div>
              <span className="sans" style={{ fontSize: 11, color: "#C89A3D" }}>
                {nextT.max - nextT.reg} мест осталось →
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* XP Progress */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="vip-card rounded-[18px] p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.16em" }}>Прогресс уровня</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="gold-text serif font-semibold num" style={{ fontSize: 24 }}>
                {xpDisplay.toLocaleString("ru-RU")}
              </span>
              <span className="sans num" style={{ fontSize: 12, color: "#6B614E" }}>
                / {P.xpNext.toLocaleString("ru-RU")}
              </span>
            </div>
          </div>
          <GoldBadge>Ур. 4</GoldBadge>
        </div>
        <div className="rounded-full overflow-hidden mb-2" style={{ height: 4, background: "rgba(199,154,61,0.1)" }}>
          <div className="xp-grow rounded-full" style={{
            height: "100%", width: `${xpPct}%`,
            background: "linear-gradient(90deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)",
          }} />
        </div>
        <div className="flex justify-between">
          <span className="sans" style={{ fontSize: 9, color: "#6B614E" }}>Platinum Member</span>
          <span className="sans num" style={{ fontSize: 9, color: "#6B614E" }}>
            {(P.xpNext - P.xp).toLocaleString("ru-RU")} XP до Diamond
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Статистика сезона</p>
        <div className="grid grid-cols-4 gap-2">
          <StatPill label="Сыграно" value={P.played.toString()} />
          <StatPill label="Побед" value={P.wins.toString()} accent />
          <StatPill label="Место" value={`#${P.rank}`} accent />
          <StatPill label="Лучший" value="1-е" />
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
        <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Последние события</p>
        {TOURN.filter((t) => !t.upcoming).map((t, i) => (
          <div key={t.id} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t" : ""}`}
            style={{ borderColor: "rgba(199,154,61,0.1)" }}>
            <div>
              <p className="serif" style={{ fontSize: 14, color: "#F5EDD6", lineHeight: 1.35 }}>{t.name}</p>
              <p className="sans" style={{ fontSize: 10, color: "#6B614E" }}>{t.date}</p>
            </div>
            <div className="text-right">
              <p className="serif font-medium" style={{ fontSize: 13, color: t.myResult?.startsWith("1") ? "#C89A3D" : "#F5EDD6" }}>
                {t.myResult}
              </p>
              <p className="sans num" style={{ fontSize: 10, color: "#6B614E" }}>+{t.xp} XP</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col items-center gap-2 pt-2 pb-2">
        <Logo size="sm" />
        <p className="sans text-center" style={{ fontSize: 10, color: "#3E3428", letterSpacing: "0.06em" }}>
          Миллионная улица, 19 · Санкт-Петербург
        </p>
      </motion.div>
      </div>
    </div>
  );
}

// ─── TOURNAMENT DETAIL ────────────────────────────────────────────────────────
function TournamentDetail({ t, onBack, onNav }: {
  t: typeof TOURN[0]; onBack: () => void; onNav: (s: Screen) => void;
}) {
  const seats = t.max - t.reg;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full hs overflow-y-auto pb-6"
    >
      <div className="px-5 pt-14 pb-5 relative">
        <div className="absolute inset-0 deco-lines opacity-25 pointer-events-none" />
        <button onClick={onBack} className="flex items-center gap-1.5 mb-5 sans"
          style={{ color: "rgba(199,154,61,0.65)", fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>
          ← Назад
        </button>

        <span className={`rounded-full px-3 py-1 sans inline-flex mb-3 ${t.upcoming ? "status-upcoming" : "status-done"}`}
          style={{ fontSize: 9, letterSpacing: "0.1em" }}>
          {t.upcoming ? "● ПРЕДСТОЯЩИЙ" : "ЗАВЕРШЁН"}
        </span>

        <h1 className="serif font-semibold mt-2 mb-1" style={{ fontSize: 26, lineHeight: 1.15, color: "#F5EDD6" }}>{t.name}</h1>
        <p className="sans mb-1" style={{ fontSize: 13, color: "#6B614E" }}>{t.sub}</p>
        <p className="sans num" style={{ fontSize: 12, color: "#6B614E" }}>{t.date} · {t.time}</p>
      </div>

      <Divider className="mx-5" />

      <div className="px-5 pt-5 grid grid-cols-2 gap-3">
        <InfoCard label="Взнос" value={t.buyIn} icon="💎" />
        <InfoCard label="XP-награда" value={`+${t.xp} XP`} icon="⭐" />
        <InfoCard label="Игроки" value={`${t.reg} / ${t.max}`} icon="👥" />
        <InfoCard label="Мест осталось" value={seats.toString()} icon={seats <= 3 ? "🔴" : "🟢"} />
      </div>

      {t.upcoming && (
        <div className="px-5 mt-4">
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: "rgba(199,154,61,0.1)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((t.reg / t.max) * 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #9C6A1F, #C89A3D, #F7D98A)", borderRadius: 99 }} />
          </div>
        </div>
      )}

      <div className="px-5 mt-5">
        <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>О турнире</p>
        <p className="serif" style={{ fontSize: 15, color: "#C0B49A", lineHeight: 1.7 }}>{t.desc}</p>
      </div>

      <Divider className="mx-5 mt-5" />

      {t.structure && (
        <div className="px-5 mt-5">
          <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Структура</p>
          {[
            { label: "Формат", value: t.structure },
            { label: "Уровни блайндов", value: t.blinds },
            { label: "Стартовый стек", value: `${t.stack} фишек` },
            { label: "Призовой фонд", value: t.pool },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between py-3 ${i > 0 ? "border-t" : ""}`}
              style={{ borderColor: "rgba(199,154,61,0.1)" }}>
              <span className="sans" style={{ fontSize: 12, color: "#6B614E" }}>{row.label}</span>
              <span className="serif" style={{ fontSize: 13, color: "#F5EDD6" }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {t.upcoming && !t.mine && (
        <div className="px-5 mt-6">
          <button className="btn-shine w-full py-4 rounded-[18px] serif font-semibold tracking-widest"
            style={{
              background: "linear-gradient(135deg, #9C6A1F 0%, #C89A3D 40%, #F7D98A 70%, #C89A3D 100%)",
              color: "#0A0A0A", fontSize: 13, letterSpacing: "0.16em",
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 28px rgba(156,106,31,0.4)",
            }}>
            ЗАРЕГИСТРИРОВАТЬСЯ — {t.buyIn}
          </button>
          <p className="sans text-center mt-2.5" style={{ fontSize: 10, color: "#6B614E" }}>
            Регистрация закрывается за 2 часа до начала
          </p>
        </div>
      )}

      {t.mine && (
        <div className="px-5 mt-6">
          <button onClick={() => onNav("myTournament")} className="btn-shine w-full py-4 rounded-[18px] serif font-semibold tracking-widest"
            style={{
              background: "linear-gradient(135deg, #9C6A1F 0%, #C89A3D 40%, #F7D98A 70%, #C89A3D 100%)",
              color: "#0A0A0A", fontSize: 13, letterSpacing: "0.16em",
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 28px rgba(156,106,31,0.4)",
            }}>
            МОЙ БИЛЕТ
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────
function TournamentsScreen({ onDetail }: { onDetail: (id: number) => void }) {
  const [tab, setTab] = useState<TournTab>("upcoming");
  const [search, setSearch] = useState("");
  const visible = TOURN.filter((t) =>
    t.upcoming === (tab === "upcoming") &&
    (search === "" || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4 mb-4" style={{ fontSize: 24, color: "#F5EDD6" }}>Турниры</h2>

        <div className="relative mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск турниров..."
            className="w-full py-3 px-4 rounded-[14px] sans outline-none"
            style={{
              background: "#181410",
              border: "1px solid rgba(199,154,61,0.2)",
              color: "#F5EDD6", fontSize: 13,
              caretColor: "#C89A3D",
            }}
          />
        </div>

        <div className="flex rounded-[14px] p-1 gap-1" style={{ background: "#0F0D09", border: "1px solid rgba(199,154,61,0.15)" }}>
          {(["upcoming", "completed"] as const).map((tab_id) => (
            <button key={tab_id} onClick={() => setTab(tab_id)}
              className="flex-1 py-2.5 rounded-[10px] sans font-medium transition-all duration-300"
              style={{
                fontSize: 12, cursor: "pointer", border: "none",
                background: tab === tab_id ? "linear-gradient(135deg, #9C6A1F, #C89A3D)" : "transparent",
                color: tab === tab_id ? "#0A0A0A" : "#6B614E",
              }}>
              {tab_id === "upcoming" ? "Предстоящие" : "Прошедшие"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 flex flex-col gap-3 hs overflow-y-auto">
        {visible.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}>
            <TournCard t={t} onPress={() => onDetail(t.id)} />
          </motion.div>
        ))}
        {visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span style={{ fontSize: 32, opacity: 0.25 }}>♠</span>
            <p className="serif" style={{ fontSize: 16, color: "#6B614E" }}>Турниры не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RATING ───────────────────────────────────────────────────────────────────
function RatingScreen() {
  const top3 = RATINGS.slice(0, 3);
  const rest = RATINGS.slice(3);
  const medalColors = ["#C89A3D", "#9A9A9A", "#B87040"];
  const medals = ["🥇", "🥈", "🥉"];
  const order = [1, 0, 2];

  return (
    <div className="flex flex-col h-full hs overflow-y-auto">
      <div className="px-5 pt-14 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4" style={{ fontSize: 24, color: "#F5EDD6" }}>Рейтинг клуба</h2>
        <p className="sans mt-1" style={{ fontSize: 12, color: "#6B614E" }}>Таблица лидеров сезона 2026</p>
      </div>

      {/* Podium */}
      <div className="px-5 mb-5">
        <div className="vip-card rounded-[22px] overflow-hidden relative pt-6 pb-4">
          <div className="absolute inset-0 deco-lines opacity-40" />
          <div className="flex items-end justify-center gap-3 px-4 relative">
            {order.map((idx) => {
              const p = top3[idx];
              const heights = [90, 68, 52];
              return (
                <motion.div key={p.r} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center serif font-semibold text-base mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${medalColors[idx]}22, ${medalColors[idx]}44)`,
                      border: `2px solid ${medalColors[idx]}`,
                      color: medalColors[idx],
                      boxShadow: idx === 0 ? `0 0 18px rgba(199,154,61,0.22)` : "none",
                    }}>
                    {p.ini}
                  </div>
                  <span style={{ fontSize: 15 }}>{medals[idx]}</span>
                  <p className="serif font-medium text-center mt-1 leading-snug" style={{ fontSize: 11, color: "#F5EDD6" }}>{p.name}</p>
                  <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 12 }}>
                    {p.xp.toLocaleString("ru-RU")}
                  </p>
                  <div className="w-full rounded-t-lg mt-2 flex items-center justify-center"
                    style={{
                      height: heights[idx],
                      background: `linear-gradient(180deg, ${medalColors[idx]}20, ${medalColors[idx]}06)`,
                      border: `1px solid ${medalColors[idx]}35`,
                      borderBottom: "none",
                    }}>
                    <span className="serif font-bold" style={{ fontSize: 24, color: `${medalColors[idx]}55` }}>
                      {idx + 1}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="px-5 pb-6 flex flex-col gap-2">
        <p className="sans uppercase mb-2" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Полная таблица</p>
        {rest.map((p, i) => (
          <motion.div key={p.r} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`flex items-center gap-3 p-4 rounded-[16px] ${p.me ? "pulse-glow" : ""}`}
            style={{
              background: p.me ? "linear-gradient(135deg, #1E1A0F 0%, #17130A 100%)" : "#141210",
              border: p.me ? "1px solid rgba(199,154,61,0.45)" : "1px solid rgba(199,154,61,0.12)",
            }}>
            <span className="num serif font-bold w-6 text-center" style={{ fontSize: 14, color: p.me ? "#C89A3D" : "#3E3428" }}>
              {p.r}
            </span>
            <div className="w-9 h-9 rounded-full flex items-center justify-center serif font-semibold"
              style={{
                background: p.me ? "linear-gradient(135deg, #9C6A1F, #C89A3D)" : "#221E16",
                color: p.me ? "#0A0A0A" : "#8A7A62", fontSize: 12,
              }}>
              {p.ini}
            </div>
            <div className="flex-1 min-w-0">
              <p className="serif font-medium" style={{ fontSize: 14, color: "#F5EDD6", lineHeight: 1.3 }}>{p.name}</p>
              <p className="sans" style={{ fontSize: 10, color: "#6B614E" }}>{p.badge}</p>
            </div>
            <div className="text-right">
              <p className="gold-text-sm num sans font-semibold" style={{ fontSize: 13 }}>
                {p.xp.toLocaleString("ru-RU")}
              </p>
              <p className="sans num" style={{ fontSize: 9, color: "#6B614E" }}>{p.wins} побед</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── MY TOURNAMENT ────────────────────────────────────────────────────────────
function MyTournamentScreen() {
  const t = TOURN.find((x) => x.mine)!;
  const { d, h, m, s } = useCountdown(t.target!);
  const [showQR, setShowQR] = useState(false);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col h-full hs overflow-y-auto">
      <div className="px-5 pt-14 pb-4">
        <Logo size="sm" />
        <h2 className="serif font-semibold mt-4" style={{ fontSize: 24, color: "#F5EDD6" }}>Мой турнир</h2>
      </div>

      <div className="px-5 pb-6 flex flex-col gap-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="vip-card-hero rounded-[22px] overflow-hidden relative">
          <div className="absolute inset-0 deco-lines opacity-40 pointer-events-none" />
          <div className="p-6">
            <GoldBadge>Зарегистрирован ✓</GoldBadge>
            <h3 className="serif font-semibold mt-3 mb-1" style={{ fontSize: 21, color: "#F5EDD6" }}>{t.name}</h3>
            <p className="sans num mb-5" style={{ fontSize: 12, color: "#6B614E" }}>{t.date} · {t.time}</p>

            {/* Countdown */}
            <div className="flex gap-3 justify-center">
              {[{ v: d, l: "ДН" }, { v: h, l: "Ч" }, { v: m, l: "МИН" }, { v: s, l: "СЕК" }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center gap-1.5">
                  <div className="rounded-[12px] flex items-center justify-center"
                    style={{
                      width: 58, height: 58,
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(199,154,61,0.28)",
                    }}>
                    <span className="num serif font-bold ticker-glow" style={{ fontSize: 26, color: "#C89A3D", lineHeight: 1 }}>
                      {pad(v)}
                    </span>
                  </div>
                  <span className="sans num" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.12em" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* QR button */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <AnimatePresence mode="wait">
            {!showQR ? (
              <motion.button key="btn" exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => setShowQR(true)}
                className="btn-shine w-full py-5 rounded-[22px] flex flex-col items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #9C6A1F 0%, #C89A3D 40%, #F7D98A 70%, #C89A3D 100%)",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 6px 32px rgba(156,106,31,0.45)",
                }}>
                <span style={{ fontSize: 26 }}>📱</span>
                <span className="serif font-semibold tracking-widest" style={{ fontSize: 13, color: "#0A0A0A", letterSpacing: "0.18em" }}>
                  ПОКАЗАТЬ QR-БИЛЕТ
                </span>
                <span className="sans" style={{ fontSize: 10, color: "rgba(10,10,10,0.55)" }}>
                  Предъявите на входе в клуб
                </span>
              </motion.button>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="vip-card rounded-[22px] p-6 flex flex-col items-center gap-4">
                <Logo size="sm" />
                <p className="serif mt-1" style={{ fontSize: 16, color: "#F5EDD6" }}>{t.name}</p>
                <p className="sans num" style={{ fontSize: 11, color: "#6B614E" }}>{t.date} · {t.time}</p>
                <div className="rounded-[16px] overflow-hidden p-3"
                  style={{ background: "#0C0B09", border: "1px solid rgba(199,154,61,0.3)", width: 180, height: 180 }}>
                  <QRCodeSVG />
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.14em" }}>Стол</p>
                    <p className="gold-text serif font-semibold num" style={{ fontSize: 22 }}>{t.table}</p>
                  </div>
                  <div className="w-px" style={{ background: "rgba(199,154,61,0.2)" }} />
                  <div className="text-center">
                    <p className="sans uppercase" style={{ fontSize: 8, color: "#6B614E", letterSpacing: "0.14em" }}>Место</p>
                    <p className="gold-text serif font-semibold num" style={{ fontSize: 22 }}>{t.seat}</p>
                  </div>
                </div>
                <button onClick={() => setShowQR(false)} className="sans"
                  style={{ fontSize: 11, color: "rgba(199,154,61,0.55)", background: "none", border: "none", cursor: "pointer" }}>
                  Закрыть
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="vip-card rounded-[22px] p-5">
          <p className="sans uppercase mb-4" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Расписание</p>
          {[
            { label: "Регистрация", time: "17:00", done: true },
            { label: "Регистрация игроков", time: "18:30", done: false },
            { label: "Начало турнира", time: "19:00", done: false },
            { label: "Первый перерыв", time: "21:00", done: false },
            { label: "Финальный стол", time: "23:00+", done: false },
          ].map((ev, i, arr) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="flex flex-col items-center" style={{ width: 12 }}>
                <div className="w-3 h-3 rounded-full"
                  style={{
                    background: ev.done ? "linear-gradient(135deg,#9C6A1F,#C89A3D)" : "rgba(199,154,61,0.18)",
                    border: ev.done ? "none" : "1px solid rgba(199,154,61,0.3)",
                    flexShrink: 0,
                  }} />
                {i < arr.length - 1 && <div style={{ width: 1, height: 18, background: "rgba(199,154,61,0.12)", marginTop: 2 }} />}
              </div>
              <div className="flex-1 flex justify-between py-1">
                <span className="sans" style={{ fontSize: 12, color: ev.done ? "#C89A3D" : "#C0B49A" }}>{ev.label}</span>
                <span className="sans num" style={{ fontSize: 12, color: "#6B614E" }}>{ev.time}</span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 gap-3">
          <InfoCard label="Взнос оплачен" value={t.buyIn} icon="✅" />
          <InfoCard label="Призовой фонд" value={t.pool} icon="🏆" />
          <InfoCard label="Стартовый стек" value={`${t.stack} ф.`} icon="🎰" />
          <InfoCard label="Блайнды" value={t.blinds} icon="⏱" />
        </motion.div>
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfileScreen() {
  const xpPct = Math.round((P.xp / P.xpNext) * 100);

  return (
    <div className="flex flex-col h-full hs overflow-y-auto">
      <div className="relative px-5 pt-14 pb-8 flex flex-col items-center gap-3"
        style={{
          background: "linear-gradient(180deg, #181309 0%, #090909 100%)",
          borderBottom: "1px solid rgba(199,154,61,0.12)",
        }}>
        <div className="absolute inset-0 deco-lines opacity-45 pointer-events-none" />
        <Logo size="md" />

        <div className="relative mt-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center serif font-semibold"
            style={{
              background: "linear-gradient(135deg, #9C6A1F 0%, #C89A3D 50%, #F7D98A 100%)",
              color: "#0A0A0A", fontSize: 22,
              boxShadow: "0 0 0 3px rgba(199,154,61,0.18), 0 0 32px rgba(156,106,31,0.28)",
            }}>
            {P.initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center sans"
            style={{ background: "linear-gradient(135deg,#9C6A1F,#C89A3D)", fontSize: 11, color: "#0A0A0A" }}>✓</div>
        </div>

        <div className="text-center">
          <h2 className="serif font-semibold" style={{ fontSize: 21, color: "#F5EDD6", lineHeight: 1.2 }}>{P.name}</h2>
          <GoldBadge className="mt-2">{P.level}</GoldBadge>
          <p className="sans mt-2" style={{ fontSize: 11, color: "#6B614E" }}>В клубе с {P.since}</p>
        </div>

        <div className="w-full mt-1">
          <div className="flex justify-between mb-1.5">
            <span className="sans num" style={{ fontSize: 9, color: "#6B614E" }}>{P.xp.toLocaleString("ru-RU")} XP</span>
            <span className="sans num" style={{ fontSize: 9, color: "#6B614E" }}>{P.xpNext.toLocaleString("ru-RU")} XP</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(199,154,61,0.1)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              style={{ height: "100%", background: "linear-gradient(90deg,#9C6A1F,#C89A3D,#F7D98A)", borderRadius: 99 }} />
          </div>
          <p className="sans num mt-1.5 text-center" style={{ fontSize: 9, color: "rgba(199,154,61,0.5)" }}>
            {(P.xpNext - P.xp).toLocaleString("ru-RU")} XP до Diamond Member
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        <div>
          <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Статистика</p>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Турниры" value={P.played.toString()} icon="🃏" />
            <InfoCard label="Победы" value={P.wins.toString()} icon="🏆" />
            <InfoCard label="Выигрыш" value={P.winnings} icon="💰" />
            <InfoCard label="Лучший результат" value={P.best} icon="⭐" />
          </div>
        </div>

        <div>
          <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>История</p>
          {TOURN.filter((t) => !t.upcoming).map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t" : ""}`}
              style={{ borderColor: "rgba(199,154,61,0.1)" }}>
              <div>
                <p className="serif" style={{ fontSize: 14, color: "#F5EDD6", lineHeight: 1.35 }}>{t.name}</p>
                <p className="sans num" style={{ fontSize: 10, color: "#6B614E" }}>{t.date} · {t.buyIn}</p>
              </div>
              <div className="text-right">
                <p className="serif font-medium" style={{ fontSize: 13, color: t.myResult?.startsWith("1") ? "#C89A3D" : "#F5EDD6" }}>
                  {t.myResult}
                </p>
                {t.myWinnings !== "—" && (
                  <p className="gold-text-sm num sans" style={{ fontSize: 10 }}>{t.myWinnings}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Membership card */}
        <div>
          <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Карта участника</p>
          <div className="vip-card-hero rounded-[22px] overflow-hidden relative" style={{ aspectRatio: "1.6" }}>
            <div className="absolute inset-0 deco-lines opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(247,217,138,0.4),transparent)" }} />
            <div className="p-6 h-full flex flex-col justify-between relative">
              <div className="flex justify-between items-start">
                <Logo size="sm" />
                <GoldBadge>Platinum</GoldBadge>
              </div>
              <div>
                <p className="sans uppercase mb-1" style={{ fontSize: 8, color: "rgba(199,154,61,0.55)", letterSpacing: "0.18em" }}>Участник</p>
                <p className="serif font-semibold" style={{ fontSize: 17, color: "#F5EDD6" }}>{P.name}</p>
                <div className="flex justify-between items-end mt-2">
                  <p className="sans" style={{ fontSize: 10, color: "#6B614E" }}>В клубе с {P.since}</p>
                  <p className="sans" style={{ fontSize: 10, color: "#6B614E" }}>Миллионная, 19</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <p className="sans uppercase mb-3" style={{ fontSize: 9, color: "#6B614E", letterSpacing: "0.18em" }}>Настройки</p>
          {[
            { icon: "🔔", label: "Уведомления" },
            { icon: "🌐", label: "Язык" },
            { icon: "🔒", label: "Конфиденциальность" },
            { icon: "📞", label: "Связаться с клубом" },
          ].map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-3.5 ${i > 0 ? "border-t" : ""}`}
              style={{ borderColor: "rgba(199,154,61,0.1)", cursor: "pointer" }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span className="sans" style={{ fontSize: 14, color: "#F5EDD6" }}>{item.label}</span>
              </div>
              <span style={{ color: "rgba(199,154,61,0.35)", fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 py-4">
          <Logo size="sm" />
          <p className="sans text-center" style={{ fontSize: 10, color: "#3E3428" }}>Версия 1.0 · GUTSHOT Poker Club</p>
        </div>
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV: { id: Screen; label: string; path: string }[] = [
  { id: "home", label: "Главная", path: "M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" },
  { id: "tournaments", label: "Турниры", path: "" },
  { id: "rating", label: "Рейтинг", path: "" },
  { id: "myTournament", label: "Мой турнир", path: "" },
  { id: "profile", label: "Профиль", path: "" },
];

function NavIcon({ id, active }: { id: Screen; active: boolean }) {
  const c = active ? "url(#navGrad)" : "#3E3428";
  const w = 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      className={active ? "nav-active-glow" : ""}>
      <defs>
        <linearGradient id="navGrad" x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#9C6A1F" /><stop offset="0.5" stopColor="#F7D98A" /><stop offset="1" stopColor="#9C6A1F" />
        </linearGradient>
      </defs>

      {id === "home" && (
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? "url(#navGrad)" : "none"} stroke={active ? "none" : c} strokeWidth={w} />
      )}
      {id === "tournaments" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth={w} fill="none" />
          <line x1="3" y1="9" x2="21" y2="9" stroke={c} strokeWidth={w} />
          <line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth={w} strokeLinecap="round" />
          <line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth={w} strokeLinecap="round" />
          {active && <rect x="7" y="13" width="3" height="3" rx="0.5" fill="url(#navGrad)" />}
        </>
      )}
      {id === "rating" && (
        <>
          <rect x="2" y="14" width="5" height="8" rx="1" fill={active ? "url(#navGrad)" : "none"} stroke={active ? "none" : c} strokeWidth={w} />
          <rect x="9.5" y="9" width="5" height="13" rx="1" fill={active ? "url(#navGrad)" : "none"} stroke={active ? "none" : c} strokeWidth={w} />
          <rect x="17" y="4" width="5" height="18" rx="1" fill={active ? "url(#navGrad)" : "none"} stroke={active ? "none" : c} strokeWidth={w} />
        </>
      )}
      {id === "myTournament" && (
        <path d="M12 2L15.5 9L23 10.3L17.5 15.6L18.9 23L12 19.3L5.1 23L6.5 15.6L1 10.3L8.5 9L12 2Z"
          fill={active ? "url(#navGrad)" : "none"} stroke={active ? "none" : c} strokeWidth={w} />
      )}
      {id === "profile" && (
        <>
          <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={w} fill="none" />
          <path d="M4 20C4 17 7.6 15 12 15C16.4 15 20 17 20 20" stroke={c} strokeWidth={w} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [detailId, setDetailId] = useState<number | null>(null);

  const openDetail = (id: number) => { setDetailId(id); setScreen("tournaments"); };
  const navTo = (s: Screen) => { setDetailId(null); setScreen(s); };
  const detail = detailId !== null ? TOURN.find((t) => t.id === detailId) ?? null : null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="sans flex justify-center min-h-screen" style={{ background: "#000", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="relative flex flex-col overflow-hidden"
          style={{ width: "100%", maxWidth: 430, minHeight: "100dvh", background: "#090909" }}>

          {/* Background */}
          <div className="absolute inset-0 deco-lines pointer-events-none" style={{ zIndex: 0 }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(156,106,31,0.06) 0%, transparent 60%)" }} />

          {/* Screens */}
          <div className="flex-1 relative" style={{ zIndex: 1, paddingBottom: 72, overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              {screen === "home" && (
                <motion.div key="home" className="absolute inset-0"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <HomeScreen onTourn={openDetail} />
                </motion.div>
              )}
              {screen === "tournaments" && !detail && (
                <motion.div key="tournaments" className="absolute inset-0"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <TournamentsScreen onDetail={openDetail} />
                </motion.div>
              )}
              {screen === "tournaments" && detail && (
                <motion.div key={`d${detail.id}`} className="absolute inset-0"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}>
                  <TournamentDetail t={detail} onBack={() => setDetailId(null)} onNav={navTo} />
                </motion.div>
              )}
              {screen === "rating" && (
                <motion.div key="rating" className="absolute inset-0"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <RatingScreen />
                </motion.div>
              )}
              {screen === "myTournament" && (
                <motion.div key="myTournament" className="absolute inset-0"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <MyTournamentScreen />
                </motion.div>
              )}
              {screen === "profile" && (
                <motion.div key="profile" className="absolute inset-0"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <ProfileScreen />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-1"
            style={{
              zIndex: 10,
              height: 68,
              background: "rgba(9,9,9,0.97)",
              backdropFilter: "blur(24px)",
              borderTop: "1px solid rgba(199,154,61,0.15)",
              paddingBottom: "max(4px, env(safe-area-inset-bottom))",
            }}>
            {NAV.map((item) => {
              const active = screen === item.id;
              return (
                <button key={item.id} onClick={() => navTo(item.id)}
                  className="flex flex-col items-center gap-1 py-2 px-2 transition-all duration-300"
                  style={{ background: "none", border: "none", cursor: "pointer", minWidth: 52 }}>
                  <motion.div animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}>
                    <NavIcon id={item.id} active={active} />
                  </motion.div>
                  <span className="sans" style={{
                    fontSize: 9,
                    color: active ? "#C89A3D" : "#3E3428",
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                  }}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.div layoutId="navDot" className="rounded-full"
                      style={{ width: 3, height: 3, background: "linear-gradient(135deg,#9C6A1F,#F7D98A)" }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
