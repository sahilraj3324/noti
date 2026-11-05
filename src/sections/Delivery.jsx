import { accountById, accountName, events, lastRun, nameOf, queueStatuses, workspace } from "../data.js";
import { Icon, Pill } from "../components/ui.jsx";

const CHANNELS = [
  { id: "inapp", icon: "bell", name: "In-app", detail: "Appears in the notification tray for every recipient. Always on." },
  { id: "email", icon: "mail", name: "Email", detail: "One message per recipient per run, with repeated changes merged." },
];

const STEPS = [
  { n: 1, title: "Pull cloud data", detail: "Cost, usage and allocation data land from AWS, Azure and GCP." },
  { n: 2, title: "Compare", detail: "Budgets, allocations and previous snapshots are diffed against the new data." },
  { n: 3, title: "Queue", detail: "A record is written for every matched rule before anything is sent." },
  { n: 4, title: "Deduplicate", detail: "Repeat changes merge; a recipient matching several rules gets one message." },
  { n: 5, title: "Send", detail: "One after-hours run delivers the day's notifications." },
  { n: 6, title: "Record the result", detail: "Each record is marked sent, failed or muted, with the reason." },
];

export default function Delivery() {
  return (
    <>
      <header className="sec-head">
        <div>
          <h2>Delivery &amp; processing</h2>
          <p>How a matched rule turns into a message. These settings are system-managed — there is nothing here to configure, by design.</p>
        </div>
      </header>

      <div className="channels">
        {CHANNELS.map((c) => (
          <div className="channel" key={c.id}>
            <span className="channel__icon"><Icon name={c.icon} size={16} /></span>
            <div>
              <b>{c.name}</b>
              <p>{c.detail}</p>
            </div>
            <Pill tone="pos" icon="tick">Enabled</Pill>
          </div>
        ))}
        <div className="channel is-off">
          <span className="channel__icon"><Icon name="send" size={16} /></span>
          <div>
            <b>Teams and Slack</b>
            <p>Out of the initial release until per-user delivery is designed. No webhook fallback.</p>
          </div>
          <Pill tone="muted">Not available</Pill>
        </div>
      </div>

      <section className="panel">
        <header className="panel__head">
          <h3>The daily run</h3>
          <span className="panel__meta">Next: {workspace.nextRun}</span>
        </header>
        <ol className="steps-rail">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="steps-rail__n">{s.n}</span>
              <b>{s.title}</b>
              <p>{s.detail}</p>
            </li>
          ))}
        </ol>
        <p className="panel__foot">
          Changes made inside Quper — a saved allocation edit, an action moving stage — create a one-time
          notification straight away. Nothing anywhere promises “instant”, because cloud data is not real-time.
        </p>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h3>Notification queue</h3>
          <span className="panel__meta">Last run finished {lastRun.finished}</span>
        </header>
        <div className="legend">
          {queueStatuses.map((s) => (
            <span key={s.id} className={`legend__item legend__item--${s.id}`}>
              <i /> {s.label}
              <b>{lastRun.counts[s.id] ?? 0}</b>
            </span>
          ))}
        </div>
        <table className="queue">
          <thead>
            <tr><th>Record</th><th>Event</th><th>Scope</th><th>Recipients</th><th>Status</th></tr>
          </thead>
          <tbody>
            {lastRun.records.map((r) => (
              <tr key={r.id}>
                <td><code>{r.id}</code></td>
                <td>
                  <b>{events[r.event].label}</b>
                  <small>{r.note}</small>
                </td>
                <td>{r.accountId ? accountName(accountById[r.accountId]) : <span className="dim">Workspace</span>}</td>
                <td>{r.recipients.map(nameOf).join(", ")}</td>
                <td><span className={`status status--${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
