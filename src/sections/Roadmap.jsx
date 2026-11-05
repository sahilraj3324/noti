import { roadmap } from "../data.js";
import { Pill } from "../components/ui.jsx";

const TONE = {
  "Phase 2": "accent",
  "Needs confirmation": "warn",
  "Not in scope": "muted",
  Dropped: "muted",
};

export default function Roadmap() {
  return (
    <>
      <header className="sec-head">
        <div>
          <h2>Roadmap</h2>
          <p>What this screen deliberately leaves out, and why — so nobody rebuilds a feature that was already ruled out.</p>
        </div>
      </header>
      <ul className="roadmap">
        {roadmap.map((item) => (
          <li key={item.title}>
            <div>
              <b>{item.title}</b>
              <p>{item.detail}</p>
            </div>
            <Pill tone={TONE[item.phase] ?? "neutral"}>{item.phase}</Pill>
          </li>
        ))}
      </ul>
    </>
  );
}
