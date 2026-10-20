# Module boundaries

| Module | Owns | May consume | Must not own |
| --- | --- | --- | --- |
| Identity | User, Profile, Team, membership, Role, Permission, grants/data scopes | Identity provider events | Business status or KPI facts |
| Building | Canonical Building, aliases/source maps, contacts, conditions and merge history | Identity actor IDs | Guarantee/estimate lifecycle fields |
| Work | Project/work context, Task, Assignment and manual off-system entry | Building/User/Team IDs, business activity | KPI policy |
| Activity | Immutable ActivityEvent, correction/reversal links, correlation/idempotency keys | Published domain events | Security audit detail |
| Audit | Append-oriented security/material-change log | Authenticated actor/request context | KPI inputs |
| KPI | Metrics, rule versions, periods, targets, facts, scores, adjustments and calculation runs | Validated ActivityEvent | Primary work records |
| Guarantee | Guarantee case, deposits/refunds, transitions and guarantee-specific evidence links | Building/Project/User IDs | Building master fields |
| Pricing | Cost conditions, estimates, versions, items, snapshots and approvals | Building/User IDs | Mutable overwrite of approved versions |
| Attachment | Metadata, provider/storage key, checksum, classification, lifecycle | Authorization decision and owning entity reference | Domain workflow state |
| Notification | In-app notifications, delivery attempts/preferences | Published events | Domain state changes |
| Automation | Rules, executions, retry/idempotency and action adapters | Published events | Direct privilege elevation |
| Reporting | Permission-scoped read models and aggregates | Published contracts/views | Canonical writes |

Cross-module pages such as Building 360 call an application composition service. That service fans out to authorized module queries and does not duplicate canonical records.
