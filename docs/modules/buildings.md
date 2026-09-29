# Buildings module

Status: Current incremental V2 implementation.

The map-first workflow remains. `/buildings` parses bounded URL filters, applies team data scope and text/filter predicates on the server, and returns at most 100 full records per page. Stable `(name_th, id)` keyset cursors drive previous/next navigation and selected filter state remains shareable in the URL. The client map and drawer operate only on the bounded current page. Documents load only after opening the Documents tab.

`/buildings/[canonical UUID]` is Building 360. Related tasks, guarantee cases, estimates, attachments and activity are queried by canonical Building UUID and each section is filtered by its server capability and owner/team scope.

Current limitation: the map uses the bounded current cursor page rather than a separate viewport projection. Filter predicates use the latest condition JSON pending dedicated indexed projection columns. A production-like database is needed to decide whether viewport projection adds enough value and to validate query plans.
