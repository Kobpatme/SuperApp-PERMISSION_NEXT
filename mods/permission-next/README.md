# Permission Next

Static dashboard for Cloudflare Pages.

## Deploy to Cloudflare Pages

1. Push this folder to `Kobpatme/Permission_Next.git`.
2. In Cloudflare Pages, connect the repository.
3. Use these build settings:
   - Framework preset: `None`
   - Build command: leave empty
   - Build output directory: `/`
4. Open the deployed site root. `index.html` redirects to `Permission_Next.html`.

## Production Files

- `Permission_Next.html` - main application
- `index.html` - root entry point for Cloudflare Pages
- `_headers` - basic HTTP headers for the static site

`permission_master.xlsx` and `Test.html` are ignored by git so local source/test files do not get published accidentally.

## Basic Login

The legacy static app includes a basic in-app login gate backed by the existing Firestore `buildings` collection, using the hidden document `permission_next_auth`. Do not publish or reuse legacy default credentials. The current platform administrator must be created through the secure bootstrap flow documented at the project root, with a temporary password supplied interactively and changed on first sign-in.

Roles:

- `admin` - manage buildings and users
- `permission` - manage buildings
- `sale` - view/search buildings and create preliminary quotations

This is a lightweight client-side access layer, not a replacement for server-side security rules.

## Building Documents on NAS

The embedded module includes the upstream Documents tab, exact building-folder matching,
short-lived opaque download links, and controlled uploads for authorized accounts. The Super App
starts the vendored NAS bridge together with `npm run dev` or `npm run start` and proxies
`/api/nas/*` to it. Configure `NAS_BUILDING_ROOT` when the shared drive is mounted somewhere other
than the default `P:` path. Run `npm run test:documents` to verify exact-name and ambiguous-folder
handling.
