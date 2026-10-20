# Workspace information architecture

Current: shared shell, permission-filtered grouped navigation, search keyboard shortcut, account and theme controls; notification inbox is recipient-scoped and requires inbox capabilities. Notification destination routes must reauthorize independently.

The versioned module contract lives in `module-contract.ts`. Zod rejects malformed IDs/routes, duplicates and undeclared entry capabilities. `module-registry.ts` supplies presentation, entry grants, ownership, lifecycle, providers and catalog. Only active/default-enabled manifests appear to granted users. Pilot/maintenance/disabled/retired modules stay hidden until their release policy is implemented. The Module 4 fixture is test-only.

Dependency adjustment: the foundational registry contract moved before shell consumers (from Phase 7.5), because navigation, dashboard and Admin share it. JEV routing agreed; source inspection established this dependency. Database lifecycle/pilot enablement and catalog synchronization remain planned, not implied by this static manifest contract.

Notifications show at most 30 recent entries with total unread count, explicit refresh through page refresh, read-one/read-all operations, and native dialog focus behavior. No background polling or new infrastructure.
