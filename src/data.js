// Domain data for the notification-settings prototype.
// Shapes follow notification-settings-extended-feature-list.md:
//   rule  = { id, event, accountId?, condition?, threshold?, recipients[], enabled, updatedBy, updatedAt }
//   queue = { id, event, accountId?, recipients[], status, created, sent }

export const workspace = {
  name: "Xequalto",
  tenant: "Production tenant",
  lastSync: "Today, 04:10 UTC",
  nextRun: "Tonight, 19:30 local",
};

export const users = {
  admin: {
    id: "avery",
    name: "Avery Vaughn",
    email: "avery@xequalto.com",
    initials: "AV",
    role: "Workspace admin",
    groups: ["finance"],
    can: "Create, edit and delete notification rules for everyone in this workspace.",
  },
  member: {
    id: "priya",
    name: "Priya Nair",
    email: "priya@xequalto.com",
    initials: "PN",
    role: "Member",
    groups: ["platform"],
    can: "Mute or unmute the notifications an admin has set up. Thresholds stay admin-owned.",
  },
};

export const accounts = [
  { id: "aws-prod",      provider: "AWS",   name: "Production",      ref: "123456789012",   budget: 48000, spend: 44160 },
  { id: "aws-dev",       provider: "AWS",   name: "Development",     ref: "210987654321",   budget: 9000,  spend: 4230  },
  { id: "azure-prod",    provider: "Azure", name: "Production",      ref: "8d91…2f40",      budget: 26000, spend: 13000 },
  { id: "azure-shared",  provider: "Azure", name: "Shared services", ref: "4b77…9c12",      budget: 7500,  spend: 6300  },
  { id: "gcp-prod",      provider: "GCP",   name: "Production",      ref: "quper-prod-01",  budget: 15000, spend: 9750  },
  { id: "gcp-analytics", provider: "GCP",   name: "Analytics",       ref: "quper-analytics",budget: 6000,  spend: 1920  },
];

export const accountById = Object.fromEntries(accounts.map((a) => [a.id, a]));
export const accountName = (a) => `${a.provider} · ${a.name}`;
export const pctOf = (a) => Math.round((a.spend / a.budget) * 100);

export const tenantTotals = accounts.reduce(
  (sum, a) => ({ budget: sum.budget + a.budget, spend: sum.spend + a.spend }),
  { budget: 0, spend: 0 },
);

export const directory = [
  { id: "avery",     kind: "user",  name: "Avery Vaughn",   detail: "Workspace admin · avery@xequalto.com" },
  { id: "ayush",     kind: "user",  name: "Ayush Kumar",    detail: "FinOps lead · ayush@xequalto.com" },
  { id: "sonia",     kind: "user",  name: "Sonia P",        detail: "Product · sonia@xequalto.com" },
  { id: "shayantan", kind: "user",  name: "Shayantan Roy",  detail: "Engineering manager · shayantan@xequalto.com" },
  { id: "hizar",     kind: "user",  name: "Hizar Ali",      detail: "Head of platform · hizar@xequalto.com" },
  { id: "priya",     kind: "user",  name: "Priya Nair",     detail: "Cloud engineer · priya@xequalto.com" },
  { id: "finance",   kind: "group", name: "Finance controllers", detail: "4 members" },
  { id: "platform",  kind: "group", name: "Platform team",       detail: "11 members" },
  { id: "people-ops",kind: "group", name: "People operations",   detail: "3 members" },
  { id: "security",  kind: "group", name: "Security admins",     detail: "2 members" },
];

export const personById = Object.fromEntries(directory.map((p) => [p.id, p]));
export const nameOf = (id) => personById[id]?.name ?? id;

// Comparison conditions. The feature list only ever describes "greater than a
// percentage", so the catalogue stops at above / at-or-above.
export const conditions = [
  { id: "gt",  label: "goes above",          short: "Above",    symbol: ">",  test: (v, t) => v > t },
  { id: "gte", label: "reaches or goes above", short: "At or above", symbol: "≥", test: (v, t) => v >= t },
];
export const conditionById = Object.fromEntries(conditions.map((c) => [c.id, c]));

export const CADENCE = {
  daily: {
    label: "Daily batch",
    detail: "Evaluated after the nightly cloud data pull, then sent in one after-hours run.",
  },
  onChange: {
    label: "One-time",
    detail: "Created once, straight after the change is saved inside Quper.",
  },
};

