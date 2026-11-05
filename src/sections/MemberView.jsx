import {
  CADENCE, accountById, accountName, conditionById, events, personById, sections,
} from "../data.js";
import { Button, Callout, EmptyState, Icon, money, Pill, Toggle } from "../components/ui.jsx";

/**
 * §2 and §12: a normal user may only mute or unmute. Thresholds, conditions,
 * recipients and schedules stay with the admin rule, so everything else here
 * is read-only — shown, not editable, so the user can see why they get it.
 */
export default function MemberView({ rules, user, muted, setMuted }) {
  const reaches = (r) => r.recipients.includes(user.id) || r.recipients.some((id) => user.groups.includes(id));
  const mine = rules.filter((r) => r.enabled && reaches(r));

  const byEvent = new Map();
  for (const r of mine) {
    if (!byEvent.has(r.event)) byEvent.set(r.event, []);
    byEvent.get(r.event).push(r);
  }

  const eventIds = [...byEvent.keys()];
  const mutedCount = eventIds.filter((e) => muted.includes(e)).length;
  const toggle = (eventId, on) =>
    setMuted((m) => (on ? m.filter((x) => x !== eventId) : [...new Set([...m, eventId])]));

  const grouped = sections
    .filter((s) => s.events)
    .map((s) => ({ section: s, items: s.events.filter((e) => byEvent.has(e)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <header className="sec-head">
        <div>
          <h2>Your notifications</h2>
          <p>
            {eventIds.length - mutedCount} of {eventIds.length} turned on.
            Muting stops your copy only — the workspace rule and everyone else on it stay exactly as they are.
          </p>
        </div>
        {mutedCount > 0 && (
          <Button icon="bell" onClick={() => setMuted([])}>Unmute all ({mutedCount})</Button>
        )}
      </header>

      <Callout tone="info" icon="shield" title="Thresholds are set by your workspace admin">
        You cannot change a threshold, condition or recipient list here. That keeps your settings from quietly
        contradicting the rule an admin wrote. Need a different threshold? Ask an admin to add one.
      </Callout>

      {grouped.length === 0 && (
        <EmptyState icon="bellOff" title="No notifications reach you yet">
          Nobody has added you — or a group you belong to — to a notification rule.
        </EmptyState>
      )}

      {grouped.map(({ section, items }) => (
        <section className="member-group" key={section.id}>
          <h3 className="member-group__head">
            <Icon name={section.icon} size={14} /> {section.label}
          </h3>
          <ul className="member-list">
            {items.map((eventId) => {
              const meta = events[eventId];
              const rs = byEvent.get(eventId);
              const on = !muted.includes(eventId);
              const via = [...new Set(rs.flatMap((r) =>
                r.recipients.filter((id) => user.groups.includes(id)).map((id) => personById[id].name),
              ))];
              return (
                <li key={eventId} className={`member-row ${on ? "" : "is-muted"}`}>
                  <div className="member-row__copy">
                    <b>{meta.label}</b>
                    <p>{meta.blurb}</p>
                    <div className="member-row__rules">
                      {rs.map((r) => (
                        <span key={r.id} className="admin-rule">
                          <Icon name="shield" size={11} />
                          {describe(r)}
                        </span>
                      ))}
                      <span className="admin-rule admin-rule--plain">
                        <Icon name="clock" size={11} /> {CADENCE[meta.cadence].label}
                      </span>
                      {via.length > 0 && (
                        <span className="admin-rule admin-rule--plain">
                          <Icon name="users" size={11} /> via {via.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="member-row__switch">
                    <Pill tone={on ? "pos" : "muted"} icon={on ? "bell" : "bellOff"}>{on ? "On" : "Muted"}</Pill>
                    <Toggle on={on} onChange={(v) => toggle(eventId, v)}
                      label={`${on ? "Mute" : "Unmute"} ${meta.label}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function describe(rule) {
  const meta = events[rule.event];
  if (meta.scope === "account") {
    const a = accountById[rule.accountId];
    return `${accountName(a)} · ${conditionById[rule.condition].label} ${rule.threshold}% of budget`;
  }
  if (meta.metric === "amount") {
    return `Daily impact ${conditionById[rule.condition].label} ${money(rule.threshold)}`;
  }
  return "Every occurrence";
}
