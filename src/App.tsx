import { useEffect, useMemo, useRef, useState } from "react";
import { AccountAccess, BusinessModel, type Account } from "./ProductPages";
import { FamilyView, ProgressView } from "./PersonalViews";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Dna,
  Flame,
  Heart,
  Home,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Sparkles,
  Sun,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  careerCatalog,
  seedTasks,
  successOptions,
  type StudyTask,
  type Subject,
} from "./data";

type Page =
  | "dashboard"
  | "planner"
  | "wellbeing"
  | "progress"
  | "careers"
  | "parent"
  | "success"
  | "about"
  | "business"
  | "account"
  | "settings";
type Checkin = {
  stress: number;
  energy: number;
  sleep: number;
  confidence: number;
  guilt: string;
  date: string;
};
const KEY = "pathwise-v1";
const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "planner", label: "My plan", icon: CalendarDays },
  { id: "wellbeing", label: "Wellbeing", icon: Heart },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "careers", label: "Career paths", icon: Compass },
  { id: "parent", label: "Parent view", icon: Users },
  { id: "success", label: "My success", icon: Sparkles },
  { id: "about", label: "Why PATHWISE?", icon: CircleHelp },
  { id: "business", label: "Business model", icon: BriefcaseBusiness },
];
const initial = {
  tasks: [],
  checkins: [] as Checkin[],
  interests: [],
  success: [] as string[],
  showRank: false,
  mode: "student" as "student" | "parent",
  planner: {
    exam: "",
    examDate: "",
    hours: 4,
    energy: "Medium",
    weak: [] as string[],
    strong: [] as string[],
  },
};
type Store = typeof initial;
function isStarterTasks(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== seedTasks.length) return false;
  return value.every((task, index) => task?.id === seedTasks[index].id && task?.title === seedTasks[index].title && task?.time === seedTasks[index].time);
}
function isStarterInterests(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2 && value[0] === "Technology" && value[1] === "Mathematics";
}
function isStarterPlanner(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const planner = value as Partial<Store["planner"]>;
  return planner.exam === "JEE" && planner.examDate === "2027-04-05" && planner.hours === 5.5 && Array.isArray(planner.weak) && planner.weak.length === 1 && planner.weak[0] === "Physics" && Array.isArray(planner.strong) && planner.strong.length === 1 && planner.strong[0] === "Mathematics";
}
function mergePlanner(value: Partial<Store["planner"]> | undefined) {
  return isStarterPlanner(value) ? initial.planner : { ...initial.planner, ...value };
}
function loadStore(): Store {
  try {
    const saved = JSON.parse(
      localStorage.getItem(KEY) || "{}",
    ) as Partial<Store>;
    return {
      ...initial,
      ...saved,
      tasks: isStarterTasks(saved.tasks) ? [] : (saved.tasks ?? initial.tasks),
      interests: isStarterInterests(saved.interests) ? [] : (saved.interests ?? initial.interests),
      planner: mergePlanner(saved.planner),
    };
  } catch {
    return initial;
  }
}
function saveStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [page, setPage] = useState<Page | "landing">("landing");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);
  const [whatIf, setWhatIf] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const syncTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me").then(async (response) => {
      if (!response.ok) return;
      const result = await response.json();
      const saved = await fetch("/api/state");
      if (!active) return;
      setAccount(result.user);
      if (saved.ok) {
        const remote = await saved.json();
        setStore((current) => ({ ...current, ...remote, tasks: isStarterTasks(remote.tasks) ? [] : (remote.tasks ?? current.tasks), interests: isStarterInterests(remote.interests) ? [] : (remote.interests ?? current.interests), checkins: current.checkins, planner: mergePlanner(remote.planner) }));
      }
    }).catch(() => {}).finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!authReady) return;
    saveStore(store);
    if (account) {
      window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        const { checkins: _privateCheckins, ...accountState } = store;
        fetch("/api/state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(accountState) }).catch(() => {});
      }, 500);
    }
    return () => window.clearTimeout(syncTimer.current);
  }, [store, account, authReady]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const handler = (event: Event) => {
      const page = (event as CustomEvent<Page>).detail;
      if (page) navigate(page);
    };
    window.addEventListener("pathwise-navigate", handler);
    return () => window.removeEventListener("pathwise-navigate", handler);
  }, []);
  const update = (patch: Partial<Store>) =>
    setStore((s) => ({ ...s, ...patch }));
  const navigate = (id: Page | "landing") => {
    setPage(id);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleMode = () => {
    const next = store.mode === "student" ? "parent" : "student";
    update({ mode: next });
    setPage(next === "parent" ? "parent" : "dashboard");
    setToast(`${next === "parent" ? "Parent" : "Student"} view is on`);
  };

  const finishAuth = async (user: Account) => {
    setAuthReady(false);
    const response = await fetch("/api/state");
    if (response.ok) {
      const remote = await response.json();
      if (Object.keys(remote).length) setStore((current) => ({ ...current, ...remote, tasks: isStarterTasks(remote.tasks) ? [] : (remote.tasks ?? current.tasks), interests: isStarterInterests(remote.interests) ? [] : (remote.interests ?? current.interests), checkins: current.checkins, planner: mergePlanner(remote.planner) }));
    }
    setAccount(user);
    setAuthReady(true);
    navigate("dashboard");
    setToast(`Welcome, ${user.name.split(" ")[0]}. Your account is connected.`);
  };

  if (page === "landing")
    return (
      <Landing
        onStart={() => navigate("dashboard")}
        onHow={() => navigate("about")}
        onSignIn={() => navigate("account")}
      />
    );
  return (
    <div className={dark ? "app dark" : "app"}>
      <Sidebar
        active={page}
        onNavigate={navigate}
        mode={store.mode}
        onMode={toggleMode}
        onLanding={() => navigate("landing")}
        mobile={mobileNav}
        onClose={() => setMobileNav(false)}
        account={account}
      />
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={19} />
          </button>
          <div className="crumb">
            <span>PATHWISE</span>
            <ChevronRight size={13} />
            {pageTitle(page)}
          </div>
          <div className="top-actions">
            <button
              className="today-pill"
              onClick={() => setToast("You’re viewing your plan for today.")}
            >
              <span className="live-dot" /> Today, {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
              <ChevronDown size={13} />
            </button>
            <button
              className="icon-button theme-button"
              onClick={() => setDark((v) => !v)}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="avatar" aria-label={account ? `${account.name}'s profile` : "Your profile"}>
              {account?.name?.trim()?.charAt(0).toUpperCase() || "?"}
            </button>
          </div>
        </header>
        <div key={page} className="page-content">
          {page === "dashboard" && (
            <Dashboard
              store={store}
              update={update}
              navigate={navigate}
              toast={setToast}
              studentName={account?.name || "there"}
            />
          )}
          {page === "planner" && (
            <Planner store={store} update={update} toast={setToast} />
          )}
          {page === "wellbeing" && (
            <Wellbeing store={store} update={update} toast={setToast} />
          )}
          {page === "progress" && <ProgressView tasks={store.tasks} checkins={store.checkins} />}
          {page === "careers" && (
            <Careers
              store={store}
              update={update}
              whatIf={whatIf}
              setWhatIf={setWhatIf}
            />
          )}
          {page === "parent" && <FamilyView tasks={store.tasks} studentName={account?.name || "Student"} />}
          {page === "success" && <Success store={store} update={update} />}
          {page === "about" && <About />}
          {page === "business" && <BusinessModel />}
          {page === "account" && <AccountAccess onComplete={finishAuth} onBack={() => navigate("dashboard")} />}
          {page === "settings" && (
            <Settings
              store={store}
              update={update}
              dark={dark}
              setDark={setDark}
              toast={setToast}
              account={account}
              onSignIn={() => navigate("account")}
              onSignOut={async () => { await fetch("/api/auth/logout", { method: "POST" }); setAccount(null); setToast("You are signed out. This device still has its local data."); }}
            />
          )}
        </div>
      </main>
      {mobileNav && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function pageTitle(page: string) {
  return (
    navItems.find((n) => n.id === page)?.label ||
    (page === "settings" ? "Settings" : page === "account" ? "Account" : "PATHWISE")
  );
}
function durationMinutes(duration: string) {
  const hours = Number(duration.match(/(\d+)\s*h/)?.[1] || 0);
  const minutes = Number(duration.match(/(\d+)\s*m(?:in)?/)?.[1] || 0);
  return hours * 60 + minutes;
}
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}h ` : ""}${rest ? `${rest}m` : ""}`.trim() || "0m";
}
function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button className="brand" onClick={onClick}>
      <span className="brand-mark">
        <span />
      </span>
      <span>
        pathwise<span className="brand-period">.</span>
      </span>
    </button>
  );
}

