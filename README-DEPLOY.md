# SUN Holdings Live Portal — deployment guide (for IT)

The portal is a single web page for Sun Holdings and the Seamless FM team:

- Approvals come first, grouped by chain of command.
- Seamless FM posts updates, alongside the full work order list and the BFI counter for expiring quotes.
- An admin side lets Seamless FM staff upload the weekly tracker and customise what the client sees.

Everyone signs in with Microsoft. Changes reach every open page within about 15 seconds.

It uses the same setup as Sam's Hub:

- Vercel hosting
- Microsoft Entra ID sign-in (MSAL.js)
- One serverless API that verifies each sign-in
- A private Vercel Blob store for the data

Expect about 30–45 minutes, most of it in the Entra portal.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The portal. The only place anyone edits code is the **DEPLOYMENT SETTINGS** block near the top (two IDs). |
| `api/portal.js` | The data API. It checks the Microsoft sign-in token and the access lists on every request, then reads or writes the portal data. |
| `package.json` | API dependencies: `@vercel/blob` and `jose`. |
| `vercel.json` | Security headers. |
| `.env.example` | The environment variables to set in Vercel. |
| `SFM-ADMIN-GUIDE.md` | How Seamless FM staff run the portal each week. Give this to the account team. |

## How it works

```
Browser ── Microsoft sign-in (Entra ID) ──> ID token
   │
   └─ GET / POST /api/portal  (Authorization: Bearer <ID token>)
          │  verifies the token (tenant, audience, signature)
          │  checks PORTAL_ADMINS / PORTAL_VIEWERS
          ▼
      Vercel Blob (private): portal state, last 30 versions kept
```

- **Viewers** (Sun Holdings) can read.
- **Admins** (Seamless FM) can also upload data, post updates, add work order notes and change settings.
- Open pages ask the API for changes every 15 seconds, and again immediately when the tab becomes visible.
- No work order data is in the HTML file. Everything is served only to signed-in people on the access lists.

## Step 1: Register the app in Microsoft Entra

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name the registration `SUN Holdings Live Portal`.
3. For **Supported account types**, pick one:
   - *Accounts in this organizational directory only*, if you use Option A in Step 2 (recommended).
   - *Accounts in any organizational directory*, if you use Option B.
4. Click **Register**.
5. Go to **Authentication** → **Add a platform** → **Single-page application**. Enter the exact address the portal will live at, e.g. `https://sun-holdings-portal.vercel.app/`.
   - Include the trailing `/`.
   - If you add a custom domain later, add that address too.
   - Leave the implicit-grant boxes unticked.
6. Go to **Token configuration** → **Add optional claim** → **ID** → tick **email** → **Add**.
7. From **Overview**, copy the **Application (client) ID** and the **Directory (tenant) ID**.

> Sam's Hub already uses tenant `57adc4bb-6b35-4ff1-9036-4306aeff563e`. If the Seamless FM staff accounts are in that same directory, it is the tenant ID to use here.

## Step 2: Decide how Sun Holdings signs in

**Option A (recommended): invite them as guests.**

1. In **Microsoft Entra ID → Users → New user → Invite external user**, invite each Sun Holdings contact by their work email.
2. They accept the email invitation once, then sign in with their own Microsoft account.
3. Keep the app single-tenant, and put only the Seamless FM tenant ID in `ENTRA_TENANT_IDS`.

**Option B: multi-tenant.** Use this if Sun Holdings has its own Microsoft 365 tenant and you don't want to manage guests.

1. Make the app registration multi-tenant (Step 1.3).
2. In `index.html`, set `tenantId: 'organizations'`.
3. Add Sun Holdings' tenant ID to `ENTRA_TENANT_IDS`, after the Seamless FM one.
4. Their IT may need to consent to the app once.

With either option, only the people and domains you list in `PORTAL_VIEWERS` / `PORTAL_ADMINS` get in (Step 5).

## Step 3: Paste the two IDs into `index.html`

Open `index.html` in a text editor. Near the top, find this block:

```js
window.PORTAL_HOSTED = {
  clientId: 'PASTE-APPLICATION-CLIENT-ID-HERE',
  tenantId: 'PASTE-DIRECTORY-TENANT-ID-HERE',
  api: '/api/portal'
};
```

Paste the Application (client) ID and Directory (tenant) ID, then save. If you chose Option B, use `'organizations'` as the tenant ID.

## Step 4: Create the Vercel project and Blob store

In this folder, on a machine with Node.js 18+:

```bash
npx vercel link
```

Create a new project, e.g. `sun-holdings-portal`, in the same Vercel team as Sam's Hub. Then in the Vercel dashboard:

1. Open the project → **Storage** → **Create** → **Blob**.
2. Name the store e.g. `sun-portal-data` and connect it to this project for **Production**.
3. This adds `BLOB_READ_WRITE_TOKEN` automatically.

## Step 5: Set the environment variables

In the project → **Settings** → **Environment Variables** → **Production**, set these (see `.env.example`):

