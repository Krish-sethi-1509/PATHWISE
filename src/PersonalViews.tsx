import { ShieldCheck, Users } from "lucide-react";
import type { StudyTask } from "./data";

type Checkin = { stress: number; energy: number; sleep: number; confidence: number; guilt: string; date: string };

function durationMinutes(value: string) {
  const hours = Number(value.match(/([0-9]+)h/)?.[1] || 0);
  const minutes = Number(value.match(/([0-9]+)m/)?.[1] || 0);
  return hours * 60 + minutes;
}

export function ProgressView({ tasks, checkins }: { tasks: StudyTask[]; checkins: Checkin[] }) {
  const study = tasks.filter((task) => task.kind !== "break");
  const complete = study.filter((task) => task.done);
  const plannedMinutes = study.reduce((sum, task) => sum + durationMinutes(task.duration), 0);
  const completeMinutes = complete.reduce((sum, task) => sum + durationMinutes(task.duration), 0);
  const percent = plannedMinutes ? Math.round((completeMinutes / plannedMinutes) * 100) : 0;
  const averageEnergy = checkins.length ? Math.round(checkins.reduce((sum, item) => sum + item.energy, 0) / checkins.length) : null;
  const recent = [...checkins].slice(-7).reverse();

  return (
    <div className="progress-data-page">
      <div className="page-head"><div><span className="eyebrow">YOUR SAVED ACTIVITY</span><h1>Progress that comes <em>from you.</em></h1><p>These summaries use the plans and check-ins you have actually saved. No example scores are filled in.</p></div><span className="private-pill"><ShieldCheck size={13}/> PRIVATE TO THIS DEVICE</span></div>
      <div className="progress-real-grid">
        <article className="progress-real-card"><span className="field-label">STUDY STEPS COMPLETED</span><strong>{complete.length}<small> / {study.length}</small></strong><div className="progress-real-track"><i style={{ width: percent + "%" }}/></div><p>{study.length ? percent + "% of your saved study blocks" : "Add a plan to start tracking completion."}</p></article>
        <article className="progress-real-card"><span className="field-label">FOCUS TIME COMPLETED</span><strong>{Math.floor(completeMinutes / 60)}<small>h {completeMinutes % 60}m</small></strong><p>Calculated from study blocks you mark complete.</p></article>
        <article className="progress-real-card"><span className="field-label">WELLBEING CHECK-INS</span><strong>{checkins.length}</strong><p>{averageEnergy === null ? "No check-ins saved yet." : "Average energy: " + averageEnergy + "/10 · stored on this device."}</p></article>
      </div>
      <section className="progress-real-section"><div><span className="field-label">YOUR STUDY PLAN</span><h2>Saved study blocks</h2></div>{study.length ? <div className="progress-task-list">{study.map((task) => <div className="progress-task" key={task.id}><span className={task.done ? "progress-task-dot complete" : "progress-task-dot"}>{task.done ? "✓" : "·"}</span><span><b>{task.title}</b><small>{task.detail}</small></span><small>{task.duration}</small></div>)}</div> : <div className="progress-empty">No study activity yet. Build a plan in <b>My plan</b> and mark blocks complete as you go.</div>}</section>
      <section className="progress-real-section"><div><span className="field-label">PRIVATE REFLECTIONS</span><h2>Recent check-ins</h2></div>{recent.length ? <div className="checkin-log">{recent.map((item, index) => <article key={index}><span>{item.date}</span><b>Energy {item.energy}/10</b><b>Stress {item.stress}/10</b><small>{item.sleep}h sleep</small></article>)}</div> : <div className="progress-empty">No wellbeing check-ins are saved yet. Add one on the Wellbeing page whenever you choose.</div>}</section>
      <p className="progress-source-note">Progress is computed locally from your saved PATHWISE activity. Mock accuracy and rank are not shown without your own entries.</p>
    </div>
  );
}

export function FamilyView({ tasks, studentName }: { tasks: StudyTask[]; studentName: string }) {
  const study = tasks.filter((task) => task.kind !== "break");
  const complete = study.filter((task) => task.done).length;
  return (
    <div className="family-data-page">
      <div className="page-head"><div><span className="eyebrow">FAMILY CONVERSATION VIEW</span><h1>Support, don't <em>supervise.</em></h1><p>A gentle way to talk about preparation without making one exam feel like a verdict.</p></div><span className="private-pill"><Users size={13}/> {studentName}</span></div>
      <div className="family-data-note"><ShieldCheck size={17}/><p>This view is on the student's device. PATHWISE does not currently share accounts between family members, and private wellbeing check-ins are not shown here.</p></div>
      <div className="family-data-grid"><article><span className="field-label">SAVED STUDY BLOCKS</span><strong>{study.length}</strong><p>{complete} completed in the current plan.</p></article><article><span className="field-label">WHAT THE STUDENT CHOSE TO PLAN</span>{study.length ? <ul>{study.map((task) => <li key={task.id}><span>{task.title}</span><small>{task.done ? "Complete" : "Planned"}</small></li>)}</ul> : <p>No study plan has been saved yet.</p>}</article></div>
      <section className="family-conversation"><span className="field-label">A QUESTION THAT OPENS A CONVERSATION</span><h2>“What would make this week feel more manageable?”</h2><p>Listen first. Offer practical help only after asking what would be useful.</p></section>
    </div>
  );
}