export const events = {
  "budget-threshold": {
    section: "budgets",
    label: "Account budget threshold crossed",
    blurb: "A cloud account passes the share of its budget you set here.",
    scope: "account",
    metric: "percent",
    cadence: "daily",
    payload: ["Account", "Budget", "Current spend", "Threshold", "Matched rule"],
  },
  "cost-signal": {
    section: "signals",
    label: "Cost signal detected",
    blurb: "Spend on a service or account moves outside its expected range.",
    metric: "amount",
    cadence: "daily",
    payload: ["Service", "Account", "Daily impact", "Expected range", "First seen"],
  },
  "rightsizing-recommendation": {
    section: "signals",
    label: "Rightsizing recommendation ready",
    blurb: "A resource has a resize recommendation waiting for review.",
    metric: null,
    cadence: "daily",
    payload: ["Resource", "Current size", "Recommended size", "Monthly saving"],
  },
  "allocation-drift": {
    section: "allocation",
    label: "Allocation changed",
    blurb:
      "A resource is redistributed across dimensions, teams or percentages — even when its cost does not move.",
    metric: null,
    cadence: "onChange",
    payload: ["Resource", "Dimension", "Previous allocation", "New allocation", "Changed by"],
  },
  "action-created": {
    section: "actions",
    label: "Action item created",
    blurb: "A new action item is raised and needs an owner.",
    metric: null,
    cadence: "onChange",
    payload: ["Action ID", "Title", "Owner", "Created by"],
  },
  "action-status-changed": {
    section: "actions",
    label: "Status or stage changed",
    blurb: "An action item moves to a different status or workflow stage.",
    metric: null,
    cadence: "onChange",
    payload: ["Action ID", "Previous status", "New status", "Changed by"],
  },
  "action-owner-changed": {
    section: "actions",
    label: "Owner changed",
    blurb: "An action item is assigned or transferred to someone else.",
    metric: null,
    cadence: "onChange",
    payload: ["Action ID", "Previous owner", "New owner", "Changed by"],
  },
  "people-user-added": {
    section: "people",
    label: "New user added",
    blurb: "Someone joins the workspace.",
    metric: null,
    cadence: "onChange",
    payload: ["User", "Email", "Role", "Added by"],
  },
  "people-role-changed": {
    section: "people",
    label: "Role changed",
    blurb: "A member's workspace role or access level changes.",
    metric: null,
    cadence: "onChange",
    payload: ["User", "Previous role", "New role", "Changed by"],
  },
  "people-group-added": {
    section: "people",
    label: "Added to a group",
    blurb: "A member is added to a workspace group.",
    metric: null,
    cadence: "onChange",
    payload: ["User", "Group", "Added by"],
  },
};

export const sections = [
  { id: "overview",   label: "Overview",   icon: "gauge",  adminOnly: true },
  { id: "budgets",    label: "Budgets",    icon: "wallet", events: ["budget-threshold"] },
  { id: "signals",    label: "Cost signals", icon: "pulse", events: ["cost-signal", "rightsizing-recommendation"] },
  { id: "allocation", label: "Allocation drift", icon: "split", events: ["allocation-drift"] },
  { id: "actions",    label: "Action items", icon: "check", events: ["action-created", "action-status-changed", "action-owner-changed"] },
  { id: "people",     label: "People & access", icon: "users", events: ["people-user-added", "people-role-changed", "people-group-added"] },
  { id: "delivery",   label: "Delivery",   icon: "send",   adminOnly: true },
  { id: "roadmap",    label: "Roadmap",    icon: "map",    adminOnly: true },
];

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]));

const rule = (id, event, extra) => ({
  id,
  event,
  accountId: null,
  condition: null,
  threshold: null,
  recipients: [],
  enabled: true,
  updatedBy: "Avery Vaughn",
  updatedAt: "2 days ago",
  ...extra,
});

