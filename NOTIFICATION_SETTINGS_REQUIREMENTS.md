# Notification Settings — Product Requirements

## 1. Document purpose

This document describes the functional requirements, conditions, defaults, and business rules represented by the current `notification-settings-vite` prototype. It also identifies prototype behavior that must be completed or clarified before production implementation.

## 2. Product objective

The Notification Settings page allows a user to control:

- which Quper events generate notifications;
- which delivery channels may be used;
- when notifications are delivered;
- event-specific thresholds and conditions;
- who receives notifications, where the user's role permits recipient management;
- quiet hours and temporary notification pauses.

The page supports both workspace-admin defaults and an individual member's personal preferences.

## 3. Actors and scope

### 3.1 Workspace admin

The workspace admin manages workspace-oriented notification defaults and can:

- configure all available notification sections;
- mute a complete section;
- change an entire section to daily digest delivery;
- reset a section to its defaults;
- view the current user as a recipient;
- add and remove recipients from the workspace recipient directory;
- create additional threshold or condition rules where supported.

### 3.2 Normal user

A normal user manages only their personal notification preferences and can:

- configure their own enabled notification sections;
- mute or unmute a complete section;
- view themselves as the personal-delivery recipient;
- not add other recipients;
- not create additional threshold or condition rules.

### 3.3 Preference isolation

- Admin and normal-user preferences must be maintained independently.
- Switching between Admin and Normal user must show the selected actor's profile, delivery settings, event preferences, schedule, and pause state.
- A change made in one mode must not alter the other mode's settings.

## 4. Notification catalogue

The product currently contains eleven active notification event types in seven configurable groups. An eighth group is a placeholder.

| Group | Event ID | User-facing event | Trigger or purpose | Default channels | Default timing |
| --- | --- | --- | --- | --- | --- |
| Cost signals | `cost-signal` | Signal detected | Spend on a service or account moves outside its expected range. | In-app, Email,  | Instant |
| Cost signals | `action-created` | Action created | An action item is created from a cost signal for team review. | In-app, Email | Instant |
| Allocation impact | `allocation-impact-detected` | Allocation impact detected | An allocation change materially affects attributed spend. | In-app, Email | Instant |
| Cost impact | `cost-impact-detected` | Cost impact detected | A cost change reaches the configured confidence requirement. | In-app, Email | Instant |
| Rightsizing | `rightsizing-recommendation` | Rightsizing recommendation | A resource has a rightsizing recommendation ready for review. | In-app, Email | Instant |
| Rightsizing | `rightsizing-action-created` | Action created | An action item is created from a rightsizing recommendation. | In-app, Email | Instant |
| Budgets & forecasts | `budget-threshold` | Budget threshold crossed | Actual spend crosses a configured percentage of a followed or owned budget. | In-app, Email,  | Instant |
| Action items | `action-item` | Action item notifications | A new action item needs the user's attention. | In-app | Instant |
| People & access | `people-user-added` | New user added | A new user is added to the workspace. | In-app, Email | Instant |
| People & access | `people-role-changed` | User role changed | A user's workspace role or access level changes. | In-app, Email | Instant |
| People & access | `people-group-added` | User added to a group | A user is added to a new workspace group. | In-app, Email | Instant |
| Data platforms | None | Coming soon | Warehouse, job, and query health after data-platform connections become available. | None | None |


## 5. Core event-state rules

Each event preference consists of at least:

- `channels`: zero or more delivery-channel IDs;
- `timing`: `instant`, `daily`, `weekly`, or `off`;
- optional event-specific values such as `threshold`, `confidence`, or `size`.

An event is considered **active** only when both conditions are true:

1. `timing` is not `off`; and
2. at least one channel is selected.

An event is considered **off** when either condition is true:

- `timing` is `off`; or
- no channel is selected.

The summary count and each group's active count must use this same active-state rule.

### 5.1 Channel selection transitions

- Removing the final selected channel must set the event timing to `off`.
- Adding a channel to an event whose timing is `off` must restore timing to `instant`.
- Turning an event back on must reuse its previously selected channels when at least one remains stored.
- If an event has no stored channel when it is turned on, it must fall back to In-app.

### 5.2 Timing options

Supported timing values are:

