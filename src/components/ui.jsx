import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ── Icons ─────────────────────────────────────────────────────────── */

const PATHS = {
  gauge: "M12 14.5 15.5 9M4.2 18a9 9 0 1 1 15.6 0",
  wallet: "M3 7.5A2.5 2.5 0 0 1 5.5 5H17a2 2 0 0 1 2 2v1M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2m0-5h-4a2.5 2.5 0 0 0 0 5h4v-5Z",
  pulse: "M3 12h3.5l2.5-7 4 14 2.5-7H21",
  split: "M4 7h4l4 10h8M20 7h-4l-1.6 4M18 4.5 20.5 7 18 9.5M18 14.5l2.5 2.5L18 19.5",
  check: "M4.5 6.5h9M4.5 12h9M4.5 17.5h5M15 16.5l2 2 4-4.5",
  tick: "M5 12.5 9.5 17 19 7",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19m13-9.5h4M19 7.5v4M13.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z",
  send: "M4 12 20 5l-7 15-2.5-6.5L4 12Z",
  map: "M9 4 3 6.5v13L9 17m0-13 6 3m-6-3v13m6-10 6-2.5v13L15 17m0-10v10m-6 0 6 0",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  search: "M20 20l-3.2-3.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  more: "M12 6.5h.01M12 12h.01M12 17.5h.01",
  edit: "M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z",
  copy: "M9 9h9a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 18 21H9a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 9 9Zm6-1.5V5A1.5 1.5 0 0 0 13.5 3.5h-9A1.5 1.5 0 0 0 3 5v9a1.5 1.5 0 0 0 1.5 1.5H7",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7",
  alert: "M12 8.5v4.5m0 3h.01M10.3 3.9 2.6 17.2A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z",
  info: "M12 11v5.5M12 7.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  bell: "M9.5 18.5a2.5 2.5 0 0 0 5 0M6 10a6 6 0 1 1 12 0c0 3.3 1.5 4.6 1.5 5.5h-15C4.5 14.6 6 13.3 6 10Z",
  bellOff: "M3.5 3.5l17 17M9.5 18.5a2.5 2.5 0 0 0 5 0M6.3 7.2A6 6 0 0 0 6 10c0 3.3-1.5 4.6-1.5 5.5h12M9 4.6A6 6 0 0 1 18 10c0 1.4.3 2.5.6 3.3",
  clock: "M12 7.5V12l3 1.8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  mail: "M3.5 7.5h17v10h-17v-10Zm0 .5 8.5 6 8.5-6",
  sun: "M12 4V2.5m0 19V20m8-8h1.5M2.5 12H4m13.7-5.7 1-1M5.3 18.7l1-1m11.4 0 1 1M5.3 5.3l1 1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20 14.3A8.5 8.5 0 0 1 9.7 4 8.5 8.5 0 1 0 20 14.3Z",
  chevron: "m8 10 4 4 4-4",
  arrow: "M5 12h13m-5-5 5 5-5 5",
  shield: "M12 3.5 5 6v6c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-2.5Z",
};

export function Icon({ name, size = 16, className = "" }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ── Small primitives ──────────────────────────────────────────────── */

export function Toggle({ on, onChange, label, size = "md" }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label}
      className={`toggle ${on ? "is-on" : ""} toggle--${size}`} onClick={() => onChange(!on)}>
      <span className="toggle__knob" />
    </button>
  );
}

export function Pill({ tone = "neutral", icon, children }) {
  return (
    <span className={`pill pill--${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function Button({ variant = "ghost", icon, children, ...rest }) {
  return (
    <button type="button" className={`btn btn--${variant}`} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Avatar({ initials, tone = "" }) {
  return <span className={`avatar ${tone}`}>{initials}</span>;
}

export function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

export function Callout({ tone = "info", icon = "info", title, children, actions }) {
  return (
    <div className={`callout callout--${tone}`}>
      <Icon name={icon} size={16} className="callout__icon" />
      <div className="callout__body">
        {title && <b>{title}</b>}
        {children && <p>{children}</p>}
      </div>
      {actions && <div className="callout__actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon = "bell", title, children, action }) {
  return (
    <div className="empty">
      <span className="empty__mark"><Icon name={icon} size={18} /></span>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

/* ── Budget meter ──────────────────────────────────────────────────── */

export function Meter({ pct, markers = [], tone, height = 8, showPct = false }) {
  const fill = Math.min(pct, 100);
  const state = tone ?? (pct >= 100 ? "neg" : pct >= 80 ? "warn" : "pos");
  return (
    <div className="meter" style={{ "--meter-h": `${height}px` }}>
      <div className={`meter__track meter__track--${state}`}>
        <div className="meter__fill" style={{ width: `${fill}%` }} />
        {markers.map((m, i) => (
          <span key={i} className={`meter__marker ${m.matched ? "is-matched" : ""} ${m.muted ? "is-muted" : ""}`}
            style={{ left: `${Math.min(m.at, 100)}%` }} title={m.title} />
        ))}
      </div>
      {showPct && <span className={`meter__pct meter__pct--${state}`}>{pct}%</span>}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────── */

export function Modal({ title, subtitle, onClose, footer, wide = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("[data-autofocus]")?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  // Rendered into <body>: any ancestor with a transform, filter or backdrop-filter
  // becomes the containing block for position:fixed, which would detach the scrim
  // from the viewport.
  return createPortal(
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? "modal--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <Button icon="close" aria-label="Close" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/* ── Formatting ────────────────────────────────────────────────────── */

export const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
