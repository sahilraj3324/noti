import { createContext, useContext, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const groups = [
  { id: "signals", icon: "⌁", label: "Cost signals", description: "Anomalies, drift and savings opportunities across AWS, Azure and GCP.", events: [
    ["cost-signal", "Signal detected", "Spend on a service or account moves outside its expected range.", "instant"],
    ["action-created", "Action created", "An action item is created from a cost signal for your team to review.", "instant"],
  ] },
  { id: "rightsizing", icon: "↔", label: "Rightsizing", description: "Recommendations to resize cloud resources based on utilization and demand.", events: [
    ["rightsizing-recommendation", "Rightsizing recommendation", "A resource has a recommendation ready for review.", "instant"],
    ["rightsizing-action-created", "Action created", "An action item is created from a rightsizing recommendation.", "instant"],
  ] },
  { id: "budgets", icon: "◒", label: "Budgets & forecasts", description: "Budgets you own or follow, across every tenant you can access.", events: [
    ["budget-threshold", "Budget threshold crossed", "Actual spend passes a threshold on a budget you own or follow.", "instant"],
  ] },
  { id: "actions", icon: "✓", label: "Action items", description: "Choose whether Quper notifies you about new action items.", events: [
    ["action-item", "Action item notifications", "Receive a notification when a new action item needs your attention.", "instant"],
  ] },
  { id: "people-access", icon: "♙", label: "People & access", description: "Workspace membership, role and group changes that another team may need to know about.", events: [
    ["people-user-added", "New user added", "A new user is added to the workspace.", "instant"],
    ["people-role-changed", "User role changed", "A user's workspace role or access level is changed.", "instant"],
    ["people-group-added", "User added to a group", "A user is added to a new workspace group.", "instant"],
  ] },
  { id: "data", icon: "◇", label: "Data platforms", description: "Warehouse, job and query health across your connected data platforms.", comingSoon: true, events: [] },
];

const initialPrefs = Object.fromEntries(groups.flatMap(group => group.events.map(event => {
  const hasNumericThreshold = event[0] === "cost-signal" || event[0] === "budget-threshold";
  return [event[0], {
    timing: event[3],
    threshold: event[0] === "cost-signal" ? 100 : event[0] === "budget-threshold" ? 80 : undefined,
    condition: hasNumericThreshold ? "=" : undefined,
    thresholdSchedule: hasNumericThreshold ? "once" : undefined,
    size: event[0] === "rightsizing-recommendation" ? "Medium" : undefined,
    recipients: event[0].startsWith("people-") ? ["HR"] : ["You"],
  }];
})));
const timeLabel = { instant: "On", daily: "Daily digest", weekly: "Weekly digest", off: "Off" };
const UserModeContext = createContext("admin");
const copy = value => JSON.parse(JSON.stringify(value));
const users = {
  admin: { name: "Avery Vaughn", email: "avery@xequalto.com", initials: "AV", role: "Workspace admin" },
  member: { name: "Priya Nair", email: "priya@xequalto.com", initials: "PN", role: "Normal user" },
};
const recipientDirectory = [
  { name: "HR", detail: "People Operations team" },
  { name: "Maya Shah", detail: "HR Business Partner · maya@xequalto.com" },
  { name: "Rohan Mehta", detail: "Engineering Manager · rohan@xequalto.com" },
  { name: "Ananya Rao", detail: "Finance Controller · ananya@xequalto.com" },
  { name: "Vikram Singh", detail: "Security Admin · vikram@xequalto.com" },
  { name: "Neha Kapoor", detail: "IT Operations · neha@xequalto.com" },
];

function App() {
  const [userMode, setUserMode] = useState("admin");
  const [prefsByUser, setPrefsByUser] = useState({ admin: copy(initialPrefs), member: copy(initialPrefs) });
  const prefs = prefsByUser[userMode];
  const setPrefs = value => setPrefsByUser(all => ({ ...all, [userMode]: typeof value === "function" ? value(all[userMode]) : value }));
  const [open, setOpen] = useState(null);
  const [area, setArea] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savedSection, setSavedSection] = useState(null);
  const update = (id, patch) => setPrefs(p => ({ ...p, [id]: { ...p[id], ...patch } }));
  const optional = groups.filter(g => !g.locked).flatMap(g => g.events);
  const onCount = optional.filter(e => prefs[e[0]].timing !== "off").length;
  const saveSection = id => { setSavedSection(id); setSaved(true); window.setTimeout(() => { setSaved(false); setSavedSection(null); }, 1300); };
  const user = users[userMode];

  return <UserModeContext.Provider value={userMode}><main>
    <div className="page-head">
      <div><p className="eyebrow">SETTINGS</p><h1>Notifications</h1><p>Choose which Quper notifications you want to receive.</p></div>
      <div className="profile"><span className="avatar">{user.initials}</span><span><b>{user.name}</b><small>{user.role} · {user.email}</small></span></div>
    </div>

    <div className="content">
      <div className="user-mode" aria-label="Notification settings user">
        <div><b>Settings for</b><span>{userMode === "admin" ? "Admin controls and workspace defaults" : "Your personal notification preferences"}</span></div>
        <div className="mode-switch"><button className={userMode === "admin" ? "selected" : ""} onClick={() => setUserMode("admin")}>Admin</button><button className={userMode === "member" ? "selected" : ""} onClick={() => setUserMode("member")}>Normal user</button></div>
      </div>
      <div className="summary">
        <p>{userMode === "admin" ? "Workspace defaults include" : "You’re getting"} <strong>{onCount} of {optional.length}</strong> notifications.{userMode === "member" && " You can mute or unmute each notification."}</p>
      </div>
      {saved && <div className="saved">✓&nbsp; Changes saved</div>}

      {groups.map((group, idx) => <NotificationGroup key={group.id} group={group} prefs={prefs} first={idx === 0} open={open} setOpen={setOpen} area={area} setArea={setArea} update={update} setPrefs={setPrefs} saved={savedSection === group.id} onSave={saveSection} />)}

    </div>
  </main></UserModeContext.Provider>;
}