function Landing({
  onStart,
  onHow,
  onSignIn,
}: {
  onStart: () => void;
  onHow: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Brand
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <div className="landing-links">
          <button onClick={onHow}>Our approach</button>
          <button onClick={onHow}>For families</button>
          <button onClick={onHow}>Why PATHWISE</button>
        </div>
        <button className="button button-dark landing-signin" onClick={onSignIn}>
          Sign in <ArrowRight size={16} />
        </button>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" /> A calmer way to prepare
          </div>
          <h1>
            Your future is
            <br />
            bigger than your{" "}
            <span className="rank-word">
              rank<span className="rank-spark">✳</span>
            </span>
          </h1>
          <p className="hero-lede">
            Prepare smarter. Protect your wellbeing. See more than one path
            forward.
          </p>
          <div className="hero-ctas">
            <button className="button button-dark button-lg" onClick={onStart}>
              Build my path <ArrowRight size={17} />
            </button>
            <button className="button button-quiet button-lg" onClick={onHow}>
              <span className="play-icon">▷</span> See how it works
            </button>
          </div>
          <div className="hero-note">
            <span className="avatar-stack">
              <i>A</i>
              <i>R</i>
              <i>M</i>
            </span>
            <span>
              Built around real student experiences
              <br />
              <b>Made for the whole journey</b>
            </span>
          </div>
        </div>
        <div
          className="hero-product"
          aria-label="Preview of PATHWISE student dashboard"
        >
          <div className="product-glow" />
          <div className="preview-window">
            <div className="preview-top">
              <div className="preview-brand">
                <span className="mini-mark" /> pathwise
              </div>
              <span className="preview-date">WORKSPACE PREVIEW</span>
              <span className="preview-avatar">A</span>
            </div>
            <div className="preview-body">
              <div className="preview-welcome">
                <div>
                  <small>YOUR WEDNESDAY, IN FOCUS</small>
                  <h3>
                    Good morning, there<span>.</span>
                  </h3>
                  <p>Make room for progress and a little breathing space.</p>
                </div>
                <span className="sun-icon">
                  <Sun size={19} />
                </span>
              </div>
              <div className="preview-stats">
                <div className="preview-stat">
                  <small>YOUR STUDY PLAN</small>
                  <strong>Ready when you are</strong>
                  <p>Choose an exam and build your first plan.</p>
                </div>
                <div className="preview-stat readiness-stat">
                  <small>YOUR CHECK-IN</small>
                  <strong>Private to you</strong>
                  <p>Your wellbeing entries stay on this device.</p>
                </div>
              </div>
              <div className="preview-insight">
                <div className="insight-icon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <small>A GENTLE NUDGE</small>
                  <p>
                    Build a plan around the time and energy you have. PATHWISE will show progress as you save and complete your own study blocks.
                  </p>
                </div>
                <ArrowUpRight size={15} />
              </div>
              <div className="preview-agenda">
                <div>
                  <b>Your path</b>
                  <span>Starts with your choices</span>
                </div>
                <p className="preview-empty-note">No example schedule is pre-filled. Sign in to create and save your own plan.</p>
              </div>
            </div>
          </div>
          <div className="floating-note">
            <div className="floating-icon">
              <Heart size={15} />
            </div>
            <div>
              <small>REST IS PART OF THE PLAN</small>
              <p>
                Build breaks into a plan you can sustain
              </p>
            </div>
          </div>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
        </div>
      </section>
      <section className="landing-proof">
        <div className="proof-top">
          <span>THE PRESSURE IS REAL</span>
          <span className="proof-rule" />
          <span>THE WAY THROUGH CAN BE DIFFERENT</span>
        </div>
        <div className="problem-grid">
          <Problem
            icon={<Target />}
            title="One exam feels like everything"
            body="A single result can start to feel like a verdict on your whole future."
          />
          <Problem
            icon={<Clock3 />}
            title="More hours aren't always better"
            body="Longer days leave less room for sleep, learning and recovery."
          />
          <Problem
            icon={<Activity />}
            title="Comparison never switches off"
            body="Rank lists and peer scores can drown out your own progress."
          />
          <Problem
            icon={<Users />}
            title="Marks aren't the whole picture"
            body="Families want to help, but don't always know what support looks like."
          />
        </div>
      </section>
      <section className="approach-section">
        <div className="approach-intro">
          <div className="eyebrow">
            <span className="eyebrow-line" /> THE PATHWISE APPROACH
          </div>
          <h2>
            A plan that sees
            <br />
            the <em>whole</em> you.
          </h2>
          <p>
            Good preparation is more than another study schedule. It's a rhythm
            you can keep, with space to check in, course-correct and imagine
            what comes next.
          </p>
          <button className="text-link" onClick={onHow}>
            Why we built PATHWISE <ArrowRight size={15} />
          </button>
        </div>
        <div className="approach-steps">
          {[
            [
              "01",
              "Prepare",
              "Make a plan for the time and energy you actually have.",
            ],
            [
              "02",
              "Understand",
              "See real learning progress beyond a mock-test score.",
            ],
            [
              "03",
              "Recover",
              "Check in, take breaks and protect the pace you can sustain.",
            ],
            [
              "04",
              "Explore",
              "Discover more ways to build a future you care about.",
            ],
          ].map(([n, t, b], i) => (
            <div className="approach-step" key={t}>
              <div className={`step-number step-${i}`}>{n}</div>
              <div>
                <h3>{t}</h3>
                <p>{b}</p>
              </div>
              <ArrowRight size={16} />
            </div>
          ))}
        </div>
      </section>
      <section className="three-questions">
        <div className="three-heading">
          <span>PREPARATION SHOULD ANSWER MORE THAN ONE QUESTION</span>
          <h2>Not just, “Am I scoring enough?”</h2>
        </div>
        <div className="question-grid">
          <div>
            <span>01</span>
            <BookOpen size={20} />
            <h3>Am I learning?</h3>
            <p>Build understanding that sticks, not just hours that add up.</p>
          </div>
          <div>
            <span>02</span>
            <Heart size={20} />
            <h3>Am I coping?</h3>
            <p>Notice what your energy is telling you before you hit empty.</p>
          </div>
          <div>
            <span>03</span>
            <Compass size={20} />
            <h3>Do I know where I'm going?</h3>
            <p>
              Keep other meaningful paths visible while you work toward a goal.
            </p>
          </div>
        </div>
      </section>
      <section className="landing-cta">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> BEGIN WHERE YOU ARE
          </div>
          <h2>
            Preparation should build your future —<br />
            <em>not consume it.</em>
          </h2>
        </div>
        <button className="button button-dark button-lg" onClick={onStart}>
          Start building your path <ArrowRight size={17} />
        </button>
      </section>
      <footer className="landing-footer">
        <Brand
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <span>Thoughtful preparation for the whole journey.</span>
        <span>© 2026 PATHWISE · Built for real life</span>
      </footer>
    </div>
  );
}

