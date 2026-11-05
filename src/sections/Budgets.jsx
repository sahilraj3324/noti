import { useMemo, useState } from "react";
import {
  accountById, accountName, accounts, conditionById, nameOf, pctOf, personById, tenantTotals,
} from "../data.js";
import BudgetRuleEditor from "../components/BudgetRuleEditor.jsx";
import { Button, Callout, EmptyState, Icon, Meter, money, Pill, Toggle } from "../components/ui.jsx";

export default function Budgets({ rules, setRules, currentUserId }) {
  const [editor, setEditor] = useState(null); // {rule} | {preselect} | {}
  const [showAll, setShowAll] = useState(false);

  const budgetRules = rules.filter((r) => r.event === "budget-threshold");
  const byAccount = useMemo(() => {
    const map = new Map();
    for (const r of budgetRules) {
      if (!map.has(r.accountId)) map.set(r.accountId, []);
      map.get(r.accountId).push(r);
    }
    for (const list of map.values()) list.sort((a, b) => a.threshold - b.threshold);
    return map;
  }, [budgetRules]);

  const monitored = accounts.filter((a) => byAccount.has(a.id));
  const unmonitored = accounts.filter((a) => !byAccount.has(a.id));
  const tenantPct = Math.round((tenantTotals.spend / tenantTotals.budget) * 100);

  const breaching = monitored.filter((a) =>
    (byAccount.get(a.id) ?? []).some((r) => r.enabled && conditionById[r.condition].test(pctOf(a), r.threshold)),
  );

  const saveRules = (next) =>
    setRules((all) => {
      const ids = new Set(next.map((r) => r.id));
      const kept = all.filter((r) => !ids.has(r.id));
      return [...kept, ...next];
    });

  return (
    <>
      <header className="sec-head">
        <div>
          <h2>Budget alerts</h2>
          <p>Each alert watches one cloud account against its own budget. Add as many thresholds per account as you need — every one keeps its own recipients.</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor({})}>New budget alert</Button>
      </header>

      <div className="tenant-strip">
        <div className="tenant-strip__total">
          <p className="label">Tenant spend this month</p>
          <div className="tenant-strip__figures">
            <b>{money(tenantTotals.spend)}</b>
            <span>of {money(tenantTotals.budget)}</span>
            <Pill tone={tenantPct >= 80 ? "warn" : "pos"}>{tenantPct}%</Pill>
          </div>
          <Meter pct={tenantPct} height={6} />
        </div>
        <div className="tenant-strip__stats">
          <Stat value={budgetRules.filter((r) => r.enabled).length} label="Active alerts" />
          <Stat value={`${monitored.length}/${accounts.length}`} label="Accounts covered"
            tone={unmonitored.length ? "warn" : "pos"} />
          <Stat value={breaching.length} label="Over threshold today" tone={breaching.length ? "neg" : "pos"} />
        </div>
      </div>

      {breaching.length > 0 && tenantPct < 80 && (
        <Callout tone="warn" icon="alert" title={`The tenant total is only ${tenantPct}% — but ${breaching.map(accountName).join(", ")} is already over its threshold.`}>
          That is exactly why these alerts are account-scoped: healthy spend in one account would otherwise hide an
          over-budget account next to it.
        </Callout>
      )}

      <div className="acct-cards">
        {monitored.map((a) => (
          <AccountCard key={a.id} account={a} rules={byAccount.get(a.id)} setRules={setRules}
            onEdit={(rule) => setEditor({ rule })} onAdd={() => setEditor({ preselect: a.id })} />
        ))}
        {monitored.length === 0 && (
          <EmptyState icon="wallet" title="No budget alerts yet"
            action={<Button variant="primary" icon="plus" onClick={() => setEditor({})}>New budget alert</Button>}>
            Pick an account, set the share of its budget that should raise an alarm, and choose who hears about it.
          </EmptyState>
        )}
      </div>

      {unmonitored.length > 0 && (
        <section className="unmonitored">
          <header>
            <span className="unmonitored__title">
              <Icon name="alert" size={14} />
              <b>{unmonitored.length} account{unmonitored.length === 1 ? "" : "s"} with no budget alert</b>
            </span>
            <button type="button" className="link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Hide" : "Show"} <Icon name="chevron" size={14} className={showAll ? "flip" : ""} />
            </button>
          </header>
          {showAll && (
            <ul>
              {unmonitored.map((a) => (
                <li key={a.id}>
                  <span className={`acct__provider acct__provider--${a.provider.toLowerCase()}`}>{a.provider}</span>
                  <b>{a.name}</b>
                  <Meter pct={pctOf(a)} height={6} />
                  <span className="mono">{pctOf(a)}%</span>
                  <Button icon="plus" onClick={() => setEditor({ preselect: a.id })}>Add alert</Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {editor && (
        <BudgetRuleEditor rule={editor.rule} preselect={editor.preselect} rules={rules}
          currentUserId={currentUserId}
          onClose={() => setEditor(null)}
          onSave={(next) => { saveRules(next); setEditor(null); }} />
      )}
    </>
  );
}

function Stat({ value, label, tone = "neutral" }) {
  return (
    <div className="stat">
      <b className={`stat__value stat__value--${tone}`}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function AccountCard({ account, rules, setRules, onEdit, onAdd }) {
  const pct = pctOf(account);
  const matched = rules.filter((r) => r.enabled && conditionById[r.condition].test(pct, r.threshold));
  const overlap = matched.length > 1;
  const shared = overlap
    ? [...new Set(matched.flatMap((r) => r.recipients))].filter(
        (id) => matched.filter((r) => r.recipients.includes(id)).length > 1,
      )
    : [];

  const patch = (id, change) =>
    setRules((all) => all.map((r) => (r.id === id ? { ...r, ...change, updatedAt: "just now" } : r)));
  const remove = (id) => setRules((all) => all.filter((r) => r.id !== id));

  return (
    <article className={`acct-card ${matched.length ? "is-breaching" : ""}`}>
      <header className="acct-card__head">
        <div className="acct-card__id">
          <span className={`acct__provider acct__provider--${account.provider.toLowerCase()}`}>{account.provider}</span>
          <h3>{account.name}</h3>
          <code>{account.ref}</code>
        </div>
        <div className="acct-card__spend">
          <b className={pct >= 100 ? "neg" : pct >= 80 ? "warn" : ""}>{pct}%</b>
          <span>{money(account.spend)} of {money(account.budget)}</span>
        </div>
      </header>

      <Meter pct={pct} height={10}
        markers={rules.map((r) => ({
          at: r.threshold,
          matched: r.enabled && conditionById[r.condition].test(pct, r.threshold),
          muted: !r.enabled,
          title: `${conditionById[r.condition].short} ${r.threshold}%`,
        }))} />

      <ul className="rule-rows">
        {rules.map((r) => {
          const fires = r.enabled && conditionById[r.condition].test(pct, r.threshold);
          return (
            <li key={r.id} className={`rule-row ${r.enabled ? "" : "is-off"}`}>
              <span className="rule-row__cond">
                <i>{conditionById[r.condition].symbol}</i>
                <b>{r.threshold}%</b>
              </span>
              <span className="rule-row__to">
                <span className="rule-row__arrow"><Icon name="arrow" size={13} /></span>
                <span className="rule-row__people">
                  {r.recipients.map((id) => (
                    <span key={id} className={`chip chip--sm chip--${personById[id]?.kind ?? "user"}`}>
                      {personById[id]?.kind === "group" && <Icon name="users" size={10} />}
                      {nameOf(id)}
                    </span>
                  ))}
                </span>
              </span>
              <span className="rule-row__state">
                {!r.enabled ? <Pill tone="muted" icon="bellOff">Paused</Pill>
                  : fires ? <Pill tone="neg" icon="bell">Alerting</Pill>
                  : <Pill tone="pos" icon="tick">Watching</Pill>}
              </span>
              <span className="rule-row__tools">
                <Toggle size="sm" on={r.enabled} label={`${r.enabled ? "Pause" : "Resume"} ${account.name} ${r.threshold}% alert`}
                  onChange={(v) => patch(r.id, { enabled: v })} />
                <Button icon="edit" aria-label="Edit alert" onClick={() => onEdit(r)} />
                <Button icon="trash" aria-label="Delete alert" onClick={() => remove(r.id)} />
              </span>
            </li>
          );
        })}
      </ul>

      {overlap && (
        <p className="overlap">
          <Icon name="info" size={13} />
          {matched.length} thresholds match at {pct}%. Each sends to its own recipients
          {shared.length > 0 && <>, and {shared.map(nameOf).join(", ")} {shared.length === 1 ? "gets" : "get"} one message instead of {matched.length}</>}.
        </p>
      )}

      <footer className="acct-card__foot">
        <button type="button" className="link" onClick={onAdd}><Icon name="plus" size={13} /> Add threshold</button>
        <span className="acct-card__meta">Updated {rules[0].updatedAt} by {rules[0].updatedBy}</span>
      </footer>
    </article>
  );
}