function Section({ icon, title, description, children }) { return <section className="section"><div className="section-title"><h2><i>{icon}</i>{title}</h2><p>{description}</p></div><div>{children}</div></section>; }
function SaveSection({ id, saved, onSave }) { return <div className="section-save"><span>{saved ? "Changes saved" : "Review changes before saving"}</span><button className="dark" onClick={() => onSave(id)}>{saved ? "Saved ✓" : "Save changes"}</button></div>; }
function Toggle({ on, setOn, ariaLabel = "Toggle setting" }) { return <button aria-label={ariaLabel} onClick={() => setOn(!on)} className={'toggle '+(on?'on':'')}><span /></button>; }

function NotificationGroup({ group, prefs, first, open, setOpen, area, setArea, update, setPrefs, saved, onSave }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  const onN = group.events.filter(e => prefs[e[0]].timing !== "off").length;
  const bulk = action => {
    setPrefs(p => ({
      ...p,
      ...Object.fromEntries(
        group.events.map(e => [
          e[0],
          action === "off"
            ? { ...p[e[0]], timing: "off" }
            : action === "on"
              ? { ...p[e[0]], timing: "instant" }
            : action === "daily"
              ? { ...p[e[0]], timing: "daily" }
              : initialPrefs[e[0]],
        ]),
      ),
    }));
    setArea(null);
  };
  return <Section icon={group.icon} title={group.label} description={group.description}>
    {group.comingSoon ? <div className="panel coming-soon"><span>◇</span><div><b>Coming soon</b><p>Data platform notification preferences will be available here once your warehouse and job health data are connected.</p></div></div> : <>
      <div className="group-tools">{!group.locked && <div className="bulk-wrap"><button className="bulk" onClick={() => setArea(area===group.id?null:group.id)}><span className={'dot '+(onN===0?'grey':'')}></span>{onN===group.events.length?'All on':onN===0?'All off':`${onN} of ${group.events.length} on`}⌄</button>{area===group.id && <div className="bulk-menu"><strong>{group.label}</strong>{isNormalUser ? <button onClick={() => bulk(onN === 0 ? 'on' : 'off')}><b>{onN === 0 ? '♧ Unmute section' : '♧ Mute section'}</b><small>{onN === 0 ? 'Turns this notification section back on' : 'Stops notifications from this section'}</small></button> : <><button onClick={() => bulk('off')}><b>♧ Mute all</b><small>Stops all events in this area</small></button><button onClick={() => bulk('daily')}><b>▣ Send all as daily digest</b><small>Urgent notification timing stays unchanged</small></button></>}</div>}</div>}</div>
      {first && <div className={'column-head compact '+(isNormalUser?'member':'')}><span>Event</span><span>{isNormalUser ? 'Notification' : 'Timing'}</span></div>}
      <div className={'panel event-list '+(group.locked?'locked':'')}>{group.events.map(event => <EventRow key={event[0]} event={event} pref={prefs[event[0]]} open={open===event[0]} setOpen={setOpen} update={update} />)}</div>
      <SaveSection id={group.id} saved={saved} onSave={onSave} />
    </>}
  </Section>;
}

