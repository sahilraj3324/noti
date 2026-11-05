import {
  accountName, accounts, conditionById, events, lastRun, pctOf, sections, workspace,
} from "../data.js";
import { Button, Callout, Icon, Meter, Pill } from "../components/ui.jsx";

export default function Overview({ rules, goTo }) {
  const active = rules.filter((r) => r.enabled);
  const budgetRules = rules.filter((r) => r.event === "budget-threshold");
  const covered = new Set(budgetRules.map((r) => r.accountId));
  const uncovered = accounts.filter((a) => !covered.has(a.id));
  const reach = new Set(active.flatMap((r) => r.recipients));
  const noRecipients = rules.filter((r) => r.enabled && r.recipients.length === 0);

  const breaching = accounts.filter((a) =>
    budgetRules.some((r) => r.accountId === a.id && r.enabled && conditionById[r.condition].test(pctOf(a), r.threshold)),
  );

  return (
    <>
      <header className="sec-head">
        <div>
          <h2>Overview</h2>
          <p>{workspace.name} · {workspace.tenant}. Last cloud sync {workspace.lastSync}; next delivery run {workspace.nextRun}.</p>
        </div>
      </header>

      <div className="tiles">
        <Tile value={active.length} label="Active rules" sub={`${rules.length - active.length} paused`} />
        <Tile value={`${covered.size}/${accounts.length}`} label="Accounts with a budget alert"
          tone={uncovered.length ? "warn" : "pos"} sub={uncovered.length ? `${uncovered.length} uncovered` : "All covered"} />
        <Tile value={reach.size} label="People and groups notified" sub="across every rule" />
        <Tile value={lastRun.counts.sent} label="Sent in the last run" tone="pos"
          sub={`${lastRun.counts.failed} failed · ${lastRun.counts.muted} muted`} />
      </div>

      {(uncovered.length > 0 || noRecipients.length > 0 || breaching.length > 0) && (
        <div className="attention">
          {breaching.length > 0 && (
            <Callout tone="warn" icon="bell" title={`${breaching.length} account${breaching.length === 1 ? " is" : "s are"} over a budget threshold right now`}
              actions={<Button onClick={() => goTo("budgets")}>Review budgets</Button>}>
              {breaching.map(accountName).join(", ")} will alert in tonight's run.
            </Callout>
          )}
          {uncovered.length > 0 && (
            <Callout tone="warn" icon="alert" title={`${uncovered.length} cloud account${uncovered.length === 1 ? " has" : "s have"} no budget alert`}
              actions={<Button onClick={() => goTo("budgets")}>Add alerts</Button>}>
              {uncovered.map(accountName).join(", ")} can go over budget without anyone hearing about it.
            </Callout>
          )}
          {noRecipients.length > 0 && (
            <Callout tone="neg" icon="alert" title={`${noRecipients.length} active rule${noRecipients.length === 1 ? " has" : "s have"} no recipient`}>
              A rule with no recipient is evaluated and then goes nowhere.
            </Callout>
          )}
        </div>
      )}

      <section className="panel">
        <header className="panel__head">
          <h3>Rules by area</h3>
        </header>
        <ul className="area-list">
          {sections.filter((s) => s.events).map((s) => {
            const mine = rules.filter((r) => s.events.includes(r.event));
            const on = mine.filter((r) => r.enabled).length;
            return (
              <li key={s.id}>
                <span className="area-list__icon"><Icon name={s.icon} size={15} /></span>
                <span className="area-list__name">
                  <b>{s.label}</b>
                  <small>{s.events.map((e) => events[e].label).join(" · ")}</small>
                </span>
                <Pill tone={on === 0 ? "muted" : "pos"}>{on === 0 ? "All off" : `${on} active`}</Pill>
                <Button icon="arrow" aria-label={`Open ${s.label}`} onClick={() => goTo(s.id)} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h3>Last delivery run</h3>
          <span className="panel__meta">{lastRun.finished}</span>
        </header>
        <div className="run-bar">
          {Object.entries(lastRun.counts).filter(([, n]) => n > 0).map(([k, n]) => (
            <span key={k} className={`run-bar__seg run-bar__seg--${k}`} style={{ flexGrow: n }} title={`${n} ${k}`}>
              <b>{n}</b> {k}
            </span>
          ))}
        </div>
        <p className="panel__foot">
          Cloud-driven rules are evaluated once, after the daily data pull — so a threshold you are still tuning
          never floods anyone's inbox. <button type="button" className="link" onClick={() => goTo("delivery")}>See the queue</button>
        </p>
      </section>
    </>
  );
}

function Tile({ value, label, sub, tone = "neutral" }) {
  return (
    <div className="tile">
      <b className={`tile__value tile__value--${tone}`}>{value}</b>
      <span className="tile__label">{label}</span>
      {sub && <small>{sub}</small>}
    </div>
  );
}
