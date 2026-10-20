# Microsoft 365 / SharePoint connection readiness

The application is prepared to verify server-to-server access to the existing target:

- Host: `uihoffice.sharepoint.com`
- Site path: `/sites/UIHOutsidePlantDatabaseDesign`
- Document library: `Shared Documents`
- Root folder: `Permission Next`

No SharePoint resource is created or modified by the readiness check. The check only resolves the site, library, and folder through Microsoft Graph.

## Information required from IT

Ask the Microsoft 365 administrator to:

1. Create a single-tenant Microsoft Entra application registration for Permission Next.
2. Provide the Tenant ID and Client ID.
3. Create a production credential. Prefer a certificate or managed identity where the hosting platform supports it. The current readiness adapter accepts a client secret for initial integration testing.
4. Grant Microsoft Graph application permission `Sites.Selected` and approve admin consent.
5. Grant that application access to the site `/sites/UIHOutsidePlantDatabaseDesign`. Start with `read`; grant `write` only when upload and data mutation are implemented and approved.
6. Confirm whether operational records will use Microsoft Lists in this site or Dataverse. Documents can use the existing `Permission Next` folder.

Do not send client secrets in chat, email, issue trackers, or commit them to source control.

## Local configuration

Copy `.env.example` to `.env.local` and set:

```dotenv
M365_TENANT_ID=
M365_CLIENT_ID=
M365_CLIENT_SECRET=
SHAREPOINT_HOSTNAME=uihoffice.sharepoint.com
SHAREPOINT_SITE_PATH=/sites/UIHOutsidePlantDatabaseDesign
SHAREPOINT_DOCUMENT_LIBRARY=Shared Documents
SHAREPOINT_ROOT_FOLDER=Permission Next
```

`SHAREPOINT_SITE_ID` and `SHAREPOINT_DRIVE_ID` are optional. Leave them empty during discovery; after a successful check they can be pinned to reduce name-based lookup.

## Verify the connection

1. Start the app and sign in as a Permission Next administrator (or use the development session locally).
2. Request `GET /api/integrations/sharepoint/readiness`.
3. Interpret the response stage:
   - `configuration`: one or more environment variables are missing or invalid.
   - `authentication`: the Entra credential is invalid or expired.
   - `authorization`: admin consent or the site-specific grant is missing.
   - `resource`: the site, library, or folder could not be resolved.
   - `connected`: Graph can read the configured folder metadata.

The endpoint never returns the client secret or access token.

## Production follow-up

The readiness adapter is intentionally separate from the existing Supabase data path. After IT approves the target data model, migrate authentication to Entra ID and implement dedicated Microsoft Lists/SharePoint repositories module by module. Do not switch production data storage merely because the readiness endpoint succeeds.