function EventRow({ event, pref, open, setOpen, update }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  const [id, title, description] = event;
  const active = pref.timing !== 'off';
  const toggleNotification = on => update(id, { timing: on ? "instant" : "off" });
  const details = id === "cost-signal" ? <SignalOptions pref={pref} update={update} /> : id === "action-created" || id === "rightsizing-action-created" ? <ActionCreatedOptions id={id} pref={pref} update={update} /> : id === "action-item" ? <ActionItemOptions pref={pref} update={update} /> : id === "budget-threshold" ? <BudgetOptions pref={pref} update={update} /> : id === "rightsizing-recommendation" ? <RightsizingOptions pref={pref} update={update} /> : id.startsWith("people-") ? <PeopleAccessOptions id={id} title={title} pref={pref} update={update} /> : <div className="event-options">
    <Option label="Recipients"><Recipients id={id} pref={pref} update={update} /></Option>
    <Option label="Timing"><div className="segmented">{['instant','daily','weekly'].map(t => <button key={t} className={pref.timing===t?'selected':''} onClick={() => update(id,{timing:t})}>{timeLabel[t]}</button>)}</div></Option>
  </div>;
  if (isNormalUser) return <div className="event"><div className="event-head member"><span className="event-copy"><b>{title}</b><small>{description}</small></span><Toggle ariaLabel={active ? `Mute ${title}` : `Unmute ${title}`} on={active} setOn={toggleNotification} /></div></div>;
  return <div className="event"><button className={'event-head compact '+(open?'opened':'')} onClick={() => setOpen(open?null:id)}><span className="event-copy"><b>{title}</b><small>{description}</small></span><span className={'timing '+(!active?'off':'')}>{timeLabel[active?pref.timing:'off']}</span><span className={'chevron '+(open?'up':'')}>⌄</span></button>
    {open && <div className="event-details">{details}</div>}
  </div>;
}
function Option({ label, children }) { return <div className="option"><label>{label}</label><div>{children}</div></div>; }

function ThresholdFields({ value, min, max, step, prefix = "", suffix = "", condition = "=", schedule = "once", onChange, ariaPrefix }) {
  return <div className="threshold-fields">
    <label className="threshold-input-field">
      <span>Threshold</span>
      <span className="number-input">{prefix && <i>{prefix}</i>}<input aria-label={`${ariaPrefix} value`} type="number" min={min} max={max} step={step} value={value} onChange={e => onChange({ value: Number(e.target.value) })} />{suffix && <i>{suffix}</i>}</span>
    </label>
    <label className="threshold-field">
      <span>Condition</span>
      <span className="select-input"><select aria-label={`${ariaPrefix} condition`} value={condition} onChange={e => onChange({ condition: e.target.value })}>
        <option value="=">Equals</option>
        <option value=">">Above</option>
      </select></span>
    </label>
    <label className="threshold-field schedule-field">
      <span>Schedule</span>
      <span className="select-input"><select aria-label={`${ariaPrefix} schedule`} value={schedule} onChange={e => onChange({ thresholdSchedule: e.target.value })}>
        <option value="once">Once when reached</option>
        <option value="daily">Daily</option>
      </select></span>
    </label>
  </div>;
}