| Value | Label | Meaning |
| --- | --- | --- |
| `instant` | Instant | Deliver as soon as the event qualifies, subject to channel, quiet-hour, and pause rules. |
| `daily` | Daily digest | Combine qualifying events into a daily digest. |
| `weekly` | Weekly digest | Combine qualifying events into a weekly digest. |
| `off` | Off | Do not deliver the event. |

- Selecting Instant, Daily digest, or Weekly digest for an event with no selected channels must add In-app automatically.
- Every configurable event must expose its per-event channel selector when expanded.
- Events with specialized on/off or threshold behavior do not expose digest timing unless explicitly supported by that event type.

## 6. Delivery-channel rules

### 6.1 In-app

- In-app delivery represents the Quper notification center and in-product toasts.
- In-app is always globally enabled.
- In-app notifications must continue to collect during quiet hours and a temporary pause.
- The global In-app channel cannot be turned off.

### 6.2 Email

- Email delivery is enabled by default.
- Email may be globally enabled or disabled per actor.
- The displayed destination must be the selected actor's email address.
- Disabling Email globally must silence Email for every event without deleting each event's Email selection.

### 6.3 

-  delivery is enabled by default.
-  may be globally enabled or disabled per actor.
- The current workspace destination is shown as direct messages from the Quper app in `xequalto..com`.
- Disabling  globally must silence  for every event without deleting each event's  selection.

### 6.4 Microsoft 

- Microsoft  is displayed as not connected.
-  event-level selection is disabled until a connection exists.
- The page exposes a Connect action, but the prototype does not implement the connection flow.
- When implemented,  must follow the same global-channel, quiet-hour, pause, and event-selection rules as other external channels.

### 6.5 Global versus event-level channel state

- Every configurable event must display In-app, Email, , and  channel choices in its expanded details.
-  remains disabled at event level until the workspace connection is available.
- An event may retain Email or  in its selected channel list while the corresponding global channel is disabled.
- In that state, the event remains configured for that channel but no delivery may occur through it.
- The UI should warn the user when a selected event channel is globally disabled.
- Global channel state does not change the active-event count in the current prototype. Whether an event with only globally disabled external channels should count as active requires product confirmation.

## 7. Group-level bulk actions

Every configurable group displays one of the following statuses:

- `All on` when all events in the group are active;
- `All off` when no events in the group are active;
- `<active> of <total> on` when only some events are active.

### 7.1 Admin bulk actions

An admin may perform:

- **Mute all**: set every event in the group to `off`; stored channel selections remain unchanged.
- **Send all as daily digest**: set every event in the group to `daily`; preserve existing channels, or use In-app if an event has none.
- **Reset to defaults**: replace every event in the group with its complete default preference object.

The menu copy says urgent events remain instant during “Send all as daily digest,” but the current implementation sets every event to `daily` and has no urgent-event classification. This rule must be resolved before production.

### 7.2 Normal-user bulk action

- When at least one event in a group is active, the normal user sees **Mute section**, which sets all event timings to `off`.
- When no events are active, the normal user sees **Unmute section**, which:
  - restores stored channels when present;
  - otherwise restores the event's default channels;
  - sets timing to `instant` for every event in the group.

## 8. Event-specific business rules

### 8.1 Common numeric-threshold controls

Cost signal, budget, allocation-impact, and cost-impact rules use the same three-part threshold editor:

- **Threshold**: a numeric input box constrained by the event-specific minimum, maximum, and increment.
- **Condition**: a dropdown containing `Equals` and `Above`, positioned after Threshold. Operator symbols are not displayed in the UI.
- **Schedule**: a dropdown containing `Once when reached` and `Daily`.

The controls must appear in the order **Threshold → Condition → Schedule** on desktop and mobile.

The default condition is `Equals` and the default schedule is `Once when reached`.

- `Equals` qualifies when the observed value equals the configured threshold.
- `Above` qualifies when the observed value is strictly greater than the configured threshold.
- `Once when reached` sends once when the rule changes from not qualifying to qualifying. It may send again only after the rule stops qualifying and subsequently qualifies again.
- `Daily` sends at most once per calendar day while the rule continues to qualify.
- The daily evaluation timezone follows the notification schedule timezone.
- Every additional admin-created threshold rule has its own threshold value, condition, schedule, and recipients.

### 8.2 Cost signal (`cost-signal`)

