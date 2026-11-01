# Overview implementation slice

Producer scope: actual Overview only; independent QA and authenticated acceptance remain OPEN.

## Consumer boundary / preservation map
- `(platform)/page.tsx`: server `getWorkspaceData` and `getHomeWorkMessages` remain unchanged. Announcements + active/maintenance/coming system links are moved to a presentation-only `OverviewMessages` component, also mounted in the safe browser fixture.
- `DashboardOverview`: PreviewNotice (development/live/preview), PageHeader + refresh/freshness, allowed-module empty state, all allowed directory destinations and preview query, SourceDetails.
- `WorkspaceQueue`: Overview caller sets `appearance="overview"`; native-module-foundation is the other caller and retains default presentation. Existing counts and URL/history/settings/read model stay unchanged. Four metric views (all/urgent/today/mine), query, status/sort disclosure/reset, saved view load/apply/save/delete/8 limit/storage error/Escape, partial/500 limit, row/page selection/copy/success/failure/cancel, title/due sort, local table scroll, record detail/copy/open destination/preview restriction/Escape/backdrop/close/focus return, inaccessible-record notice/dismiss, paging and unavailable/not-configured/ready-empty/filter-empty remain mapped. No new business widgets/actions/data or auth policy.
- Overview CSS module owns composition/depth/compact metrics/filter wells/flat table/detail/saved-view/feedback/mobile styles. Existing app tokens and primitives are consumed, not redefined. Shared Dialog, Work create/assignment and shell remain untouched.
- No client-loading fetch exists in Overview: server route loading stays existing; refresh pending retains source component behavior. No artificial loading data state added.
- Role variants are source-driven `allowedModuleIds`, `userId` and server snapshot; no client grant rules introduced. Fixture explicitly uses TEST-only model and mocked Next navigation; not authentication acceptance.

## Reference / design contract
Inspected Figma screenshot outputs for AFiYS0OB93glB6at2o3Vnr desktop 2:7 and mobile dark 2:4. Reference has raised large planes and inset controls; product uses existing blue/Thai fonts and legible flat rows, not lavender or new extracted Figma tokens. Compact filterable KPIs; queue is the primary work surface; allowed directory is a lower-priority flat list. Mobile keeps all controls and local horizontal table scrolling. Light/dark use existing semantic colors/depth. No duplicate shell/navigation.

## Remaining whole-program scope
Other eight screen families, Buildings and all module/auth/Admin work remain OPEN in unified-ui-migration.md; this slice is not whole-system completion.
