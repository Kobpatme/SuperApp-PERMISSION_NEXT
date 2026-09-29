# Buildings module

Status: Current incremental V2 implementation.

The map-first workflow remains. `/buildings` parses bounded URL filters, applies team data scope and text/filter predicates on the server, and returns at most 100 full records per page. Pagination and selected filter state remain shareable in the URL. The client map and drawer operate only on the bounded current page. Documents load only after opening the Documents tab.

`/buildings/[canonical UUID]` is Building 360. Related tasks, guarantee cases, estimates, attachments and activity are queried by canonical Building UUID and each section is filtered by its server capability and owner/team scope.

Current limitation: pagination uses bounded offset pages while a reviewed composite keyset cursor and viewport projection remain planned. Filter predicates use the latest condition JSON pending dedicated indexed projection columns. A production-like database is needed for query-plan validation.