- Default impact threshold: `$100/day`.
- Allowed range: `$0/day` through `$1,000/day`.
- Increment: `$25`.
- A notification qualifies when estimated daily impact satisfies the selected condition against the configured threshold.
- Admins may add multiple additional conditions.
- Each additional condition starts at `$250/day` and has the same `$0–$1,000`, `$25`-increment range.
- Each additional condition includes a recipient selector.
- Admins may remove an additional condition.
- Normal users cannot add or remove additional conditions and do not see recipient management.

### 8.3 Cost-signal action created (`action-created`)

- The event can be enabled or disabled with an action-creation toggle.
- Disabling it sets timing to `off` but preserves stored channels.
- Enabling it sets timing to `instant` and restores stored channels; if none exist, it selects In-app.
- Admins see recipient management; normal users do not.

### 8.4 Allocation impact (`allocation-impact-detected`)

- Default confidence threshold: `100%`.
- Allowed range: `0%` through `100%`.
- Increment: `5%`.
- A notification qualifies when Quper's confidence satisfies the selected condition against the configured value.
- Admins may add multiple additional confidence thresholds.
- Each additional threshold starts at `90%`, uses the same range and increment, and includes a recipient selector.
- Admins may remove an additional threshold.
- Normal users cannot manage additional thresholds or recipients.

### 8.5 Cost impact (`cost-impact-detected`)

Cost impact uses the same confidence rules as Allocation impact:

- default `100%` confidence;
- range `0–100%`;
- `5%` increments;
- admin-only additional thresholds starting at `90%` with recipient selection.

### 8.6 Rightsizing recommendation (`rightsizing-recommendation`)

- The user selects a recommendation threshold of `Low`, `Medium`, or `High`.
- Default threshold: `Medium`.
- The precise business meaning of Low, Medium, and High is not defined in the prototype and must be supplied by the rightsizing domain.
- Admins see recipient management; normal users do not.

### 8.7 Rightsizing action created (`rightsizing-action-created`)

- Uses the same enable/disable behavior as the cost-signal Action created event.
- Disabling sets timing to `off` and preserves channels.
- Enabling sets timing to `instant` and restores stored channels, falling back to In-app.
- Admins see recipient management; normal users do not.

### 8.8 Budget threshold crossed (`budget-threshold`)

- Default threshold: `80%` of the budget's period limit.
- Allowed range: `0%` through `100%`.
- Increment: `5%`.
- A notification qualifies when actual spend satisfies the selected condition against the configured share of a budget the user owns or follows.
- Admins may add multiple additional thresholds.
- Each additional threshold starts at `90%`, uses the same range and increment, and includes a recipient selector.
- Admins may remove an additional threshold.
- Normal users cannot manage additional thresholds or recipients.

### 8.9 Action item (`action-item`)

- The event has a simple on/off control.
- Turning it on always sets the channel to In-app and timing to `instant`.
- Turning it off sets timing to `off`.
- The event supports per-event channel selection.
- The event does not support recipients or digest timing.

### 8.10 People and access notifications

The People & access section contains three system events:

- `people-user-added`: fires when a new user is added to the workspace;
- `people-role-changed`: fires when a user's workspace role or access level changes;
- `people-group-added`: fires when a user is added to a new workspace group.

Each event follows these rules:

- it uses a simple on/off control;
- it is always Instant when enabled and `off` when disabled;
- enabling restores stored channels, falling back to In-app and Email when no channels are stored;
- all event-level channel choices are displayed;
- it supports one or more third-party recipients, such as HR;
- HR is the default example recipient;
- admins can select people or  from the workspace recipient directory and remove existing recipients;
- the prototype recipient picker contains HR plus sample users from People Operations, Engineering, Finance, Security, and IT;
- duplicate recipient names are ignored case-insensitively;
- normal users can view recipients but recipient management is controlled by the workspace admin.

## 9. Recipient rules

- Every event that supports recipients must display the shared recipient picker.
- The selected actor is represented as “You” wherever they are assigned as a recipient.
- For the admin, “You” resolves to the admin profile.
- For a normal user, “You” resolves to the normal-user profile.
- The shared picker is available for cost signals, action-created events, allocation and cost impact, rightsizing recommendations, budget thresholds, People & access events, generic supported events, and additional threshold or condition rules.
- Admins can add and remove recipients from the sample workspace directory.
- Normal users can view recipients but cannot change workspace-managed recipient lists.
- The prototype supports in-memory selection and removal but does not implement server search, persistence, or authorization. These are required for a production recipient workflow.
- Additional-condition recipient rules must be stored independently from the event's primary recipient rule.
- People & access events may notify a third party in addition to the actor affected by the event.
- Third-party recipients may represent a person, team, or email address; HR is the default example.

