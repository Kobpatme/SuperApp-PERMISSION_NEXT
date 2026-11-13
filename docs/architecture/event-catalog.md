# Event catalog (initial)

All events are immutable, versioned and emitted after validated domain transitions. An outbox key prevents duplicate publication; KPI facts additionally enforce uniqueness by event/rule/calculation version.

| Event | Producer | Trigger | Primary entity | KPI eligible | Possible consumers |
| --- | --- | --- | --- | --- | --- |
| `work.task.completed.v1` | Work | Valid task completion | Task | Yes | KPI, activity, notification |
| `work.manual_entry.recorded.v1` | Work | Authorized off-system entry | ManualWorkEntry | Policy-based | KPI review, activity |
| `building.created.v1` | Building | Canonical building created | Building | No by default | Activity, search |
| `building.updated.v1` | Building | Material verified change | Building | Policy-based | Activity, search |
| `building.merged.v1` | Building | Approved canonical merge | Building | No | Audit, search, reference repair |
| `building.conditions.versioned.v1` | Building | New condition version | BuildingConditionVersion | Policy-based | Pricing, activity |
| `guarantee.created.v1` | Guarantee | Valid case created | GuaranteeCase | Policy-based | Activity, notification |
| `guarantee.payment.recorded.v1` | Guarantee | Deposit/payment recorded | GuaranteeDeposit | Policy-based | Activity, KPI |
| `guarantee.refund.requested.v1` | Guarantee | Valid transition/request | GuaranteeRefundRequest | Policy-based | Notification, follow-up |
| `guarantee.refund.partial_received.v1` | Guarantee | Partial refund posted | GuaranteeRefund | Policy-based | KPI, activity, notification |
| `guarantee.refund.completed.v1` | Guarantee | Fully reconciled refund | GuaranteeCase | Yes | KPI, activity, notification |
| `pricing.estimate.created.v1` | Pricing | Initial estimate version saved | PriceEstimate | Policy-based | Activity |
| `pricing.estimate.submitted.v1` | Pricing | Valid submit transition | PriceEstimateVersion | Policy-based | Approval notification |
| `pricing.estimate.revision_requested.v1` | Pricing | Reviewer requests revision | PriceEstimateVersion | Quality policy | KPI, activity, notification |
| `pricing.estimate.approved.v1` | Pricing | Authorized approval | PriceEstimateVersion | Yes | KPI, activity, notification, automation |
| `document.verified.v1` | Attachment/domain owner | Authorized evidence verification | Attachment | Policy-based | KPI, activity |
| `activity.corrected.v1` | Activity/Admin | Approved correction/reversal | ActivityEvent | Recalculation | KPI, audit |

Each implementation PR must add payload schema, producer authorization, trigger/state precondition, actor/owner semantics, idempotency key construction, retention/classification and test cases before the event is activated.

## Permission Out / Site Facility v1 (local, two modules default-disabled)

Producer: native route/site services, authorized Core actor bound to transaction; the owning module gate, action capability and OWN/TEAM/SELECTED_TEAMS/ALL checks precede each business write. Every material transition commits business state, audit, activity and outbox atomically using Core `runMaterialChange`; audit failure rolls back the transition. No KPI eligibility is inferred. Following the owner-approved split, route actions use module ID `permission-out` and prefix `permission_out.`; site actions use module ID `site-facility` and prefix `site_facility.`. Existing historical events are not rewritten.

| Event suffix after owning module prefix | Precondition / primary entity |
| --- | --- |
| `dataset.staged.v1` | Both domains: validated kind/file, checksum + active-baseline idempotency / immutable version |
| `dataset.published.v1`, `dataset.rolled_back.v1` | Both domains: owning-domain publisher capability, matching expected dataset version and reviewed baseline / version |
| `formula.created.v1` | Formula administrator, validated effective-dated immutable policy / formula |
| `analysis.completed.v1` | Analyze + project-manage scopes, input digest/idempotency key, immutable output / project |
| `project.archived.v1` | Project manager, scoped owner/team and expected version / project |
| `site.updated.v1`, `site.archived.v1` | Site-update scope, active base version and optimistic edit version / dataset (site key in private audit) |
| `comment.created.v1` | Comment-create scope and existing source site / comment |
| `source.downloaded.v1` | Owning-domain dataset administration; additionally site OPEX access for site originals / source version |

Activity schema: `{id: UUID, action: string}`; outbox schema: `{id: UUID}`. Envelope actor/owner is the acting user; domain owner/team authorization is checked against the referenced record. No raw rows, source bytes or OPEX values enter the outbox. Each committed event has a generated UUID as correlation/request/source-event/idempotency key; retries that reuse an existing import/analysis return the prior entity without another material event. SQL transaction locks/constraints enforce concurrent write protection.

Classification/retention: internal operational metadata under existing Core audit/outbox retention; imported originals and private financial history remain private module data governed by backup/access/retention policy, not public event payload. Consumers may project activity/search or deliver future integrations. Native comments/read markers provide the current durable inbox; no new email/Outlook delivery consumer is activated. Tests cover persisted audit/outbox and business rollback on audit failure. Read markers are personal state, not material business events.