function RecipientPicker({ recipients, onChange, helper = "Choose who receives this notification." }) {
  const userMode = useContext(UserModeContext);
  const user = users[userMode];
  const isNormalUser = userMode === "member";
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const directory = [{ name: "You", detail: `${user.name} · ${user.email}` }, ...recipientDirectory];
  const addRecipient = () => {
    if (!selectedRecipient || recipients.some(recipient => recipient.toLowerCase() === selectedRecipient.toLowerCase())) return;
    onChange([...recipients, selectedRecipient]);
    setSelectedRecipient("");
  };
  return <div className="third-party-recipients">
    <div className="recipient-chips">{recipients.map(recipient => <span key={recipient}>{recipient}{!isNormalUser && <button aria-label={`Remove ${recipient}`} onClick={() => onChange(recipients.filter(item => item !== recipient))}>×</button>}</span>)}</div>
    {!isNormalUser ? <div className="recipient-add"><select aria-label="Choose a notification recipient" value={selectedRecipient} onChange={e => setSelectedRecipient(e.target.value)}><option value="">Select a user or team…</option>{directory.map(recipient => <option key={recipient.name} value={recipient.name} disabled={recipients.includes(recipient.name)}>{recipient.name} — {recipient.detail}{recipients.includes(recipient.name) ? " (added)" : ""}</option>)}</select><button disabled={!selectedRecipient} onClick={addRecipient}>Add recipient</button></div> : <small>Personal delivery · managed by the workspace admin</small>}
    <p>{helper}</p>
  </div>;
}

function Recipients({ id, pref, update }) {
  return <RecipientPicker recipients={pref.recipients ?? ["You"]} onChange={recipients => update(id, { recipients })} />;
}

function SignalOptions({ pref, update }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  const [extraRules, setExtraRules] = useState([]);
  const threshold = pref.threshold ?? 100;
  return <div className="event-options signal-options">
    <Option label="Threshold">
      <div className="threshold-control">
        <div className="threshold-copy"><span>Enter the daily impact amount, then choose the condition and schedule.</span></div>
        <ThresholdFields value={threshold} min={0} max={1000} step={25} prefix="$" suffix="/day" condition={pref.condition} schedule={pref.thresholdSchedule} ariaPrefix="Signal threshold" onChange={patch => update("cost-signal", { ...(patch.value !== undefined ? { threshold: patch.value } : {}), condition: patch.condition ?? pref.condition, thresholdSchedule: patch.thresholdSchedule ?? pref.thresholdSchedule })} />
      </div>
    </Option>
    {!isNormalUser && <><Option label="Recipients"><Recipients id="cost-signal" pref={pref} update={update} /></Option>
    <Option label="More conditions">
      <div className="extra-rules">
        {extraRules.map((rule, index) => <div className="extra-rule" key={rule.id}>
          <div className="extra-rule-head"><b>Additional condition {index + 1}</b><button aria-label={`Remove additional condition ${index + 1}`} onClick={() => setExtraRules(rules => rules.filter(item => item.id !== rule.id))}>Remove</button></div>
          <ThresholdFields value={rule.threshold} min={0} max={1000} step={25} prefix="$" suffix="/day" condition={rule.condition} schedule={rule.thresholdSchedule} ariaPrefix={`Additional signal threshold ${index + 1}`} onChange={patch => setExtraRules(rules => rules.map(item => item.id === rule.id ? { ...item, ...(patch.value !== undefined ? { threshold: patch.value } : {}), ...(patch.condition ? { condition: patch.condition } : {}), ...(patch.thresholdSchedule ? { thresholdSchedule: patch.thresholdSchedule } : {}) } : item))} />
          <div className="nested-field"><span>Recipients</span><RecipientPicker recipients={rule.recipients ?? ["You"]} onChange={recipients => setExtraRules(rules => rules.map(item => item.id === rule.id ? { ...item, recipients } : item))} /></div>
        </div>)}
        <button className="add-condition" onClick={() => setExtraRules(rules => [...rules, { id: crypto.randomUUID(), threshold: 250, condition: "=", thresholdSchedule: "once", recipients: ["You"] }])}>+ Add more condition</button>
      </div>
    </Option></>}
  </div>;
}

function ActionCreatedOptions({ id, pref, update }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  const enabled = pref.timing !== "off";
  return <div className="event-options action-options">
    <Option label="Action creation">
      <div className="inline-toggle"><div><b>Notify when an action is created</b><span>Send a notification when Quper creates a new action from this recommendation.</span></div><Toggle on={enabled} setOn={on => update(id, { timing: on ? "instant" : "off" })} /></div>
    </Option>
    {!isNormalUser && <Option label="Recipients"><Recipients id={id} pref={pref} update={update} /></Option>}
  </div>;
}