### 9.1 Prototype recipient directory

The prototype must make the following sample recipients available in every supported recipient picker:

| Recipient | Role or team | Email |
| --- | --- | --- |
| You | Currently selected Admin or Normal user | Selected actor's email |
| HR | People Operations team | Not applicable |
| Maya Shah | HR Business Partner | `maya@xequalto.com` |
| Rohan Mehta | Engineering Manager | `rohan@xequalto.com` |
| Ananya Rao | Finance Controller | `ananya@xequalto.com` |
| Vikram Singh | Security Admin | `vikram@xequalto.com` |
| Neha Kapoor | IT Operations | `neha@xequalto.com` |

Recipient-picker behavior:

- an admin selects one directory entry and then uses **Add recipient**;
- already-added entries are disabled in the dropdown and marked as added;
- the Add recipient action remains disabled until a directory entry is selected;
- selected recipients appear as removable chips;
- duplicate recipients must not be added;
- removing a chip makes that recipient available in the dropdown again;
- recipient selections are independent for each notification event;
- every additional threshold or condition rule maintains its own recipient list;
- normal users can view the assigned chips but cannot add or remove workspace-managed recipients.

## 10. Schedule rules

### 10.1 Quiet hours

- Quiet hours are enabled by default.
- Default window: `21:00` to `08:00` every day.
- Current timezone: India Standard Time.
- Quiet hours affect Email, , and  only.
- During quiet hours, qualifying external notifications are held and delivered together when the window ends.
- In-app notifications continue to collect during the window.
- When quiet hours are disabled, the time controls are disabled visually and functionally, but their values remain stored.
- Overnight windows, where the start time is later than the end time, must be supported.

### 10.2 Temporary pause

The user may pause external delivery for:

- 1 hour;
- 4 hours;
- until tomorrow morning.

While paused:

- Email, , and  delivery is stopped;
- In-app notifications continue to collect;
- the summary shows the pause status;
- a **Resume now** action is available;
- delivery is expected to resume automatically at the selected time.

The prototype stores only display text such as “in 1 hour” and does not calculate or persist an actual resume timestamp. Production must store a timestamp and define “tomorrow morning,” including timezone and daylight-saving behavior where applicable.

### 10.3 Delivery precedence

For a qualifying event, effective delivery must be determined in this order:

1. The event must be active.
2. The event must include the candidate channel.
3. The candidate channel must be globally available and enabled.
4. In-app may deliver/collect ly.
5. External delivery must be held if a temporary pause is active.
6. Otherwise, external delivery must be held if the current time is inside quiet hours.
7. The event's Instant, Daily, or Weekly cadence must then be applied according to the agreed queueing policy.

The interaction between digest cadence and quiet-hour release is not defined in the prototype and requires backend/product specification.

## 11. Summary and status behavior

- The page must show `<active count> of <total configurable events>` for the selected actor.
- The current total is eleven.
- For Admin mode, the summary label is “Workspace defaults include.”
- For Normal user mode, the summary label is “You’re getting,” followed by a reminder that changes apply only to that user.
- When paused, the summary must include the pause-until value.
- The active count currently ignores global channel availability, quiet hours, and pause state; it counts configured active events only.

## 12. Save behavior

- Delivery channels, each configurable notification group, and Schedule have independent Save actions.
- A successful save must show section-level confirmation and a global success message.
- The prototype displays confirmation for approximately 1.3 seconds.
- Production save must persist only the intended actor's changed settings and return an error state if persistence fails.
- Unsaved changes should be tracked per section.
- Navigation away with unsaved changes should require a defined discard/continue flow.

### 12.1 Current prototype limitation

All controls update in-memory state ly. The Save button only displays confirmation and does not persist or commit data. There is no dirty-state comparison, loading state, error handling, retry, concurrency control, or backend integration.

## 13. Reset behavior

**Reset to defaults** applies to the currently selected actor only and must restore:

- all eleven event preference objects to their catalogue defaults;
- Email to enabled;
-  to enabled;
- quiet hours to enabled;
- quiet-hours start to `21:00`;
- quiet-hours end to `08:00`;
- temporary pause to inactive.