| Variable | Value |
|---|---|
| `ENTRA_CLIENT_ID` | Application (client) ID from Step 1. |
| `ENTRA_TENANT_IDS` | The Seamless FM tenant ID. For Option B, add a comma and the Sun Holdings tenant ID. |
| `PORTAL_ADMINS` | Seamless FM people who can edit: emails or `@domain` entries, comma-separated. For example `samh@byblosvista.com,@seamlessfm.com`. |
| `PORTAL_VIEWERS` | Sun Holdings people who can view. Listing individual emails is safest; a whole `@domain` also works. |

Emails are matched against the sign-in's email address, ignoring upper/lower case.

After any change to these variables, **redeploy** (Step 6) for it to take effect.

## Step 6: Deploy

```bash
npx vercel deploy --prod --yes
```

Open the production URL. It must match the redirect URI from Step 1 exactly.

To use a custom domain such as `portal.seamlessfm.com`:

1. Add it in Vercel → **Domains**.
2. Add `https://portal.seamlessfm.com/` as another redirect URI in Entra.

## Step 7: First run (Seamless FM admin)

1. Open the portal and choose **Sign in with Microsoft** with an account on `PORTAL_ADMINS`.
2. Go to **Manage** → **Upload tracker** and drop this week's tracker (currently `SUN Holdings Tracking 9-25.xlsx`).
3. Check the **Chain of command**. It comes set up with Sun Holdings' chain as we know it:
   - Level 1, under $2,000: the brand's store WO managers.
     - Uncle Julio: Shenika Harris, Matt Hebert, Jorge Manjarrez, Candy (to confirm).
     - IHOP: Christopher Ware, Jose Murcia, Morgan Crawford.
     - Bar Louie: Alyssa Williams, Robert Martin, Brian DeHart (VP, sometimes).
   - Level 2, $2,000 and over: James (ultimate approval).

   Other brands (Applebee's, Papa John's, Arby's, Freebirds) show as "not confirmed" and use the WO MGR column until their approvers are added in Manage.
4. Switch the top bar to **Client view** to see exactly what Sun Holdings sees.
5. Send the URL to the Sun Holdings contacts listed in `PORTAL_VIEWERS`. For Option A, they must have accepted their guest invitation first.

## Test checklist before handing over

| Check | Expected |
|---|---|
| Open the URL while signed out | Sign-in screen with **Sign in with Microsoft** |
| Admin signs in | Top bar shows their name, **Live**, and the **SFM admin / Client view** switch; **Manage** section is visible |
| Upload the tracker | Approvals, BFI counter and work order list fill in |
| Viewer signs in (second browser) | Same data, read-only: no Manage section and no post box |
| Admin posts an update | The viewer's page shows it within ~15 s, without reloading |
| Someone not on either list signs in | "No access yet" screen showing their email |
| Click your name in the top bar twice | Signs out |

## Troubleshooting

| Symptom | Fix |
|---|---|
| **"Setup needed"** screen | The IDs in `index.html` are still placeholders or mistyped (Step 3). |
| Pop-up shows **AADSTS50011** (redirect URI mismatch) | The address in the browser must exactly match a redirect URI in Entra → Authentication, including `https://`, the domain, the path and the trailing `/`. |
| **AADSTS700016** (application not found) | Wrong client ID, or the app registration isn't multi-tenant while you're using `organizations`. |
| **"No access yet"** for someone who should get in | Their sign-in email isn't on `PORTAL_VIEWERS` / `PORTAL_ADMINS`, or you didn't redeploy after changing them. Guests sometimes sign in with a different address than the one invited; add the address shown on the screen. |
| Every request fails and sign-in repeats | `ENTRA_CLIENT_ID` or `ENTRA_TENANT_IDS` in Vercel doesn't match the app registration, or the account's tenant isn't listed. |
| **"Couldn't reach the portal"**, or 500 errors in Vercel logs | The Blob store isn't connected to Production (`BLOB_READ_WRITE_TOKEN` missing). Check Vercel → Storage. |
| Top bar shows **Reconnect** | The Microsoft session expired (after about a day). Click **Reconnect** to sign in again. |
| Sign-in pop-up doesn't open | Allow pop-ups for the portal's address. |

## Security and data notes

- The data lives only in the private Blob store. It is served only through `/api/portal` to a verified Microsoft sign-in on the access lists. The HTML file contains no tracker data. Its only client details are the default approver names for the chain of command (names only, no contact details), so it can be edited in Manage without a redeploy.
- The access lists are enforced on the server. Hiding the admin controls in the page is only a convenience, not a security measure.
- Every save writes a new version, and the **last 30 versions** are kept. To roll back, open Vercel → Storage → the Blob store and delete the newest `portal-state-…` files. The portal always reads the newest remaining one.
- If two admins save at the same instant, the later save wins. That's fine for a small team, but avoid two people uploading trackers at the same moment.
- Limits: 5,000 documents, and 256 KB per document. A tracker is split into 250-row pieces, so about 6,000 rows are fine.

## Updating the portal later

- Replace `index.html`, keeping your two IDs in the settings block, and run `npx vercel deploy --prod --yes`. The data is untouched.
- A separate copy of the portal also exists on claude.ai. Its data is stored separately from this deployment and is not shared with it.
