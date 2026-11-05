# Notification settings

A working UI prototype of Quper's notification settings, built to the model in
[`notification-settings-extended-feature-list.md`](./notification-settings-extended-feature-list.md).

```bash
npm install
npm run dev
```

## What it covers

| Area | Behaviour |
| --- | --- |
| **Budgets** | Account-scoped threshold alerts. One account per rule, many rules per account, each with its own recipients. |
| **Cost signals** | Amount-per-day thresholds, several per event, each with its own recipients. |
| **Allocation drift** | Fires on any change to how a resource is distributed — no cost change required. |
| **Action items** | Created, status/stage changed, owner changed. |
| **People & access** | User added, role changed, group membership changed. |
| **Delivery** | Email and in-app only. The daily pipeline and the persisted notification queue, read-only. |
| **Roadmap** | What is deliberately out of scope, and why. |

Switch between the admin and member experience with **Preview as** in the top bar.
Admins build rules; members may only mute or unmute (§2, §12).

## Structure

```
src/
  data.js                      accounts, directory, event catalogue, default rules, sample queue
  App.jsx                      shell, left rail, role switch, unsaved-changes bar
  components/
    ui.jsx                     icons, toggle, pill, meter, modal, callout, formatting
    RecipientPicker.jsx        searchable people/group picker, stored per rule
    BudgetRuleEditor.jsx       the three-step budget alert editor
  sections/
    Overview.jsx               coverage, gaps, last delivery run
    Budgets.jsx                account cards with thresholds and overlap handling
    EventSection.jsx           generic event cards (signals, drift, actions, people)
    Delivery.jsx               channels, daily pipeline, notification queue
    Roadmap.jsx                phase 2, unconfirmed and dropped features
    MemberView.jsx             mute/unmute only
  styles.css                   Quper v2 design tokens + components, light and dark
```

## Decisions worth knowing

- **Rules are account-scoped, not tenant-scoped.** The seeded data has the tenant at 71%
  while AWS Production sits at 92%, so the screen demonstrates the case a tenant-wide
  threshold would miss.
- **Conditions stop at `>` and `≥`.** The feature list only ever describes "greater than
  a percentage"; `Equals` was removed as a budget comparison.
- **Overlapping rules each fire.** When two thresholds match, the card says so and names
  the recipients who get one message instead of two (§13 — still to be confirmed).
- **No schedules, quiet hours or "instant".** Cadence is system-managed and stated per
  event: daily batch for cloud data, one-time for changes made inside Quper (§15, §22).
- **No per-rule channel picker.** §11 warns against speculative rule fields; channels are
  workspace-level and shown on the Delivery page.
