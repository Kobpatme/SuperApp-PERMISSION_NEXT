# Source schema inventory

The repositories do not contain authoritative production DDL/exports. This inventory is derived from current code and must be reconciled with read-only production metadata before migration.

| Source | Entity | Storage | Key observations |
| --- | --- | --- | --- |
| MAXIWA KPI | users | Supabase table | Employee ID variants, name/team/role, permissions JSON, optional session fields |
| MAXIWA KPI | teams/kpis/holidays | Supabase tables | Text-based relations; KPI carries SLA days/weight |
| MAXIWA KPI | tasks | Supabase table | Mixed work/KPI snapshot data, flexible column variants, `extra_data` |
| MAXIWA KPI | audit_log | Supabase table | Multiple legacy column-name variants |
| Guarantee | users | Firestore collection | Plaintext password, role/area/flags/session marker |
| Guarantee | deposits | Firestore collection | Denormalized case, numeric money, parallel status fields, URL attachments, embedded log |
| Guarantee | password_reset_requests | Firestore collection | Request/contact/reason/time |
| Guarantee | evidence | Firebase Storage | Persistent download URLs embedded in case documents |
| Permission Next | buildings | Named Firestore collection | Building, contacts, conditions, cost/BOQ/calculation data mixed together |
| Permission Next | auth/config docs | Same `buildings` collection | User arrays and permission formula registry |
| Permission Next | documents | Windows/NAS | Naming-based folder mapping by region/province/building |
| Permission Next | quotation | Browser memory/local state | Not a durable source entity |

Required next evidence: field/type/nullability statistics, unique/duplicate profiles, row counts, database indexes/policies, Firestore/Storage Rules, attachment object inventory and representative anonymized exports.
