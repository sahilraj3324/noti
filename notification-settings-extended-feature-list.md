# Notification Settings — Extended Feature List

## Purpose

This document summarizes the notification features, extensions, decisions, exclusions, and open questions discussed in the transcript between Ayush Kumar and Sonia P.

## Confirmed Product Model

### 1. Admin-managed notification rules

- Workspace admins configure notification rules.
- A rule can contain:
  - an event or notification type;
  - a threshold;
  - a condition, such as greater than a percentage;
  - one or more recipients;
  - an optional account scope where applicable.
- Admin-defined rules are the source of truth.
- Role-based access control (RBAC) must restrict rule creation and editing to authorized admins.

### 2. Normal-user notification preferences

- Normal users can only mute or unmute notifications.
- Normal users cannot create their own thresholds, conditions, schedules, or recipient rules.
- This avoids conflicts between an admin rule and a user-specific rule.
- A muted user does not receive or see that notification, while the underlying admin rule remains unchanged.

## Features to Add or Extend

### 3. Account-level budget threshold notifications

Budget notifications must be configurable for a specific cloud account instead of relying only on a tenant-wide aggregate.

Required configuration:

- Cloud provider and account selection.
- Budget threshold percentage or value.
- Comparison condition, such as `greater than 80%`.
- Recipient selection.
- Notification enabled/muted state.

Expected behavior:

- Evaluate each selected account independently.
- Send the notification when that account crosses its configured threshold.
- Do not rely only on a combined tenant percentage, because low spend in one account could hide an over-budget condition in another account.
- The settings may live within a tenant/workspace, but the budget rule itself is account-scoped.

Example:

- AWS Production is above 80% of its budget.
- Azure Production is only at 50%.
- The AWS alert must still trigger even if the combined tenant budget remains below 80%.

### 4. Allocation drift notifications

Notify users whenever a resource's allocation changes, even if its total spend stays the same.

Detection requirements:

- Compare the current allocation with the previously stored allocation.
- Detect changes to resource tags, allocation dimensions, dimension items, teams, departments, or allocation percentages.
- Trigger based on the allocation difference itself; a material cost or spend change is not required.

Example:

- An ElastiCache or EC2 resource was allocated 100% to the Finance team.
- The resource is changed to 50% Finance and 50% HR.
- Total resource cost remains unchanged.
- An allocation drift notification must still be created because ownership/distribution changed.

Source-specific behavior:

- Cloud-side tag or resource changes can only be detected after the next cloud data pull.
- Changes made directly in Quper's allocation UI can create a one-time notification after the change is saved.
- The alert should describe the affected resource, dimension, previous allocation, and new allocation.

### 5. Action-item lifecycle notifications

Notifications are required for more than the creation of a new action item.

Trigger when:

- a new action item is created;
- an action item's stage or status changes;
- the action owner is assigned or changed;
- another material action lifecycle field changes, if later included in the action workflow.

The notification should identify the action, previous value, new value, owner, and actor where available.

### 6. Granular recipient rules

- Admins can assign different recipients to different thresholds or events.
- Each matching rule should retain its own recipient list.
- Recipient and threshold configuration must be stored with the rule, not inferred globally.

## Notification Delivery Model

### 7. Supported delivery methods

Initial supported methods:

- Email.
- In-application notifications.

Not in the initial scope:

- Microsoft Teams, because the previously expected webhook architecture is no longer suitable.
- Slack, until per-user delivery and integration planning are finalized.

### 8. Daily processing for cloud-dependent events

Cloud cost and allocation data are not real-time. Notifications based on external cloud data should therefore be processed after the daily data pull.

Expected flow:

1. Pull the latest cloud and cost data.
2. Compare it with stored budgets, allocations, and previous snapshots.
3. Create all matching notification records.
4. Deduplicate or aggregate repeated changes where appropriate.
5. Send the day's notifications through an after-business-hours job.
6. Mark each notification record with its processing result.

Reasons:

- Avoid misleading users with a real-time or "instant" promise.
- Avoid sending many emails while an admin is experimenting with rule values.
- Reduce duplicate messages and email-service costs.

### 9. One-time application-originated notifications

- Events created directly inside Quper, such as an action status change or a saved allocation edit, may generate a one-time notification.
- These events do not need a user-configurable delivery schedule.
- The UI should avoid presenting an "instant" timing option.

