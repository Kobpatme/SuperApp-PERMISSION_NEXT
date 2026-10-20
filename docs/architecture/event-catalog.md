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
