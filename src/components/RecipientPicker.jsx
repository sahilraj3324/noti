import { useEffect, useRef, useState } from "react";
import { directory, personById } from "../data.js";
import { Icon } from "./ui.jsx";

/**
 * Recipients are stored on the rule itself (§6: "Recipient and threshold
 * configuration must be stored with the rule, not inferred globally").
 */
export default function RecipientPicker({ value, onChange, currentUserId, readOnly = false, inline = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const needle = q.trim().toLowerCase();
  const matches = directory.filter(
    (p) => !needle || p.name.toLowerCase().includes(needle) || p.detail.toLowerCase().includes(needle),
  );
  const people = matches.filter((p) => p.kind === "user");
  const groups = matches.filter((p) => p.kind === "group");

  const row = (p) => (
    <button type="button" key={p.id} className={`rp__row ${value.includes(p.id) ? "is-on" : ""}`}
      onClick={() => toggle(p.id)} role="option" aria-selected={value.includes(p.id)}>
      <span className={`rp__mark rp__mark--${p.kind}`}>
        {p.kind === "group" ? <Icon name="users" size={12} /> : initialsOf(p.name)}
      </span>
      <span className="rp__meta">
        <b>{p.name}{p.id === currentUserId ? " (you)" : ""}</b>
        <small>{p.detail}</small>
      </span>
      <span className="rp__check"><Icon name="tick" size={13} /></span>
    </button>
  );

  return (
    <div className={`rp ${inline ? "rp--inline" : ""}`} ref={wrap}>
      <div className="rp__chips">
        {value.length === 0 && <span className="rp__none">No recipients yet</span>}
        {value.map((id) => (
          <span key={id} className={`chip chip--${personById[id]?.kind ?? "user"}`}>
            {personById[id]?.kind === "group" && <Icon name="users" size={11} />}
            {personById[id]?.name ?? id}
            {id === currentUserId && <i>you</i>}
            {!readOnly && (
              <button type="button" aria-label={`Remove ${personById[id]?.name ?? id}`} onClick={() => toggle(id)}>
                <Icon name="close" size={11} />
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <button type="button" className="chip chip--add" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name="plus" size={12} /> Add
          </button>
        )}
      </div>

      {open && (
        <div className="rp__pop" role="listbox" aria-label="Choose recipients">
          <div className="rp__search">
            <Icon name="search" size={14} />
            <input data-autofocus autoFocus value={q} placeholder="Search people and groups…"
              onChange={(e) => setQ(e.target.value)} aria-label="Search recipients" />
          </div>
          <div className="rp__list">
            {currentUserId && !value.includes(currentUserId) && !needle && (
              <button type="button" className="rp__quick" onClick={() => toggle(currentUserId)}>
                <Icon name="plus" size={13} /> Add me
              </button>
            )}
            {people.length > 0 && <p className="rp__group">People</p>}
            {people.map(row)}
            {groups.length > 0 && <p className="rp__group">Groups</p>}
            {groups.map(row)}
            {matches.length === 0 && <p className="rp__empty">Nobody matches “{q}”.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const initialsOf = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");
