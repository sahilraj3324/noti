import { useMemo, useState } from "react";
import { accounts, accountName, conditionById, conditions, pctOf } from "../data.js";
import RecipientPicker from "./RecipientPicker.jsx";
import { Button, Icon, Meter, Modal, money, Pill } from "./ui.jsx";

const PRESETS = [50, 75, 80, 90, 100];
const uid = () => `r-${Math.random().toString(36).slice(2, 9)}`;

/**
 * One screen, three numbered steps, always visible — no wizard, no hidden
 * state. Creating a rule for several accounts at once makes one
 * account-scoped rule each (§3: the rule itself is account-scoped).
 */
export default function BudgetRuleEditor({ rule, preselect, rules, currentUserId, onSave, onClose }) {
  const editing = Boolean(rule);
  const [picked, setPicked] = useState(
    rule ? [rule.accountId] : preselect ? [preselect] : [],
  );
  const [condition, setCondition] = useState(rule?.condition ?? "gt");
  const [threshold, setThreshold] = useState(rule?.threshold ?? 80);
  const [recipients, setRecipients] = useState(rule?.recipients ?? (currentUserId ? [currentUserId] : []));
  const [q, setQ] = useState("");

  const cond = conditionById[condition];
  const valid = picked.length > 0 && recipients.length > 0 && threshold >= 1 && threshold <= 200;

  const covered = useMemo(() => {
    const map = {};
    for (const r of rules) {
      if (r.event !== "budget-threshold" || r.id === rule?.id) continue;
      (map[r.accountId] ??= []).push(r);
    }
    return map;
  }, [rules, rule]);

  const toggleAccount = (id) =>
    setPicked((p) => (editing ? [id] : p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const needle = q.trim().toLowerCase();
  const visible = accounts.filter(
    (a) => !needle || `${accountName(a)} ${a.ref}`.toLowerCase().includes(needle),
  );

  const duplicate = picked.some((id) =>
    (covered[id] ?? []).some((r) => r.threshold === threshold && r.condition === condition),
  );

  const save = () => {
    if (!valid) return;
    const base = { event: "budget-threshold", condition, threshold, recipients, enabled: true,
      updatedBy: "Avery Vaughn", updatedAt: "just now" };
    onSave(picked.map((accountId) => ({ ...(rule ?? {}), ...base, id: rule?.id ?? uid(), accountId })));
  };

  const summary = picked.length
    ? `${picked.length === 1 ? accountName(accounts.find((a) => a.id === picked[0])) : `${picked.length} accounts`} · ${cond.label} ${threshold}% → ${recipients.length || "no"} recipient${recipients.length === 1 ? "" : "s"}`
    : "Pick an account to start";

  return (
    <Modal wide
      title={editing ? "Edit budget alert" : "New budget alert"}
      subtitle="Alert when one cloud account passes a share of its own budget. Each account is judged on its own, never on the tenant total."
      onClose={onClose}
      footer={
        <>
          <p className="modal__summary">{summary}</p>
          <div className="modal__buttons">
            <Button variant="quiet" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!valid} onClick={save}>
              {editing ? "Save alert" : picked.length > 1 ? `Create ${picked.length} alerts` : "Create alert"}
            </Button>
          </div>
        </>
      }>

      {/* ── 1 · Account ─────────────────────────────────────────── */}
      <section className="step">
        <header className="step__head">
          <span className="step__n">1</span>
          <div>
            <h3>Which account?</h3>
            <p>{editing ? "This alert watches one account." : "Pick one or more. You get a separate alert for each."}</p>
          </div>
          {!editing && picked.length > 0 && <Pill tone="accent">{picked.length} selected</Pill>}
        </header>

        <div className="acct-search">
          <Icon name="search" size={14} />
          <input data-autofocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts…" aria-label="Search accounts" />
        </div>

        <div className="acct-grid">
          {visible.map((a) => {
            const pct = pctOf(a);
            const on = picked.includes(a.id);
            const has = (covered[a.id] ?? []).length;
            return (
              <button type="button" key={a.id} className={`acct ${on ? "is-on" : ""}`}
                onClick={() => toggleAccount(a.id)} aria-pressed={on}>
                <span className="acct__top">
                  <span className={`acct__box ${on ? "is-on" : ""}`}><Icon name="tick" size={11} /></span>
                  <span className={`acct__provider acct__provider--${a.provider.toLowerCase()}`}>{a.provider}</span>
                  <b>{a.name}</b>
                  {has === 0 && <Pill tone="warn">No alert yet</Pill>}
                </span>
                <span className="acct__meter">
                  <Meter pct={pct} height={6} markers={(covered[a.id] ?? []).map((r) => ({ at: r.threshold, title: `${r.threshold}%` }))} />
                </span>
                <span className="acct__figures">
                  <em>{pct}%</em> of {money(a.budget)} used · {money(a.spend)}
                </span>
              </button>
            );
          })}
          {visible.length === 0 && <p className="acct-none">No account matches “{q}”.</p>}
        </div>
      </section>

      {/* ── 2 · Threshold ───────────────────────────────────────── */}
      <section className="step">
        <header className="step__head">
          <span className="step__n">2</span>
          <div>
            <h3>When should it alert?</h3>
            <p>Measured against that account's own budget, after each daily cloud sync.</p>
          </div>
        </header>

        <div className="thresh">
          <div className="thresh__row">
            <div className="seg" role="radiogroup" aria-label="Comparison condition">
              {conditions.map((c) => (
                <button type="button" key={c.id} role="radio" aria-checked={condition === c.id}
                  className={condition === c.id ? "is-on" : ""} onClick={() => setCondition(c.id)}>
                  <i>{c.symbol}</i> {c.short}
                </button>
              ))}
            </div>
            <div className="thresh__num">
              <input type="number" min="1" max="200" value={threshold} aria-label="Threshold percentage"
                onChange={(e) => setThreshold(Math.max(1, Math.min(200, Number(e.target.value) || 0)))} />
              <span>%</span>
            </div>
          </div>

          <input className="slider" type="range" min="5" max="120" step="1" value={Math.min(threshold, 120)}
            aria-label="Threshold slider" onChange={(e) => setThreshold(Number(e.target.value))} />

          <div className="thresh__presets">
            {PRESETS.map((p) => (
              <button type="button" key={p} className={threshold === p ? "is-on" : ""} onClick={() => setThreshold(p)}>
                {p}%
              </button>
            ))}
            <span className="thresh__sentence">
              Alert when spend {cond.label} <b>{threshold}%</b> of budget
            </span>
          </div>
        </div>

        {picked.length > 0 && (
          <div className="preview">
            <p className="preview__head"><Icon name="clock" size={13} /> At today's spend</p>
            <ul>
              {picked.map((id) => {
                const a = accounts.find((x) => x.id === id);
                const pct = pctOf(a);
                const fires = cond.test(pct, threshold);
                return (
                  <li key={id} className={fires ? "fires" : ""}>
                    <span className="preview__name">{accountName(a)}</span>
                    <Meter pct={pct} height={6} markers={[{ at: threshold, matched: fires, title: `${threshold}%` }]} />
                    <span className="preview__pct">{pct}%</span>
                    <Pill tone={fires ? "neg" : "pos"} icon={fires ? "bell" : "tick"}>
                      {fires ? "Would alert tonight" : "Below threshold"}
                    </Pill>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {duplicate && (
          <p className="warn-line"><Icon name="alert" size={13} /> An alert with this exact threshold already exists on one of these accounts.</p>
        )}
      </section>

      {/* ── 3 · Recipients ──────────────────────────────────────── */}
      <section className="step">
        <header className="step__head">
          <span className="step__n">3</span>
          <div>
            <h3>Who gets it?</h3>
            <p>Recipients belong to this alert alone — a different threshold can notify a different team.</p>
          </div>
        </header>
        <RecipientPicker value={recipients} onChange={setRecipients} currentUserId={currentUserId} />
        {recipients.length === 0 && <p className="warn-line"><Icon name="alert" size={13} /> Add at least one recipient.</p>}
      </section>
    </Modal>
  );
}
