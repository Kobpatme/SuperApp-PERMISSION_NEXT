# On-premise deployment

## Required services

- Node.js 22 LTS application service
- PostgreSQL 16 or newer on the organization network
- A private local or network folder for guarantee evidence
- TLS termination at the organization reverse proxy

## Initial setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` and an absolute `GUARANTEE_STORAGE_DIR`.
2. Grant the application service account read/write access only to that evidence directory.
3. Run `npm ci`, `npm run db:migrate`, and `npm run auth:bootstrap`.
4. Sign in with the bootstrap account and replace its temporary password.
5. Create positions and users from **ผู้ดูแลระบบ**. Database editing is not required after bootstrap.

## Identity and session controls

- Passwords use Argon2id; plaintext passwords are never stored or logged.
- Five failed attempts lock an account for 15 minutes.
- Browser sessions use random 256-bit opaque tokens. PostgreSQL stores only SHA-256 token hashes.
- Cookies are HttpOnly, SameSite=Lax, and Secure in production.
- Suspending a user or resetting a password revokes all of that user's sessions.
- The last active platform administrator cannot be suspended from the Admin Workspace.

## Backup scope

Back up PostgreSQL and `GUARANTEE_STORAGE_DIR` as one operational set. Restore them to the same point in time where possible so database evidence paths and stored files remain consistent.