export const defaultRules = [
  rule("r-budget-1", "budget-threshold", {
    accountId: "aws-prod", condition: "gt", threshold: 80,
    recipients: ["ayush", "finance"],
  }),
  rule("r-budget-2", "budget-threshold", {
    accountId: "aws-prod", condition: "gt", threshold: 90,
    recipients: ["shayantan", "ayush"], updatedAt: "4 hours ago",
  }),
  rule("r-budget-3", "budget-threshold", {
    accountId: "azure-shared", condition: "gte", threshold: 85,
    recipients: ["platform"], updatedAt: "last week",
  }),
  rule("r-budget-4", "budget-threshold", {
    accountId: "azure-prod", condition: "gt", threshold: 80,
    recipients: ["ayush"], enabled: false, updatedAt: "last week",
  }),
  rule("r-signal-1", "cost-signal", {
    condition: "gt", threshold: 250, recipients: ["ayush", "platform"],
  }),
  rule("r-rightsizing-1", "rightsizing-recommendation", { recipients: ["platform"] }),
  rule("r-allocation-1", "allocation-drift", { recipients: ["ayush", "finance"] }),
  rule("r-action-1", "action-created", { recipients: ["platform"] }),
  rule("r-action-2", "action-status-changed", { recipients: ["ayush"] }),
  rule("r-action-3", "action-owner-changed", { recipients: ["ayush", "platform"], enabled: false }),
  rule("r-people-1", "people-user-added", { recipients: ["people-ops", "security"] }),
  rule("r-people-2", "people-role-changed", { recipients: ["security"] }),
  rule("r-people-3", "people-group-added", { recipients: ["people-ops"], enabled: false }),
];

// Last processing run — illustrates the persisted queue described in §10.
export const queueStatuses = [
  { id: "pending",    label: "Pending",    tone: "neutral" },
  { id: "processing", label: "Processing", tone: "neutral" },
  { id: "sent",       label: "Sent",       tone: "pos" },
  { id: "failed",     label: "Failed",     tone: "neg" },
  { id: "muted",      label: "Muted",      tone: "muted" },
];

export const lastRun = {
  finished: "Today, 19:34 local",
  counts: { pending: 2, processing: 0, sent: 41, failed: 1, muted: 6 },
  records: [
    { id: "n-8841", event: "budget-threshold", accountId: "aws-prod",     recipients: ["ayush", "finance"], status: "sent",    note: "92% of budget · rule above 80%" },
    { id: "n-8842", event: "budget-threshold", accountId: "aws-prod",     recipients: ["shayantan"],        status: "sent",    note: "92% of budget · rule above 90%" },
    { id: "n-8843", event: "rightsizing-recommendation", accountId: "azure-shared", recipients: ["platform"], status: "sent", note: "3 resources with a resize recommendation" },
    { id: "n-8844", event: "allocation-drift", accountId: "aws-prod",     recipients: ["ayush", "finance"], status: "sent",    note: "i-0f3c EC2 · Finance 100% → Finance 50% / HR 50%" },
    { id: "n-8845", event: "action-status-changed", accountId: null,      recipients: ["ayush"],            status: "muted",   note: "Recipient muted this notification" },
    { id: "n-8846", event: "cost-signal",     accountId: "gcp-prod",      recipients: ["platform"],         status: "failed",  note: "Mailbox rejected the message · will retry next run" },
    { id: "n-8847", event: "people-role-changed", accountId: null,        recipients: ["security"],         status: "pending", note: "Queued for the next run" },
  ],
};

export const roadmap = [
  { title: "Import and export rule templates", phase: "Phase 2",
    detail: "Export the workspace's rules as a template, then reuse it in another tenant or for bulk setup." },
  { title: "Scheduled executive summary", phase: "Phase 2",
    detail: "A consolidated cost, usage and budget digest emailed on a planned cadence, so executives never open the app." },
  { title: "Waste-detection notifications", phase: "Needs confirmation",
    detail: "Idle or chargeable unused resources. Left out until stakeholders confirm they want it." },
  { title: "Microsoft Teams delivery", phase: "Not in scope",
    detail: "The webhook architecture it assumed no longer fits. Revisit after the delivery design is redone." },
  { title: "Slack delivery", phase: "Not in scope",
    detail: "Held until per-user delivery and the integration plan are settled." },
  { title: "Cost-impact and confidence alerts", phase: "Dropped",
    detail: "Notifying on confidence-score movement was judged noisy and bad for trust in the numbers." },
  { title: "User-configurable schedules", phase: "Dropped",
    detail: "No quiet hours, no pause windows and no \"instant\" option. The system cadence governs delivery." },
];