The reset must not change the other actor's preferences.

Before production use, product must decide whether Reset:

- applies ly or requires confirmation;
- is saved ly or remains an unsaved change;
- also clears additional rules and recipient assignments;
- should restore future  state after  becomes connected.

## 14. Locked/mandatory notification support

The code contains support for a future `locked` group even though no current group is locked.

If a group is locked:

- In-app and Email are mandatory channels;
- those channels cannot be deselected;
- default timing is Instant;
- group bulk controls are hidden;
- mandatory channels are shown with a locked indicator.

Product must confirm which events, if any, are mandatory before this behavior is enabled.

## 15. Validation and error requirements

Production implementation should enforce:

- only known event IDs, channel IDs, and timing values may be saved;
- monetary thresholds must be numeric, within `$0–$1,000`, and divisible by `$25`;
- percentage thresholds must be numeric, within `0–100`, and divisible by `5`;
- a threshold condition must be `=` or `>`;
- a threshold schedule must be `once` or `daily`;
- rightsizing size must be `Low`, `Medium`, or `High`;
- quiet-hour values must be valid local times;
- pause-until must be a future timestamp;
- recipient IDs must exist and be authorized for the workspace;
- disconnected channels cannot be selected for effective delivery;
- server validation failures must be shown without discarding the user's unsaved edits.

## 16. Persistence model requirements

At minimum, a persisted preference record should identify:

- workspace;
- preference owner or scope (`workspace-default` or `user`);
- event ID;
- selected channels;
- timing;
- event-specific threshold, confidence, or size;
- threshold condition and threshold schedule for every numeric threshold rule;
- recipients and additional rules where allowed;
- global channel enablement;
- quiet-hours enabled state, start, end, timezone, and applicable days;
- pause-until timestamp;
- version or update timestamp for concurrency control.

The backend must apply workspace defaults and personal overrides according to a documented inheritance rule. The prototype keeps two complete independent copies and does not implement inheritance.

## 17. Accessibility and responsive requirements

- Every interactive control must be keyboard operable.
- Toggles must expose an accessible name, role, and current checked state.
- Expandable event rows and bulk menus must expose expanded/collapsed state.
- Disabled channel controls must expose why they are unavailable.
- Save success and error messages must be announced to assistive technology.
- Inputs must have unique labels. Additional rules must include their sequence or identifying condition in the accessible name.
- Color must not be the only indicator of enabled, disabled, warning, or saved state.
- The page must remain usable below `780px`; the prototype switches to a single-column layout and hides the timing column on small screens.

## 18. Production gaps and decisions required

The following behavior is visible or implied but not complete:

1. Save actions do not persist data.
2. Connect  has no action.
3. The recipient directory is sample in-memory data and has no backend search or persistence.
4. Pause options do not create real timestamps or auto-resume.
5. Additional conditions exist only in local component memory and are lost when their component unmounts.
6. Workspace-default inheritance and member override behavior are undefined.
7. All events expose per-event channels, but specialized event types still do not expose generic digest timing.
8. “Urgent events stay instant” conflicts with the bulk implementation, which changes every event to Daily.
9. The definition of Low, Medium, and High rightsizing thresholds is missing.
10. The interaction among digest cadence, quiet hours, and temporary pause is undefined.
11. The active-event count ignores whether the event's selected external channels are globally disabled.
12. Data-platform readiness and its future notification catalogue are undefined.
13. There is no API, authentication, authorization, audit log, loading state, failure handling, or conflict handling.
14. There is no confirmation before global reset.

These decisions should be resolved before the prototype is treated as a production specification.

## 19. Acceptance criteria summary

The feature is functionally complete when:

- all eleven event types load with the documented defaults;
- Admin and Normal-user settings remain isolated;
- active counts consistently follow the active-event rule;
- global channel settings correctly gate all event deliveries;
- event-level state transitions preserve or restore channels as documented;
- all event-specific thresholds, ranges, increments, and defaults are enforced;
- role-based recipient and additional-rule permissions are enforced server-side and in the UI;
- bulk mute, unmute, daily, and reset actions follow their documented rules;
- quiet hours and pause suppress only external delivery and release queued messages correctly;
- save and reset operations persist reliably with success and error feedback;
-  and recipient actions either work end-to-end or are clearly disabled;
- settings survive reload and concurrent updates safely;
- the experience meets the accessibility and responsive requirements above.