function ActionItemOptions({ pref, update }) {
  const enabled = pref.timing !== "off";
  return <div className="event-options action-options">
    <Option label="Notifications">
      <div className="inline-toggle"><div><b>Action item notifications</b><span>Turn notifications for new action items on or off.</span></div><Toggle on={enabled} setOn={on => update("action-item", { timing: on ? "instant" : "off" })} /></div>
    </Option>
  </div>;
}

function PeopleAccessOptions({ id, title, pref, update }) {
  const enabled = pref.timing !== "off";
  return <div className="event-options people-options">
    <Option label="Notification">
      <div className="inline-toggle"><div><b>{title}</b><span>This system notification is sent when the event occurs.</span></div><Toggle on={enabled} setOn={on => update(id, { timing: on ? "instant" : "off" })} /></div>
    </Option>
    <Option label="Recipients"><ThirdPartyRecipients id={id} pref={pref} update={update} /></Option>
  </div>;
}

function ThirdPartyRecipients({ id, pref, update }) {
  return <RecipientPicker recipients={pref.recipients ?? ["HR"]} onChange={recipients => update(id, { recipients })} helper="Notify another person or team, such as HR." />;
}

function RightsizingOptions({ pref, update }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  return <div className="event-options rightsizing-options">
    <Option label="Threshold">
      <div className="size-picker">{["Low", "Medium", "High"].map(size => <button key={size} className={pref.size === size ? "selected" : ""} onClick={() => update("rightsizing-recommendation", { size })}>{size}</button>)}</div>
    </Option>
    {!isNormalUser && <Option label="Recipients"><Recipients id="rightsizing-recommendation" pref={pref} update={update} /></Option>}
  </div>;
}

function BudgetOptions({ pref, update }) {
  const isNormalUser = useContext(UserModeContext) === "member";
  const [extraRules, setExtraRules] = useState([]);
  const threshold = pref.threshold ?? 80;
  return <div className="event-options budget-options">
    <Option label="Threshold">
      <div className="threshold-control">
        <div className="threshold-copy"><span>Enter the budget percentage, then choose the condition and schedule.</span></div>
        <ThresholdFields value={threshold} min={0} max={100} step={5} suffix="%" condition={pref.condition} schedule={pref.thresholdSchedule} ariaPrefix="Budget threshold" onChange={patch => update("budget-threshold", { ...(patch.value !== undefined ? { threshold: patch.value } : {}), condition: patch.condition ?? pref.condition, thresholdSchedule: patch.thresholdSchedule ?? pref.thresholdSchedule })} />
      </div>
    </Option>
    {!isNormalUser && <><Option label="Recipients"><Recipients id="budget-threshold" pref={pref} update={update} /></Option>
    <Option label="More thresholds">
      <div className="extra-rules">
        {extraRules.map((rule, index) => <div className="extra-rule" key={rule.id}>
          <div className="extra-rule-head"><b>Additional threshold {index + 1}</b><button aria-label={`Remove additional threshold ${index + 1}`} onClick={() => setExtraRules(rules => rules.filter(item => item.id !== rule.id))}>Remove</button></div>
          <ThresholdFields value={rule.threshold} min={0} max={100} step={5} suffix="%" condition={rule.condition} schedule={rule.thresholdSchedule} ariaPrefix={`Additional budget threshold ${index + 1}`} onChange={patch => setExtraRules(rules => rules.map(item => item.id === rule.id ? { ...item, ...(patch.value !== undefined ? { threshold: patch.value } : {}), ...(patch.condition ? { condition: patch.condition } : {}), ...(patch.thresholdSchedule ? { thresholdSchedule: patch.thresholdSchedule } : {}) } : item))} />
          <div className="nested-field"><span>Recipients</span><RecipientPicker recipients={rule.recipients ?? ["You"]} onChange={recipients => setExtraRules(rules => rules.map(item => item.id === rule.id ? { ...item, recipients } : item))} /></div>
        </div>)}
        <button className="add-condition" onClick={() => setExtraRules(rules => [...rules, { id: crypto.randomUUID(), threshold: 90, condition: "=", thresholdSchedule: "once", recipients: ["You"] }])}>+ Add more threshold</button>
      </div>
    </Option></>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
