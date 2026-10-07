import "./product-pages.css";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Heart, ShieldCheck, Sparkles, Users, Wallet, Waypoints } from "lucide-react";

export type Account = { id: string; name: string; email: string };

export function AccountAccess({ onComplete, onBack }: { onComplete: (account: Account) => Promise<void>; onBack: () => void }) {
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${registering ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not connect. Start PATHWISE with npm run dev.");
      await onComplete(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not connect to PATHWISE.");
    } finally { setBusy(false); }
  }
  return (
    <section className="account-page">
      <button className="button button-quiet account-back" onClick={onBack}><ArrowLeft size={15}/> Back to PATHWISE</button>
      <div className="account-card">
        <span className="account-mark"><Sparkles size={19}/></span>
        <span className="field-label">YOUR PATH, SAVED</span>
        <h1>{registering ? "Make it yours." : "Welcome back."}</h1>
        <p>Save your study plan and career exploration to your account. Wellbeing check-ins stay on this device.</p>
        <form onSubmit={submit} className="account-form">
          {registering && <label>Your name<input autoComplete="name" required minLength={2} value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name"/></label>}
          <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<input type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 12 : 1} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={registering ? "At least 12 characters" : "Your password"}/>{registering && <small>Use at least 12 characters.</small>}</label>
          {error && <p className="account-error" role="alert">{error}</p>}
          <button className="button button-dark account-submit" disabled={busy}>{busy ? "Connecting…" : registering ? "Create account" : "Sign in"}<ArrowRight size={15}/></button>
        </form>
        <button className="account-switch" onClick={()=>{setRegistering(!registering);setError("");setPassword("");}}>{registering ? "Already have an account? Sign in" : "New to PATHWISE? Create an account"}</button>
        <div className="account-private"><ShieldCheck size={15}/><span>Stored in the local database on this computer. No third-party service is connected.</span></div>
      </div>
    </section>
  );
}

const model = [
  { icon: Users, title: "Who it serves", tag: "CUSTOMERS", body: "Students preparing for competitive entrance exams; families seeking a supportive view; and schools or coaching programmes building healthier preparation habits." },
  { icon: Sparkles, title: "Value proposition", tag: "WHY PATHWISE", body: "One calm place to plan study, reflect on energy, see progress beyond rank, and explore more than one education or career route." },
  { icon: Waypoints, title: "Channels & relationships", tag: "ACCESS", body: "Student-led use, optional family conversations, school and coaching partnerships, and educator workshops. Students choose what they share." },
  { icon: Wallet, title: "Potential revenue", tag: "HYPOTHESIS · UNVALIDATED", body: "A useful free student tier; optional family features; school or coaching licences; and sponsored access or scholarships for students who need them." },
  { icon: BriefcaseBusiness, title: "Costs & key work", tag: "OPERATIONS", body: "Product development, hosting and backups, privacy and security reviews, exam and pathway content, accessibility, student research, and support." },
  { icon: Heart, title: "Impact measures", tag: "OUTCOMES", body: "Useful weekly plans, student-reported agency, balanced study and recovery, exploring alternatives, and better family conversations—not screen time or rank." },
];

export function BusinessModel() {
  return (
    <div className="business-page">
      <div className="page-head"><div><span className="eyebrow">A SUSTAINABLE, STUDENT-FIRST PRODUCT</span><h1>A business that puts <em>students first.</em></h1><p>A proposed model for making thoughtful exam support useful and sustainable. Revenue ideas are hypotheses to validate, not proven results.</p></div><span className="private-pill"><ShieldCheck size={13}/> TRUST BY DESIGN</span></div>
      <section className="business-callout"><span className="business-callout-icon"><BriefcaseBusiness size={21}/></span><div><b>PATHWISE is designed as a trust-based education product.</b><p>Families and institutions may fund access; student wellbeing data is never the product being sold.</p></div><span className="business-proposal">PROPOSAL · TO VALIDATE</span></section>
      <div className="business-model-grid">{model.map(({icon:Icon,title,tag,body},i)=><article className="business-model-card" key={title}><div className="business-card-top"><span className="business-icon"><Icon size={17}/></span><span>0{i+1}</span></div><span className="field-label">{tag}</span><h2>{title}</h2><p>{body}</p></article>)}</div>
      <section className="business-trust"><span><Heart size={17}/></span><p><b>Privacy is part of the business model.</b> Check-ins stay on the student’s device by default. Any future institution reporting should be consented, aggregated, and never expose private individual reflections.</p></section>
      <p className="business-footnote">Before charging, validate the value with students and families, test willingness to pay, and ensure that a free path remains meaningful.</p>
    </div>
  );
}
