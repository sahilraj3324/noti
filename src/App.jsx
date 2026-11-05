import { useEffect, useMemo, useState } from "react";
import { defaultRules, events, sections, users, workspace } from "./data.js";
import { Avatar, Button, Icon, Pill } from "./components/ui.jsx";
import Overview from "./sections/Overview.jsx";
import Budgets from "./sections/Budgets.jsx";
import EventSection from "./sections/EventSection.jsx";
import Delivery from "./sections/Delivery.jsx";
import Roadmap from "./sections/Roadmap.jsx";
import MemberView from "./sections/MemberView.jsx";

const clone = (v) => JSON.parse(JSON.stringify(v));

function diff(saved, now) {
  const a = new Map(saved.map((r) => [r.id, r]));
  const b = new Map(now.map((r) => [r.id, r]));
  let added = 0, removed = 0, changed = 0;
  for (const [id, r] of b) {
    if (!a.has(id)) added++;
    else if (JSON.stringify({ ...a.get(id), updatedAt: 0 }) !== JSON.stringify({ ...r, updatedAt: 0 })) changed++;
  }
  for (const id of a.keys()) if (!b.has(id)) removed++;
  return { added, removed, changed, total: added + removed + changed };
}

export default function App() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const [role, setRole] = useState("admin");
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.replace("#", "");
    return sections.some((s) => s.id === fromHash) ? fromHash : "overview";
  });

  const [rules, setRules] = useState(() => clone(defaultRules));
  const [savedRules, setSavedRules] = useState(() => clone(defaultRules));
  const [muted, setMuted] = useState([]);
  const [savedMuted, setSavedMuted] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (window.location.hash.replace("#", "") !== tab) window.location.hash = tab;
  }, [tab]);

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#", "");
      if (sections.some((s) => s.id === id)) setTab(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("quper-theme", theme); } catch { /* private mode */ }
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const user = users[role];
  const isAdmin = role === "admin";

  const ruleDiff = useMemo(() => diff(savedRules, rules), [savedRules, rules]);
  const muteDiff = useMemo(
    () => (JSON.stringify([...muted].sort()) === JSON.stringify([...savedMuted].sort()) ? 0 : 1),
    [muted, savedMuted],
  );
  const pending = isAdmin ? ruleDiff.total : muteDiff;

  const save = () => {
    setSavedRules(clone(rules));
    setSavedMuted([...muted]);
    setToast(isAdmin ? describeDiff(ruleDiff) : "Your notification preferences are saved.");
  };
  const discard = () => {
    setRules(clone(savedRules));
    setMuted([...savedMuted]);
  };

  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);
  const counts = useMemo(() => {
    const out = {};
    for (const s of sections) {
      if (!s.events) continue;
      const mine = rules.filter((r) => s.events.includes(r.event));
      out[s.id] = { total: mine.length, on: mine.filter((r) => r.enabled).length };
    }
    return out;
  }, [rules]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__left">
          <span className="brand"><Icon name="bell" size={15} /></span>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>{workspace.name}</span>
            <Icon name="arrow" size={12} />
            <span>Settings</span>
            <Icon name="arrow" size={12} />
            <b>Notifications</b>
          </nav>
        </div>
        <div className="topbar__right">
          <div className="preview-as" title="Prototype control: switch between the admin and member experience">
            <span>Preview as</span>
            <div className="seg seg--sm" role="radiogroup" aria-label="Preview role">
              <button type="button" role="radio" aria-checked={isAdmin} className={isAdmin ? "is-on" : ""}
                onClick={() => { setRole("admin"); setTab("overview"); }}>Admin</button>
              <button type="button" role="radio" aria-checked={!isAdmin} className={!isAdmin ? "is-on" : ""}
                onClick={() => setRole("member")}>Member</button>
            </div>
          </div>
          <Button icon={theme === "dark" ? "sun" : "moon"} aria-label="Switch theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
          <div className="who">
            <Avatar initials={user.initials} />
            <span><b>{user.name}</b><small>{user.role}</small></span>
          </div>
        </div>
      </header>

      <div className={`layout ${isAdmin ? "" : "layout--narrow"}`}>
        {isAdmin && (
          <aside className="rail">
            <p className="rail__label">Notification settings</p>
            <nav>
              {visibleSections.map((s) => (
                <button type="button" key={s.id} className={`rail__item ${tab === s.id ? "is-on" : ""}`}
                  onClick={() => setTab(s.id)} aria-current={tab === s.id ? "page" : undefined}>
                  <Icon name={s.icon} size={15} />
                  <span>{s.label}</span>
                  {counts[s.id] && (
                    <em className={counts[s.id].on === 0 ? "is-zero" : ""}>{counts[s.id].on}</em>
                  )}
                </button>
              ))}
            </nav>
            <div className="rail__note">
              <Icon name="clock" size={13} />
              <div>
                <b>Daily cadence</b>
                <p>Cloud alerts go out once a night, after the data pull. No instant option, by design.</p>
              </div>
            </div>
          </aside>
        )}

        <main className="content" key={`${role}-${tab}`}>
          {!isAdmin ? (
            <MemberView rules={rules} user={user} muted={muted} setMuted={setMuted} />
          ) : tab === "overview" ? (
            <Overview rules={rules} goTo={setTab} />
          ) : tab === "budgets" ? (
            <Budgets rules={rules} setRules={setRules} currentUserId={user.id} />
          ) : tab === "delivery" ? (
            <Delivery />
          ) : tab === "roadmap" ? (
            <Roadmap />
          ) : (
            <EventSection sectionId={tab} rules={rules} setRules={setRules} currentUserId={user.id} />
          )}
        </main>
      </div>

      {pending > 0 && (
        <div className="savebar" role="status">
          <span className="savebar__dot" />
          <p>
            <b>{isAdmin ? describeDiff(ruleDiff) : "Mute settings changed"}</b>
            <small>{isAdmin ? "Rules take effect from the next nightly run." : "Only your own delivery changes."}</small>
          </p>
          <div className="savebar__buttons">
            <Button variant="quiet" onClick={discard}>Discard</Button>
            <Button variant="primary" onClick={save}>Save changes</Button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="tick" size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

function describeDiff({ added, removed, changed, total }) {
  if (total === 0) return "No changes";
  const bits = [];
  if (added) bits.push(`${added} added`);
  if (changed) bits.push(`${changed} edited`);
  if (removed) bits.push(`${removed} removed`);
  return `${total} unsaved rule change${total === 1 ? "" : "s"} · ${bits.join(", ")}`;
}
