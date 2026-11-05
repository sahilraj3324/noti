import { CADENCE, conditionById, conditions, events, sectionById } from "../data.js";
import RecipientPicker from "../components/RecipientPicker.jsx";
import { Button, Icon, money, Pill, Toggle } from "../components/ui.jsx";

const uid = () => `r-${Math.random().toString(36).slice(2, 9)}`;

const INTROS = {
  signals: "Spend movements and resize recommendations found during the nightly cost pull.",
  allocation: "Ownership changes — who a resource is charged to — whether or not its cost moves.",
  actions: "The whole life of an action item, not just the moment it is created.",
  people: "Membership, role and group changes other teams need to know about.",
};

export default function EventSection({ sectionId, rules, setRules, currentUserId }) {
  const section = sectionById[sectionId];
  return (
    <>
      <header className="sec-head">
        <div>
          <h2>{section.label}</h2>
          <p>{INTROS[sectionId]}</p>
        </div>
      </header>
      <div className="event-cards">
        {section.events.map((eventId) => (
          <EventCard key={eventId} eventId={eventId} rules={rules} setRules={setRules} currentUserId={currentUserId} />
        ))}
      </div>
    </>
  );
}

function EventCard({ eventId, rules, setRules, currentUserId }) {
  const meta = events[eventId];
  const mine = rules.filter((r) => r.event === eventId);
  const on = mine.some((r) => r.enabled);
  const cadence = CADENCE[meta.cadence];

  const patch = (id, change) =>
    setRules((all) => all.map((r) => (r.id === id ? { ...r, ...change, updatedAt: "just now" } : r)));
  const setAll = (enabled) =>
    setRules((all) => all.map((r) => (r.event === eventId ? { ...r, enabled, updatedAt: "just now" } : r)));
  const add = () =>
    setRules((all) => [...all, {
      id: uid(), event: eventId, accountId: null,
      condition: meta.metric ? "gt" : null, threshold: meta.metric ? 500 : null,
      recipients: currentUserId ? [currentUserId] : [], enabled: true,
      updatedBy: "Avery Vaughn", updatedAt: "just now",
    }]);
  const remove = (id) => setRules((all) => all.filter((r) => r.id !== id));

  return (
    <article className={`event-card ${on ? "" : "is-off"}`}>
      <header className="event-card__head">
        <div className="event-card__title">
          <h3>{meta.label}</h3>
          <p>{meta.blurb}</p>
        </div>
        <div className="event-card__switch">
          <span className={`event-card__state ${on ? "on" : ""}`}>{on ? "On" : "Off"}</span>
          <Toggle on={on} onChange={setAll} label={`${on ? "Turn off" : "Turn on"} ${meta.label}`} />
        </div>
      </header>

      <div className="event-card__body">
        {meta.metric ? (
          <div className="thresh-rows">
            {mine.map((r, i) => (
              <div className="thresh-row" key={r.id}>
                {mine.length > 1 && <span className="thresh-row__n">{i + 1}</span>}
                <div className="thresh-row__cond">
                  <select value={r.condition} aria-label="Condition"
                    onChange={(e) => patch(r.id, { condition: e.target.value })}>
                    {conditions.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}
                  </select>
                  <div className="thresh-row__num">
                    <i>$</i>
                    <input type="number" min="0" step="25" value={r.threshold} aria-label="Threshold amount"
                      onChange={(e) => patch(r.id, { threshold: Math.max(0, Number(e.target.value) || 0) })} />
                    <i>/day</i>
                  </div>
                </div>
                <div className="thresh-row__to">
                  <RecipientPicker inline value={r.recipients} currentUserId={currentUserId}
                    onChange={(recipients) => patch(r.id, { recipients })} />
                </div>
                <div className="thresh-row__tools">
                  <Toggle size="sm" on={r.enabled} label="Enable this threshold"
                    onChange={(v) => patch(r.id, { enabled: v })} />
                  {mine.length > 1 && <Button icon="trash" aria-label="Delete threshold" onClick={() => remove(r.id)} />}
                </div>
                <p className="thresh-row__sentence">
                  Alert when daily impact {conditionById[r.condition].label} {money(r.threshold)}.
                </p>
              </div>
            ))}
            <button type="button" className="link" onClick={add}>
              <Icon name="plus" size={13} /> Add another threshold
            </button>
          </div>
        ) : (
          mine.map((r) => (
            <div className="simple-rule" key={r.id}>
              <span className="simple-rule__label">Recipients</span>
              <RecipientPicker value={r.recipients} currentUserId={currentUserId}
                onChange={(recipients) => patch(r.id, { recipients })} />
            </div>
          ))
        )}

        <div className="event-card__meta">
          <div className="payload">
            <span className="label">The alert carries</span>
            <span className="payload__chips">
              {meta.payload.map((f) => <code key={f}>{f}</code>)}
            </span>
          </div>
          <Pill tone="neutral" icon="clock">{cadence.label}</Pill>
        </div>
        <p className="event-card__cadence">{cadence.detail}</p>
      </div>
    </article>
  );
}
