# Accessibility and performance verification

Status: current repository evidence; authenticated production acceptance remains required.

## Accessibility

- The shell provides a keyboard skip target, visible focus rings, native links/buttons/forms and labelled search, navigation, notification, dialog and table regions.
- Loading, error, empty and access-denied paths expose text and live/alert semantics rather than color alone.
- Reduced-motion preferences suppress transitions and loading animation.
- The Buildings map is a labelled region. Keyboard users use the server-backed search/results workflow to open the same Building 360 records without operating map gestures.
- Guarantee table rows activate only when the row itself has focus; keyboard events from nested links and buttons no longer trigger row navigation.
- Admin inline editors have accessible names. Permission codes are progressively disclosed under Advanced details.

Manual browser acceptance on 2026-09-29 covered the unauthenticated login route at desktop, 768×1024 tablet and 390×844 mobile widths. On 2026-09-30 the local dev server also rendered the current login shell with the refreshed green/neutral token direction and visible focus state. There was no horizontal overflow, labels and keyboard focus order were present, and the browser console reported no warning or error. Authenticated Work route acceptance remains blocked by the absence of a test credential and must be repeated with an organization-approved test account; the new dense tables should specifically be checked at 390px and 768px widths.

## Performance

- Buildings performs scoped server search/filter reads with stable `(name_th, id)` keyset cursors and sends at most 100 records to the map workspace by default.
- Building 360 loads authorized related sections on the server and does not ship the full Buildings dataset.
- Work and dashboard providers query internal bounded read models. Notifications and audit history are bounded.
- Module registry metadata drives navigation and prevents disabled modules from invoking search/dashboard providers.
- Dead iframe bridge components, message listeners and their CSS were retired. Legacy migration routes remain development/reference paths and production guards remain authoritative.
- Old unconsumed KPI/calendar/guarantee demo CSS and the remote logo hotlink were removed. Remaining `!important` declarations are limited to reduced-motion overrides and Leaflet popup sizing.

Production performance still needs representative query plans, database cardinality, network/storage latency and concurrency load. A dedicated Buildings viewport projection remains conditional on those measurements.
