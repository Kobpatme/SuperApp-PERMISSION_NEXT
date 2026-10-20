# Permission Next source integration

- Source: https://github.com/Kobpatme/Permission_Next.git
- Source commit inspected: `121358b40da598a24b214b5d58c194c4eb7adaf3`
- Integration mode: faithful source reuse
- Entry file: `Permission_Next.html`
- Super App mount: `/mods/permission-next/Permission_Next.html?embedded=super-app`

## Fidelity

The original map, building drawer, quotation workflow, role handling, and Firestore integration are retained. When opened inside the Super App, authentication is delegated to the shell through a same-origin `postMessage` session bridge. The module's login, user-management, and logout controls are disabled in embedded mode; standalone mode keeps the original login.

## Verification

- Original entry loads with title `Permission Next — Map Dashboard`.
- Embedded entry loads inside Mod 2.
- Embedded entry opens the map directly and receives the user name and Permission role from the Super App session.
- Standalone entry remains authentication-locked.
- Super App switching activates the `permission` page and mounts exactly one module frame.

## License and ownership

The source repository does not include a license file. It is reused here because the repository owner explicitly identified it as Mod 2 for this project. Do not redistribute it as a third-party template without confirming rights.