function Problem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="problem-card">
      <span className="problem-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Sidebar({
  active,
  onNavigate,
  mode,
  onMode,
  onLanding,
  mobile,
  onClose,
  account,
}: {
  active: Page;
  onNavigate: (p: Page) => void;
  mode: "student" | "parent";
  onMode: () => void;
  onLanding: () => void;
  mobile: boolean;
  onClose: () => void;
  account: Account | null;
}) {
  return (
    <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
      <div className="sidebar-head">
        <Brand onClick={onLanding} />
        <button
          className="icon-button sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>
      <div className="workspace-select">
        <span className="workspace-avatar">{account?.name?.trim()?.charAt(0).toUpperCase() || "?"}</span>
        <span>
          <b>{account ? `${account.name}'s space` : "Your study space"}</b>
          <small>{account ? "Personal workspace" : "Sign in to save your path"}</small>
        </span>
        <ChevronDown size={14} />
      </div>
      <nav className="side-nav" aria-label="Main navigation">
        <span className="nav-label">YOUR PATH</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-link ${active === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === "wellbeing" && <span className="nav-live-dot" />}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-quote">
          <span>“</span>
          <p>
            Your rank is a result.
            <br />
            It is not your identity.
          </p>
          <small>A NOTE TO YOURSELF</small>
        </div>
        <button className="mode-switch" onClick={onMode}>
          <span className="mode-icon">
            <Users size={15} />
          </span>
          <span>
            <b>{mode === "student" ? "Student view" : "Parent view"}</b>
            <small>Switch experience</small>
          </span>
          <ArrowRight size={15} />
        </button>
        <button
          className={`settings-link ${active === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <SettingsIcon size={15} /> Settings
        </button>
        <button className="back-to-site" onClick={onLanding}>
          <ArrowLeft size={14} /> PATHWISE home
        </button>
      </div>
    </aside>
  );
}

function PageHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function SectionHead({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  change,
  icon: Icon,
  tone = "",
}: {
  label: string;
  value: string;
  change?: string;
  icon: typeof Activity;
  tone?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={16} />
        </span>
      </div>
      <strong>{value}</strong>
      {change && (
        <div className="metric-change">
          <ArrowUpRight size={13} />
          {change}
        </div>
      )}
    </div>
  );
}
function Dashboard({ store, update, navigate, toast, studentName }: {
  store: Store; update: (p: Partial<Store>) => void; navigate: (p: Page) => void;
  toast: (s: string) => void; studentName: string;
}) {
  const done = store.tasks.filter((task) => task.done).length;
  const completedMinutes = store.tasks.filter((task) => task.done && task.kind !== "break").reduce((sum, task) => sum + durationMinutes(task.duration), 0);
  const targetMinutes = Math.max(1, store.planner.hours * 60);
  const progress = Math.min(100, Math.round((completedMinutes / targetMinutes) * 100));
  const latest = store.checkins[store.checkins.length - 1];
  const focus = store.tasks.find((task) => !task.done && task.kind !== "break");
  const today = new Date();
  const toggle = (id: number) => {
    const tasks = store.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
    update({ tasks });
    toast(tasks.find((task) => task.id === id)?.done ? "Nice work. That’s one step in your path." : "Task moved back to your plan.");
  };
  return (
    <>
      <PageHead
        eyebrow={today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
        title={<>Good morning, {studentName}<span className="accent-dot">.</span></>}
        subtitle="Here's your path for today. Keep it steady, keep it yours."
        action={<button className="button button-outline" onClick={() => navigate("planner")}><Plus size={16} /> Adjust today's plan</button>}
      />
      <div className="dash-layout">
        <div className="dash-main">
          <div className="metric-grid">
            <Metric label="TODAY'S STUDY GOAL" value={formatDuration(completedMinutes)} change={store.tasks.length ? `${progress}% of your ${store.planner.hours}h plan` : "Create a plan to begin"} icon={Clock3} />
            <Metric label="PLAN STEPS" value={`${done} / ${store.tasks.length}`} change={store.tasks.length ? "Steps completed today" : "No plan saved yet"} icon={Flame} tone="amber" />
            <Metric label="LATEST CHECK-IN" value={latest ? `${latest.energy}/10 energy` : "Not checked in"} change={latest ? `Stress ${latest.stress}/10 · ${latest.date}` : "Your wellbeing data stays private"} icon={Heart} tone="coral" />
          </div>
          <section className="panel today-panel">
            <SectionHead title="Today's path" detail={store.tasks.length ? `${done} of ${store.tasks.length} steps complete` : "Your schedule will appear here after you create a plan"} />
            {store.tasks.length > 0 ? <>
              <div className="today-progress"><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div>
              <div className="timeline">{store.tasks.map((task, index) => <TaskRow task={task} key={task.id} isLast={index === store.tasks.length - 1} onToggle={() => toggle(task.id)} />)}</div>
            </> : <div className="path-empty-state"><span className="field-label">START WITH YOUR REAL SCHEDULE</span><p>Add your exam, available hours and focus subjects to build your first plan.</p></div>}
            <button className="text-link plan-link" onClick={() => navigate("planner")}>{store.tasks.length ? "Edit your study plan" : "Create your first plan"} <ArrowRight size={15} /></button>
          </section>
          <div className="insight-panel">
            <div className="insight-mark"><Sparkles size={18} /></div>
            <div className="insight-content">
              <span>YOUR PATHWISE SUMMARY</span>
              <p>{store.tasks.length ? `You have completed ${done} of ${store.tasks.length} steps in today's plan. Your progress updates as you mark tasks complete.` : "Your progress summary will grow from the plans and check-ins you choose to save."}</p>
              <small>Calculated from your saved PATHWISE activity · <button onClick={() => navigate("progress")}>See your progress</button></small>
            </div>
            <div className="insight-art"><div className="insight-orbit"><span /></div></div>
          </div>
          <div className="bottom-cards">
            <button className="mini-action-card" onClick={() => navigate("wellbeing")}><span className="action-card-icon green"><Heart size={17} /></span><span><b>Pause for a check-in</b><small>A quick read on how you're doing</small></span><ArrowRight size={16} /></button>
            <button className="mini-action-card" onClick={() => navigate("careers")}><span className="action-card-icon lilac"><Compass size={17} /></span><span><b>Explore a different path</b><small>Your future has more than one route</small></span><ArrowRight size={16} /></button>
          </div>
        </div>
        <aside className="dash-rail">
          <div className="panel focus-panel">
            <div className="rail-label">TODAY AT A GLANCE <CalendarDays size={15} /></div>
            <div className="focus-date"><b>{today.toLocaleDateString("en-GB", { day: "2-digit" })}</b><span>{today.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}<br/><small>{today.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()}</small></span><span className="focus-month">{today.getFullYear()}</span></div>
            <div className="focus-line" /><div className="focus-label">NEXT STUDY BLOCK</div>
            <div className="focus-subject"><span className="subject-icon physics">◷</span><span><b>{focus?.title || "No study block"}</b><small>{focus?.detail || "Create a plan to see your next task."}</small></span><ArrowUpRight size={15} /></div>
            {focus && <div className="focus-meta"><span><Clock3 size={13} /> {focus.duration}</span><span><span className="tiny-dot" /> Planned</span></div>}
          </div>
          <div className="readiness-card">
            <div className="readiness-card-head"><span>YOUR LATEST CHECK-IN</span><span className="readiness-status"><i />{latest ? "Saved locally" : "Private"}</span></div>
            {latest ? <><div className="readiness-score"><span>{latest.energy}</span><small>/10</small><div><b>Your energy</b><p>Stress {latest.stress}/10 · confidence {latest.confidence}/10</p></div></div><div className="readiness-meta"><span>SLEEP</span><b>{latest.sleep}h</b><i/><span>DATE</span><b>{latest.date}</b></div></> : <div className="path-empty-state"><p>No check-in has been saved. Add one whenever it feels useful.</p></div>}
            <button onClick={() => navigate("wellbeing")}>{latest ? "Update your check-in" : "Check in with yourself"} <ArrowRight size={14} /></button>
          </div>
          <div className="upcoming-card">
            <span className="rail-label">YOUR EXAM TARGET <Target size={15} /></span>
            <div className="upcoming-row"><span className="upcoming-icon"><CalendarDays size={17} /></span><span><b>{store.planner.exam || "Choose your exam"}</b><small>{store.planner.examDate ? new Date(store.planner.examDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Add your target date in My plan"}</small></span></div>
            <p>This date comes from your planner settings.</p><button onClick={() => navigate("planner")}>Update exam target <ArrowRight size={14} /></button>
          </div>
          <div className="rank-detox-mini">
            <div className="rank-mini-top"><span className="action-card-icon peach"><Sparkles size={15} /></span><b>Rank Detox</b><button className={`toggle ${store.showRank ? "checked" : ""}`} onClick={() => update({ showRank: !store.showRank })} aria-label={`${store.showRank ? "Hide" : "Show"} rank`}><i /></button></div>
            <p>{store.showRank ? "You can add a mock result in Progress when you are ready." : "Keep your focus on the work and growth that matter to you."}</p>
            <button className="text-link" onClick={() => navigate("progress")}>Open progress <ArrowRight size={13} /></button>
          </div>
        </aside>
      </div>
      <div className="loop-strip"><span>YOUR PREPARATION LOOP</span>{["Check in", "Understand", "Plan", "Study", "Measure", "Recover", "Explore", "Adapt"].map((step, index) => <span key={step} className={index === 2 ? "loop-current" : ""}>{step}{index < 7 && <i>→</i>}</span>)}</div>
    </>
  );
}
function TaskRow({
  task,
  isLast,
  onToggle,
}: {
  task: StudyTask;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`task-row ${task.done ? "task-done" : ""}`}>
      <span className="task-time">{task.time}</span>
      <span className={`task-dot ${task.kind} ${task.done ? "completed" : ""}`}>
        {task.done ? (
          <Check size={11} />
        ) : task.kind === "break" ? (
          <span />
        ) : null}
      </span>
      <button className="task-copy" onClick={onToggle}>
        <b>{task.title}</b>
        <small>{task.detail}</small>
      </button>
      <span className="task-duration">{task.duration}</span>
      <button
        className={`task-check ${task.done ? "is-done" : ""}`}
        onClick={onToggle}
        aria-label={`${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`}
      >
        {task.done ? <Check size={13} /> : <span />}
      </button>
      {!isLast && <i className="timeline-stem" />}
    </div>
  );
}

function Planner({
  store,
  update,
  toast,
}: {
  store: Store;
  update: (p: Partial<Store>) => void;
  toast: (s: string) => void;
}) {
  const [generated, setGenerated] = useState(false);
  const subjects: Subject[] = ["Physics", "Chemistry", "Mathematics"];
  const plan = store.planner;
  const setPlan = (key: string, value: unknown) =>
    update({ planner: { ...plan, [key]: value } } as Partial<Store>);
  const toggleSubject = (key: "weak" | "strong", subject: string) => {
    const selected = plan[key] as string[];
    setPlan(
      key,
      selected.includes(subject)
        ? selected.filter((x) => x !== subject)
        : [...selected, subject],
    );
  };
  const generate = () => {
    setGenerated(true);
    toast("Your plan is ready. Every block has a reason.");
  };
  const total = plan.hours;
  const phys = plan.weak.includes("Physics")
    ? Math.round(total * 0.38 * 10) / 10
    : Math.round(total * 0.3 * 10) / 10;
  const chem = plan.weak.includes("Chemistry")
    ? Math.round(total * 0.34 * 10) / 10
    : Math.round(total * 0.28 * 10) / 10;
  const maths = Math.round((total - phys - chem) * 10) / 10;
  return (
    <>
      <PageHead
        eyebrow="A PLAN THAT ADAPTS TO YOU"
        title={
          <>
            Make a plan you can <em>keep.</em>
          </>
        }
        subtitle="The best plan works with your energy, your priorities and your real life."
      />
      <div className="planner-grid">
        <div className="panel planner-form">
          <div className="form-head">
            <div className="form-icon">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2>Shape your study day</h2>
              <p>A few details help us make the time count.</p>
            </div>
          </div>
          <label className="field-label" htmlFor="exam">
            YOUR EXAM
          </label>
          <select
            id="exam"
            value={plan.exam}
            onChange={(e) => setPlan("exam", e.target.value)}
            className="select-field"
          >
            <option value="">Choose an exam</option>
            {["JEE", "NEET", "CET", "CUET"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <label
            className="field-label label-spaced date-label"
            htmlFor="exam-date"
          >
            TARGET EXAM DATE
          </label>
          <input
            className="select-field date-field"
            id="exam-date"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={plan.examDate}
            onChange={(e) => setPlan("examDate", e.target.value)}
          />
          <div className="field-label label-spaced">
            HOW MUCH STUDY TIME DO YOU HAVE?
          </div>
          <div className="hours-control">
            <input
              aria-label="Available focused study hours"
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={plan.hours}
              onChange={(e) => setPlan("hours", Number(e.target.value))}
            />
            <div>
              <b>{plan.hours}h</b>
              <span>focused time, excluding breaks</span>
            </div>
          </div>
          <div className="label-row label-spaced">
            <span className="field-label">HOW'S YOUR ENERGY?</span>
            <span className="form-hint">Choose what feels true today</span>
          </div>
          <div className="energy-options">
            {["Low", "Medium", "High"].map((x, i) => (
              <button
                key={x}
                className={plan.energy === x ? "selected" : ""}
                onClick={() => setPlan("energy", x)}
              >
                <span>{["◒", "◉", "✳"][i]}</span>
                {x}
              </button>
            ))}
          </div>
          <div className="label-row label-spaced">
            <span className="field-label">WHERE WOULD SUPPORT HELP?</span>
            <span className="form-hint">Your weaker areas</span>
          </div>
          <div className="chip-row">
            {subjects.map((s) => (
              <button
                key={s}
                className={`subject-chip ${plan.weak.includes(s) ? "chosen" : ""}`}
                onClick={() => toggleSubject("weak", s)}
              >
                {s}
                {plan.weak.includes(s) && <Check size={12} />}
              </button>
            ))}
          </div>
          <div className="label-row label-spaced">
            <span className="field-label">WHAT FEELS MORE SOLID?</span>
            <span className="form-hint">Strong areas</span>
          </div>
          <div className="chip-row">
            {subjects.map((s) => (
              <button
                key={s}
                className={`subject-chip ${plan.strong.includes(s) ? "chosen" : ""}`}
                onClick={() => toggleSubject("strong", s)}
              >
                {s}
                {plan.strong.includes(s) && <Check size={12} />}
              </button>
            ))}
          </div>
          <button
            className="button button-dark generate-button"
            onClick={generate}
          >
            <Sparkles size={16} /> Build my study plan <ArrowRight size={16} />
          </button>
          <small className="privacy-note">
            Your plan settings sync to your local account; wellbeing check-ins stay on this device.
          </small>
        </div>
        <div className="planner-results">
          <div className="result-top">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {generated ? "YOUR PLAN IS READY" : "A STARTING POINT"}
              </div>
              <h2>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</h2>
              <p>
                {plan.hours} focused hours · {plan.energy.toLowerCase()} energy
                · {plan.exam} prep ·{" "}
                {plan.examDate ? new Date(plan.examDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "target date not set"}
              </p>
            </div>
            <div className="result-date">
              <b>{plan.examDate ? new Date(plan.examDate + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit" }) : "--"}</b>
              <span>{plan.examDate ? new Date(plan.examDate + "T12:00:00").toLocaleDateString("en-GB", { month: "short" }).toUpperCase() : "TARGET"}</span>
            </div>
          </div>
          <div className="plan-summary">
            <span>
              <i />
              {plan.weak.length
                ? `Extra focus: ${plan.weak.join(", ")}`
                : "Balanced across your subjects"}
            </span>
            <span>
              <Clock3 size={13} /> Includes 50 min recovery
            </span>
          </div>
          <div className="generated-plan">
            {[
              {
                subject: plan.weak[0] || "Physics",
                time: `${phys}h`,
                topic:
                  plan.weak[0] === "Physics"
                    ? "Rotational motion · core concepts"
                    : "Mechanics · mixed practice",
                color: "physics",
                why: "More time for a weaker topic",
              },
              {
                subject: plan.weak[1] || "Chemistry",
                time: `${chem}h`,
                topic:
                  plan.weak[1] === "Chemistry"
                    ? "Organic reactions · active recall"
                    : "Organic revision · spaced recall",
                color: "chemistry",
                why: "Short retrieval practice helps it stick",
              },
              {
                subject: plan.strong[0] || "Mathematics",
                time: `${maths}h`,
                topic:
                  plan.strong[0] === "Mathematics"
                    ? "Probability · timed set"
                    : "Mixed practice · maintain fluency",
                color: "math",
                why: "A focused block maintains momentum",
              },
            ].map((item, i) => (
              <div className="generated-row" key={i}>
                <span className={`plan-subject-icon ${item.color}`}>
                  {["Φ", "⌬", "∑"][i]}
                </span>
                <div className="generated-info">
                  <div>
                    <b>{item.subject}</b>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.topic}</p>
                  <small>{item.why}</small>
                </div>
                <button
                  className="quiet-icon"
                  aria-label="Plan block details"
                  onClick={() => toast(item.why)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
            <div className="generated-row recovery-row">
              <span className="plan-subject-icon recovery">♡</span>
              <div className="generated-info">
                <div>
                  <b>Recovery & breaks</b>
                  <span>50 min</span>
                </div>
                <p>A real lunch and a screen-free reset</p>
                <small>Recovery supports the work you put in.</small>
              </div>
            </div>
          </div>
          <div className="why-plan">
            <div className="why-icon">
              <Lightbulb size={17} />
            </div>
            <div>
              <b>Why this plan?</b>
              <p>
                {plan.weak.length
                  ? `We gave ${plan.weak.join(" and ")} more deliberate attention because you flagged ${plan.weak.length === 1 ? "it" : "them"} as a place to grow. Your stronger areas get a shorter recall block to keep knowledge fresh. `
                  : "We balanced your subjects evenly and used your available study window without filling every minute. "}
                A lower-energy day would shorten the hardest blocks first — not
                remove your recovery time.
              </p>
            </div>
          </div>
          <button
            className="button button-dark save-plan"
            onClick={() => {
              const items = [
                { subject: plan.weak[0] || "Physics", hours: phys, focus: "Focused practice" },
                { subject: plan.weak[1] || "Chemistry", hours: chem, focus: "Active recall" },
                { subject: plan.strong[0] || "Mathematics", hours: maths, focus: "Mixed practice" },
              ];
              let cursor = 9 * 60;
              const clock = (minutes: number) => String(Math.floor(minutes / 60) % 24).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
              const idBase = Date.now();
              const tasks: StudyTask[] = [];
              items.forEach((item, index) => {
                const minutes = Math.max(30, Math.round(item.hours * 60));
                tasks.push({ id: idBase + index * 2, time: clock(cursor), title: item.subject, detail: (plan.exam || "Study") + " · " + item.focus, duration: formatDuration(minutes), kind: "study", done: false });
                cursor += minutes;
                if (index < items.length - 1) {
                  tasks.push({ id: idBase + index * 2 + 1, time: clock(cursor), title: "Recovery break", detail: "Step away and reset", duration: "15 min", kind: "break", done: false });
                  cursor += 15;
                }
              });
              update({ tasks });
              toast("Your personalized plan was added to today.");
            }}
          >
            Add plan to my day <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

function Wellbeing({
  store,
  update,
  toast,
}: {
  store: Store;
  update: (p: Partial<Store>) => void;
  toast: (s: string) => void;
}) {
  const latest = store.checkins[store.checkins.length - 1];
  const [stress, setStress] = useState(4),
    [energy, setEnergy] = useState(7),
    [sleep, setSleep] = useState(7.3),
    [confidence, setConfidence] = useState(7),
    [guilt, setGuilt] = useState("Sometimes"),
    [submitted, setSubmitted] = useState(false);
  const submit = () => {
    const entry = {
      stress,
      energy,
      sleep,
      confidence,
      guilt,
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    };
    update({ checkins: [...store.checkins, entry] });
    setSubmitted(true);
    toast("Check-in saved. Thanks for checking in with yourself.");
  };
  const recent = store.checkins.slice(-7);
  return (
    <>
      <PageHead
        eyebrow="A MOMENT FOR YOU"
        title={
          <>
            How are you <em>actually</em> doing?
          </>
        }
        subtitle="A quick check-in can help you decide what kind of day to make."
        action={
          <span className="private-pill">
            <span /> Just for you
          </span>
        }
      />
      <div className="wellbeing-layout">
        <div className="panel checkin-panel">
          <div className="checkin-intro">
            <span className="checkin-orb">
              <Heart size={21} />
            </span>
            <div>
              <h2>Take a breath. Check in.</h2>
              <p>
                There are no right answers. This is a moment for you, not a
                measure of you.
              </p>
            </div>
          </div>
          {submitted ? (
            <div className="submitted-box">
              <div className="submitted-check">
                <Check size={21} />
              </div>
              <h3>Thank you for checking in.</h3>
              <p>
                You shared that your stress is{" "}
                {stress <= 4
                  ? "manageable"
                  : stress <= 7
                    ? "a bit elevated"
                    : "high today"}{" "}
                and your energy is{" "}
                {energy >= 6 ? "in a good place" : "running low"}. Let’s let
                that shape the rest of the day.
              </p>
              <button className="text-link" onClick={() => setSubmitted(false)}>
                Update this check-in <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <SliderQuestion
                label="How stressed do you feel today?"
                low="Completely calm"
                high="Extremely stressed"
                value={stress}
                set={setStress}
              />
              <SliderQuestion
                label="How energetic do you feel?"
                low="Exhausted"
                high="Energised"
                value={energy}
                set={setEnergy}
              />
              <SliderQuestion
                label="How confident do you feel about your prep?"
                low="Not confident"
                high="Very confident"
                value={confidence}
                set={setConfidence}
              />
              <div className="sleep-question">
                <div className="question-title">
                  <b>How well did you sleep?</b>
                  <span>
                    {Math.floor(sleep)}h {Math.round((sleep % 1) * 60)}m
                  </span>
                </div>
                <input
                  aria-label="Hours of sleep"
                  type="range"
                  min="3"
                  max="10"
                  step="0.1"
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                />
                <div className="range-captions">
                  <span>3 hours</span>
                  <span>10 hours</span>
                </div>
              </div>
              <div className="guilt-question">
                <div className="question-title">
                  <b>Do you feel guilty when taking a break?</b>
                  <span>Be honest with yourself</span>
                </div>
                <div className="guilt-options">
                  {["Never", "Sometimes", "Often"].map((x) => (
                    <button
                      className={guilt === x ? "selected" : ""}
                      key={x}
                      onClick={() => setGuilt(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              <div className="checkin-disclaimer">
                <CircleHelp size={14} /> This is a self-reflection tool, not a
                medical assessment.
              </div>
              <button
                className="button button-dark submit-checkin"
                onClick={submit}
              >
                Save my check-in <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
        <div className="wellbeing-side">
          <div className="panel trend-panel">
            <SectionHead
              title="Your week, gently"
              detail="A reflection, not a scorecard"
            />
            <div className="week-bars">
              {(recent.length
                ? recent
                : [
                    { stress: 4, energy: 6, sleep: 7 },
                    { stress: 5, energy: 7, sleep: 7.3 },
                    { stress: 3, energy: 7, sleep: 8 },
                    { stress: 6, energy: 5, sleep: 6 },
                    { stress: 4, energy: 8, sleep: 7.5 },
                    { stress: 5, energy: 6, sleep: 7 },
                    { stress: 4, energy: 7, sleep: 7.3 },
                  ]
              )
                .slice(-7)
                .map((c, i) => (
                  <div className="week-day" key={i}>
                    <div className="week-bar-track">
                      <i
                        style={{
                          height: `${Math.max(15, Math.min(95, c.energy * 10))}%`,
                        }}
                      />
                      <b
                        style={{
                          bottom: `${Math.max(5, Math.min(90, c.stress * 10))}%`,
                        }}
                      />
                    </div>
                    <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                  </div>
                ))}
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-green" /> Energy
              </span>
              <span>
                <i className="legend-coral" /> Stress
              </span>
            </div>
          </div>
          <div className="gentle-insight">
            <span className="insight-mark">
              <Sparkles size={17} />
            </span>
            <div>
              <span>A KIND REMINDER</span>
              <p>
                {guilt === "Often" || latest?.guilt === "Often"
                  ? "Rest is part of the work. A break is not something you need to earn."
                  : stress >= 7
                    ? "Today may be a day to make the plan smaller, not push harder."
                    : "Protect the rhythm that’s working. You don’t need to add more hours today."}
              </p>
            </div>
          </div>
          <div className="recommendations">
            <div className="eyebrow">
              <span className="eyebrow-line" />A FEW OPTIONS
            </div>
            {[
              [
                "Reduce tonight’s workload by 30 minutes",
                "A smaller finish can help you reset.",
              ],
              [
                "Take a proper break after your next block",
                "Step outside or do something unrelated.",
              ],
              [
                "Skip another mock test today",
                "You can review what you’ve already learned.",
              ],
            ].map((x, i) => (
              <div className="recommendation" key={i}>
                <span>{["01", "02", "03"][i]}</span>
                <p>
                  <b>{x[0]}</b>
                  <small>{x[1]}</small>
                </p>
                <Check size={14} />
              </div>
            ))}
          </div>
          <p className="checkin-footnote">
            Only you can see your individual check-ins. You choose what to
            share.
          </p>
        </div>
      </div>
    </>
  );
}
function SliderQuestion({
  label,
  low,
  high,
  value,
  set,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  set: (v: number) => void;
}) {
  return (
    <div className="slider-question">
      <div className="question-title">
        <b>{label}</b>
        <span className="answer-bubble">
          {value}
          <small>/10</small>
        </span>
      </div>
      <input
        aria-label={label}
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
      <div className="range-captions">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function Careers({
  store,
  update,
  whatIf,
  setWhatIf,
}: {
  store: Store;
  update: (p: Partial<Store>) => void;
  whatIf: boolean;
  setWhatIf: (v: boolean) => void;
}) {
  const allTags = Array.from(
    new Set(careerCatalog.flatMap((c) => c.tags)),
  ).sort();
  const [active, setActive] = useState("All");
  const tags = store.interests;
  const results = useMemo(
    () =>
      careerCatalog.filter((c) =>
        active === "All" ? true : c.tags.includes(active),
      ),
    [active],
  );
  const toggle = (name: string) =>
    update({
      interests: tags.includes(name)
        ? tags.filter((x) => x !== name)
        : [...tags, name],
    });
  return (
    <>
      <PageHead
        eyebrow="A FUTURE WITH ROOM TO MOVE"
        title={
          <>
            Your future is bigger than <em>one exam.</em>
          </>
        }
        subtitle="Your interests can lead to more than one destination. Start with what makes you curious."
        action={
          <span className="explore-counter">
            <Compass size={15} /> {tags.length} interests selected
          </span>
        }
      />
      <div className="career-intro">
        <div>
          <span className="field-label">WHAT ARE YOU CURIOUS ABOUT?</span>
          <p>Choose a few. You can change them any time.</p>
        </div>
        <button className="text-link" onClick={() => update({ interests: [] })}>
          Clear selection
        </button>
      </div>
      <div className="interest-pills">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`interest-pill ${tags.includes(tag) ? "picked" : ""}`}
            onClick={() => toggle(tag)}
          >
            {tags.includes(tag) && <Check size={13} />} {tag}
          </button>
        ))}
      </div>
      <div className="career-layout">
        <section className="career-main">
          <SectionHead
            title={active === "All" ? "Paths to explore" : `${active} pathways`}
            detail={`${results.length} starting points · not predictions`}
            action={
              <select
                className="sort-select"
                value={active}
                onChange={(e) => setActive(e.target.value)}
                aria-label="Filter career pathways"
              >
                <option>All</option>
                {allTags.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            }
          />
          <div className="career-cards">
            {results.map((career, i) => (
              <article className="career-card" key={career.name}>
                <div className="career-card-top">
                  <span className={`career-symbol c-${i % 5}`}>
                    {career.icon}
                  </span>
                  <button
                    className={`save-career ${tags.includes(career.tags[0]) ? "saved" : ""}`}
                    onClick={() => toggle(career.tags[0])}
                    aria-label={`Toggle ${career.tags[0]} interest`}
                  >
                    <Heart
                      size={16}
                      fill={
                        tags.includes(career.tags[0]) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </div>
                <h3>{career.name}</h3>
                <div className="career-tags">
                  {career.tags.slice(0, 3).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="career-card-block">
                  <span>WHAT YOU MIGHT STUDY</span>
                  <p>{career.study}</p>
                </div>
                <div className="career-card-block route-block">
                  <span>POSSIBLE ENTRY ROUTES</span>
                  <ul>
                    {career.routes.slice(0, 3).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="career-card-bottom">
                  <div>
                    <span>POSSIBLE ROLES</span>
                    <p>{career.roles.join(" · ")}</p>
                  </div>
                  <button
                    className="career-open"
                    onClick={() => setWhatIf(true)}
                    aria-label={`Explore what if scenarios for ${career.name}`}
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <p className="career-disclaimer">
            These are conversation starters, not admissions guidance or
            predictions. Routes and eligibility vary by institution; check
            official course information before making decisions. *Counselling
            roles may require additional qualifications.
          </p>
        </section>
        <aside className="career-rail">
          <div className="one-goal-card">
            <div className="rail-label">
              ONE GOAL <ArrowRight size={13} /> MULTIPLE PATHS
            </div>
            <div className="goal-node">
              <span className="goal-icon">
                <Dna size={17} />
              </span>
              <div>
                <b>Engineering</b>
                <small>
                  A subject area you can approach from many directions
                </small>
              </div>
            </div>
            <div className="path-branches">
              {[
                "JEE",
                "State CET",
                "University entrance",
                "Related degree + specialisation",
              ].map((x, i) => (
                <div key={x}>
                  <span className="branch-dot">
                    {i < 3 ? "0" + (i + 1) : "↗"}
                  </span>
                  <span>{x}</span>
                  {i === 0 && <i>COMMON ROUTE</i>}
                </div>
              ))}
            </div>
            <p>
              Different routes suit different people. Explore options with a
              teacher or counsellor.
            </p>
          </div>
          <button className="what-if-card" onClick={() => setWhatIf(true)}>
            <span className="what-if-spark">
              <Sparkles size={17} />
            </span>
            <div>
              <span>TRY A WHAT IF?</span>
              <h3>What if my target college doesn't work out?</h3>
              <p>
                Imagine a few routes forward. Keep possibility in the picture.
              </p>
            </div>
            <ArrowUpRight size={16} />
          </button>
          <div className="career-prompt">
            <span className="action-card-icon lilac">
              <Compass size={16} />
            </span>
            <p>
              <b>Curiosity counts.</b>
              <br />
              Your interests can change. Keep exploring as you learn more about
              yourself.
            </p>
          </div>
        </aside>
      </div>
      {whatIf && <WhatIfModal onClose={() => setWhatIf(false)} />}
    </>
  );
}
function WhatIfModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="whatif-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatif-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          MORE THAN ONE WAY FORWARD
        </div>
        <h2 id="whatif-title">What if your target college doesn't work out?</h2>
        <p className="whatif-lede">
          One result can change your route. It doesn't erase the future you can
          build.
        </p>
        <div className="scenario-root">
          <span>YOUR INTEREST IN ENGINEERING</span>
          <div className="scenario-line" />
        </div>
        <div className="scenario-paths">
          {[
            ["A", "Your target college", "The first route you imagined."],
            [
              "B",
              "Another strong university",
              "Compare programmes, support and fit.",
            ],
            [
              "C",
              "A different entrance route",
              "State CET or university admissions.",
            ],
            [
              "D",
              "Related degree, new specialisation",
              "Build toward an area you care about.",
            ],
          ].map((x) => (
            <div className="scenario-path" key={x[0]}>
              <span>{x[0]}</span>
              <div>
                <b>{x[1]}</b>
                <small>{x[2]}</small>
              </div>
              <ArrowRight size={14} />
            </div>
          ))}
        </div>
        <div className="whatif-foot">
          <span className="insight-mark">
            <Sparkles size={16} />
          </span>
          <p>
            These are starting points for exploration. Talk with a trusted
            teacher or counsellor about the routes that fit your situation.
          </p>
        </div>
        <button className="button button-dark modal-done" onClick={onClose}>
          Keep exploring <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function Success({
  store,
  update,
}: {
  store: Store;
  update: (p: Partial<Store>) => void;
}) {
  const dimensions = successOptions.slice(0, 7).map((name) => [name.toUpperCase(), store.success.includes(name)] as const);
  const toggle = (x: string) =>
    update({
      success: store.success.includes(x)
        ? store.success.filter((y) => y !== x)
        : [...store.success, x],
    });
  return (
    <>
      <PageHead
        eyebrow="A DEFINITION YOU GET TO WRITE"
        title={
          <>
            Success is not <em>one number.</em>
          </>
        }
        subtitle="Your future can hold many things that matter. See what you're building, in your own way."
      />
      <div className="success-layout">
        <div className="success-left">
          <div className="panel constellation-panel">
            <div className="constellation-head">
              <div>
                <span className="field-label">YOUR SUCCESS PROFILE</span>
                <h2>
                  A path that's <em>uniquely yours.</em>
                </h2>
              </div>
              <span className="private-pill">
                <span /> Only you
              </span>
            </div>
            <div className="constellation">
              <div className="constellation-orbit orbit-a" />
              <div className="constellation-orbit orbit-b" />
              <div className="constellation-core">
                <span>
                  YOUR
                  <br />
                  PATH
                </span>
                <small>IN PROGRESS</small>
              </div>
              {dimensions.map((x, i) => (
                <div className={`constellation-node node-${i}`} key={x[0]}>
                  <span className="node-star">✳</span>
                  <span className="node-label">{x[0]}</span>
                  <b>{x[1] ? "Chosen" : "Explore"}</b>
                </div>
              ))}
              <svg
                className="constellation-lines"
                viewBox="0 0 500 370"
                aria-hidden="true"
              >
                <path d="M250 185L250 30 M250 185L405 90 M250 185L430 230 M250 185L335 335 M250 185L165 335 M250 185L65 235 M250 185L95 85" />
              </svg>
            </div>
            <div className="constellation-caption">
              <span>
                <i />Values you selected for your own definition of success
              </span>
              <span>No score. No ranking. Just your choices.</span>
            </div>
          </div>
          <div className="success-quote">
            <span>“</span>
            <div>
              <p>You are building your own path.</p>
              <small>No comparison. No finish line you didn't choose.</small>
            </div>
            <span className="quote-spark">✳</span>
          </div>
        </div>
        <aside className="success-side">
          <div className="panel definition-panel">
            <span className="field-label">WHAT DOES SUCCESS MEAN TO YOU?</span>
            <p>
              Pick the things that feel meaningful. Your answer can change as
              you do.
            </p>
            <div className="success-options">
              {successOptions.map((x, i) => (
                <button
                  className={store.success.includes(x) ? "chosen" : ""}
                  key={x}
                  onClick={() => toggle(x)}
                >
                  <span className="success-option-icon">
                    {["↗", "◈", "⌁", "♡", "☼", "✳", "＋", "○"][i]}
                  </span>
                  {x}
                  {store.success.includes(x) && <Check size={14} />}
                </button>
              ))}
            </div>
            <div className="selection-count">
              {store.success.length} selected <span>·</span> Choose as many as
              fit
            </div>
          </div>
          <div className="definition-result">
            <span>YOUR DEFINITION OF SUCCESS</span>
            {store.success.length ? (
              <p>{store.success.join(" · ")}</p>
            ) : (
              <p className="empty-definition">
                Your words will show up here as you choose.
              </p>
            )}
            <span className="result-note">
              <Sparkles size={13} /> It's okay for this to change.
            </span>
          </div>
          <button
            className="button button-outline reflect-button"
            onClick={() => toggle("Learning continuously")}
          >
            Add learning to my path <Plus size={15} />
          </button>
        </aside>
      </div>
    </>
  );
}

function About() {
  const stages = [
    [
      "EMPATHISE",
      "Listen for lived experience.",
      "Students named stress, guilt and a packed school-plus-coaching day. Parents described financial pressure and uncertainty. Tutors felt pressure to keep pace with the batch.",
      "✳",
    ],
    [
      "DEFINE",
      "Find the human need underneath.",
      "The project research surfaced time pressure and comparison culture, connected by the belief that one exam rank determines lifelong success.",
      "◎",
    ],
    [
      "HOW MIGHT WE",
      "Open up better questions.",
      "How might students prepare without sacrificing wellbeing? How might families see real progress? How might success become broader than rank?",
      "↗",
    ],
    [
      "THE SOLUTION",
      "Make room for the whole journey.",
      "PATHWISE brings sustainable planning, self-reflection, progress beyond rank and career exploration into one calm place.",
      "◈",
    ],
  ];
  const mapping = [
    ["TIME PRESSURE", "A plan shaped around available energy"],
    ["EMOTIONAL STRESS", "Private, supportive self-check-ins"],
    ["RANK CULTURE", "Progress measures beyond rank"],
    ["PARENTAL PRESSURE", "A shared view built for conversation"],
    ["NARROW SUCCESS", "Career exploration and “What if?” paths"],
  ];
  return (
    <>
      <PageHead
        eyebrow="THE RESEARCH BEHIND THE PRODUCT"
        title={
          <>
            Preparation that starts with <em>understanding.</em>
          </>
        }
        subtitle="PATHWISE is a design-thinking response to the real experiences behind entrance-exam pressure."
      />
      <div className="about-hero">
        <div className="about-hero-mark">
          <span>✳</span>
          <i />
          <i />
          <i />
        </div>
        <div>
          <span>FROM EMPATHY TO A DIFFERENT KIND OF TOOL</span>
          <h2>
            Not another way to push harder.
            <br />
            <em>A way to see the whole person.</em>
          </h2>
          <p>
            Our starting point: a Class 12 aspirant needs a sustainable way to
            prepare, and a wider sense of what success can look like — while the
            pressure of coaching pace, family expectations and peer comparison
            narrows the view.
          </p>
        </div>
      </div>
      <div className="thinking-steps">
        {stages.map((s, i) => (
          <article className="thinking-stage" key={s[0]}>
            <div className="thinking-stage-top">
              <span>{s[0]}</span>
              <b>0{i + 1}</b>
            </div>
            <span className="thinking-glyph">{s[3]}</span>
            <h2>{s[1]}</h2>
            <p>{s[2]}</p>
            {i < 3 && <ArrowDownRight className="stage-arrow" size={20} />}
          </article>
        ))}
      </div>
      <div className="research-to-product">
        <div className="research-intro">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            THE RESEARCH, MADE VISIBLE
          </span>
          <h2>
            Every feature answers
            <br />a human need.
          </h2>
          <p>
            The project began with empathy maps, observation and conversations
            with students, families, tutors and exam authorities. These patterns
            shaped the product.
          </p>
        </div>
        <div className="mapping-list">
          {mapping.map((m, i) => (
            <div className="mapping-row" key={m[0]}>
              <span className="mapping-number">0{i + 1}</span>
              <span className="mapping-need">{m[0]}</span>
              <ArrowRight size={14} />
              <span className="mapping-solution">{m[1]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="about-statement">
        <span className="statement-mark">“</span>
        <p>
          Your rank is a result.
          <br />
          <em>It is not your identity.</em>
        </p>
        <span>THE PATHWISE PROMISE</span>
      </div>
      <div className="about-source">
        Based on the Entrance Exams Design Thinking project · Empathise and
        Define stages
      </div>
    </>
  );
}

function Settings({
  store, update, dark, setDark, toast, account, onSignIn, onSignOut,
}: {
  store: Store; update: (p: Partial<Store>) => void; dark: boolean;
  setDark: (v: boolean) => void; toast: (s: string) => void;
  account: Account | null; onSignIn: () => void; onSignOut: () => void;
}) {
  return (
    <>
      <PageHead
        eyebrow="YOUR SPACE, YOUR CHOICES"
        title={
          <>
            A few things, <em>your way.</em>
          </>
        }
        subtitle="Keep PATHWISE feeling like a place that works for you."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="settings-section">
            <span className="field-label">ACCOUNT & SYNC</span>
            <div className="setting-row">
              <span className="settings-icon"><Users size={16} /></span>
              <div><b>{account ? account.name : "Local demo mode"}</b><small>{account ? `${account.email} · progress sync is on` : "Create an account to save plans on this computer."}</small></div>
              <button className="button button-outline setting-switch" onClick={account ? onSignOut : onSignIn}>{account ? "Sign out" : "Sign in"}</button>
            </div>
            <p className="settings-note"><span className="live-dot" />Wellbeing check-ins stay on this device and are never synced to your account.</p>
          </div>
          <div className="settings-section">
            <span className="field-label">APPEARANCE</span>
            <div className="setting-row">
              <span className="settings-icon">
                <Sun size={16} />
              </span>
              <div>
                <b>Dark appearance</b>
                <small>Choose a calmer look for your screen.</small>
              </div>
              <button
                className={`toggle ${dark ? "checked" : ""}`}
                aria-label="Toggle dark appearance"
                onClick={() => setDark(!dark)}
              >
                <i />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <span className="field-label">YOUR PATH</span>
            <div className="setting-row">
              <span className="settings-icon">
                <Sparkles size={16} />
              </span>
              <div>
                <b>Rank Detox</b>
                <small>
                  {store.showRank
                    ? "Rank can appear in progress views."
                    : "Keep the focus on progress beyond rank."}
                </small>
              </div>
              <button
                className={`toggle ${store.showRank ? "checked" : ""}`}
                aria-label="Toggle Rank Detox"
                onClick={() => update({ showRank: !store.showRank })}
              >
                <i />
              </button>
            </div>
            <div className="setting-row">
              <span className="settings-icon">
                <Users size={16} />
              </span>
              <div>
                <b>Current experience</b>
                <small>
                  {store.mode === "student"
                    ? `Student view · ${account?.name || "your"} workspace`
                    : "Parent view · shared weekly patterns"}
                </small>
              </div>
              <button
                className="button button-outline setting-switch"
                onClick={() => {
                  const mode = store.mode === "student" ? "parent" : "student";
                  update({ mode });
                  toast(
                    `${mode === "parent" ? "Parent" : "Student"} view is on`,
                  );
                }}
              >
                Switch <ArrowRight size={13} />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <span className="field-label">YOUR DATA</span>
            <div className="data-summary">
              <span>
                <b>{store.tasks.length}</b>
                <small>day plan steps</small>
              </span>
              <span>
                <b>{store.checkins.length}</b>
                <small>private check-ins</small>
              </span>
              <span>
                <b>{store.interests.length}</b>
                <small>career interests</small>
              </span>
              <span>
                <b>{store.success.length}</b>
                <small>success values</small>
              </span>
            </div>
            <p className="settings-note">
              <span className="live-dot" /> {account ? "Study and career progress syncs to this computer's account database. Check-ins remain local." : "Your preferences stay in this browser until you create an account."}
            </p>
            <button
              className="reset-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Clear your saved PATHWISE data from this device and account? Your plan, check-ins, career interests and success choices will be deleted.",
                  )
                ) {
                  localStorage.removeItem(KEY);
                  update(initial);
                  setDark(false);
                  toast("Your PATHWISE data has been cleared.");
                }
              }}
            >
              <span>
                <X size={14} />
              </span>
              <b>Clear my PATHWISE data</b>
              <small>Delete saved plans, check-ins and preferences from this device and account.</small>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <aside className="settings-aside">
          <div className="settings-principle">
            <span className="insight-mark">
              <Heart size={17} />
            </span>
            <span className="field-label">DESIGNED AROUND YOU</span>
            <h2>Your pace is allowed to change.</h2>
            <p>
              These settings shape your experience. They never change your
              worth, your progress or the number of futures open to you.
            </p>
          </div>
          <div className="settings-meta">
            <span>ACCOUNT PROFILE</span>
            <p>{account?.name || "Local student"} · {store.planner.exam || "Choose exam"}</p>
            <small>{account?.email || "Sign in to sync your study and career progress."}</small>
          </div>
        </aside>
      </div>
    </>
  );
}