## Persistence and Processing

### 10. Notification queue records

Persist a notification record before delivery. At minimum, store:

- notification/event type;
- tenant/workspace ID;
- account ID when the rule is account-scoped;
- source entity and source entity ID;
- matched rule ID;
- recipient IDs or addresses;
- previous and current values where relevant;
- created timestamp;
- processing status;
- processed/sent timestamp;
- delivery result or failure reason.

Suggested processing statuses:

- `pending`
- `processing`
- `sent`
- `failed`
- `muted`

### 11. Rule records

Keep the persisted rule model simple. Required fields should focus on:

- event type;
- account scope, if applicable;
- threshold and condition, if applicable;
- recipients;
- enabled state;
- audit fields.

Do not add speculative fields such as confidence score, size, or arbitrary channel selection unless a confirmed feature requires them.

## Conflict and Deduplication Rules

### 12. Admin versus normal-user conflicts

- Resolved by allowing normal users to mute/unmute only.
- Normal users cannot override the admin's threshold or condition.

### 13. Overlapping admin rules

Example discussed:

- Rule A: greater than 80%, notify Ayush.
- Rule B: greater than 90%, notify Shayantan.
- Current value: 92%.

Proposed default behavior:

- Evaluate each rule independently.
- Both matching rules generate notifications for their respective recipients.
- If the same recipient appears in multiple matching rules for the same event, deduplicate that recipient's message where possible.

This behavior should be confirmed before implementation because the transcript identifies the scenario but does not explicitly finalize it.

## Features Removed from the Initial Scope

### 14. Cost-impact/confidence notifications

- Drop the separate cost-impact notification feature.
- Do not notify users about changes in a confidence score.
- Confidence-based alerts were considered unnecessary and potentially harmful to trust in the application.

### 15. User-configurable schedules

- Remove schedule rules, quiet-hour controls, and similar scheduling UI.
- Do not expose an "instant" option.
- Use the system's daily processing cadence for cloud-dependent events and one-time processing for eligible application-originated events.

### 16. Duplicate action-created rules

- Avoid creating multiple notification definitions for the same action creation event.
- Consolidate action creation under the broader action-item lifecycle notification feature.

### 17. Extra communication integrations

- Do not include Teams in the initial version.
- Keep Slack out of the initial version until its delivery design is approved.

## Phase 2 Features

### 18. Notification configuration import/export

- Export admin notification rules as a reusable configuration or template.
- Import the template into another tenant/workspace or use it for bulk setup.
- This is useful for organizations with many employees or many similar notification rules.
- Mark as Phase 2.

### 19. Scheduled executive summary

- Generate a consolidated executive summary based on usage, cost, budget, and other relevant insights.
- Deliver the report by email so executives do not need to open the application.
- Support a planned reporting cadence.
- This requires broader export/reporting design and is a Phase 2 feature.

## Pending Confirmation

### 20. Waste-detection notifications

- It is not yet confirmed whether idle or chargeable unused resources should create notifications.
- Current preference is to omit this notification unless stakeholders explicitly request it.
- Confirm the requirement with Hizar before adding it to scope.

### 21. Final overlapping-rule behavior

- Confirm whether every matching admin rule sends independently.
- Define deduplication when the same recipient matches multiple thresholds.
- Define whether a single digest should combine related notifications.

### 22. Internal-change delivery timing

- Confirm whether Quper-originated changes are delivered immediately as one-time notifications or included in the next processing run.
- Regardless of the implementation, do not expose an "instant" scheduling choice to users.

## Suggested Initial Release Scope

1. Admin rule management with RBAC.
2. Normal-user mute/unmute controls only.
3. Account-level budget threshold rules.
4. Allocation drift detection independent of spend impact.
5. Action creation, status, stage, and owner-change notifications.
6. Email and in-application delivery only.
7. Daily notification processing for external cloud events.
8. Persisted notification queue with processing status.
9. Basic rule conflict handling and recipient deduplication.

## Acceptance Summary

The initial feature is successful when an admin can configure account-scoped budget and event rules, normal users can mute or unmute those notifications, allocation changes are detected even without a cost change, action lifecycle changes produce notifications, and cloud-dependent notifications are reliably processed once per daily data cycle without duplicate or unsupported delivery options.
