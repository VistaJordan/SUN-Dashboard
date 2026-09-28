# SUN Holdings Live Portal — deployment guide

The portal is a single web page for Sun Holdings and the Seamless FM team:

- Approvals come first, grouped by chain of command.
- Seamless FM posts updates, alongside the full work order list and the BFI counter for expiring quotes.
- A Manage section lets Seamless FM staff upload the weekly tracker and customise what the client sees.

**Access (current setup, since 28 Sep 2026):** there is no Microsoft sign-in. Anyone with the link can view. Seamless FM staff unlock editing by clicking **Seamless FM sign-in** in the top bar and entering their name and the admin code. An optional viewer code can be added so that Sun Holdings also enters a code once. Changes reach every open page within about 15 seconds.

> The Microsoft Entra sign-in version of the portal is kept in git history (commit `803cc7b`) if it is wanted later.

It runs on:

- Vercel hosting
- One serverless API (`api/portal.js`) that checks the codes on every request
- A private Vercel Blob store for the data

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The portal. Nothing in it needs editing to deploy. |
| `api/portal.js` | The data API. It checks the admin / viewer codes, then reads or writes the portal data. |
| `package.json` | API dependency: `@vercel/blob`. |
| `vercel.json` | Security headers. |
| `.env.example` | The environment variables to set in Vercel. |
| `SFM-ADMIN-GUIDE.md` | How Seamless FM staff run the portal each week. Give this to the account team. |

## How it works

```
Browser ── GET / POST /api/portal
              │  X-Portal-Key   = admin code   -> may write
              │  X-Portal-View  = viewer code  -> may read (only if PORTAL_VIEW_KEY is set)
              ▼
         Vercel Blob (private): portal state, last 30 versions kept
```

- Open pages ask the API for changes every 15 seconds, and again immediately when the tab becomes visible.
- No work order data is in the HTML file. Everything is served through `/api/portal`.
- The codes are checked on the server. Hiding the admin controls in the page is only a convenience.

## Deploying

The live project is `sun-holdings-portal` on Vercel (scope `jordans-projects-ff8773c6`), connected to the GitHub repo `VistaJordan/SUN-Dashboard`, with the Blob store `sun-portal-data` linked to production. **Every push to `main` deploys automatically.** To deploy by hand from this folder:

```bash
npx vercel deploy --prod --yes --scope jordans-projects-ff8773c6
```

### Setting up from scratch (new project)

1. `npx vercel link` in this folder and create the project.
2. Vercel dashboard → project → **Storage** → **Create** → **Blob**, private, connected to Production. This adds `BLOB_READ_WRITE_TOKEN`. (CLI: `npx vercel blob create-store <name> --access private --environment production --yes`.)
3. Set the environment variables below, then deploy.

## Environment variables (Production)

| Variable | Value |
|---|---|
| `PORTAL_ADMIN_KEY` | The Seamless FM admin code. Long and hard to guess. Required for any editing. |
| `PORTAL_VIEW_KEY` | Optional viewer code. If set, everyone must enter it once to view. |
| `BLOB_READ_WRITE_TOKEN` | Added by the Blob integration. |

Set or change a value with the CLI, then redeploy:

```bash
npx vercel env add PORTAL_ADMIN_KEY production --value "the-new-code" --force --yes --scope jordans-projects-ff8773c6
npx vercel deploy --prod --yes --scope jordans-projects-ff8773c6
```

Changing the admin code signs every admin out; they enter the new code once.

## First run (Seamless FM admin)

1. Open the portal, click **Seamless FM sign-in** in the top bar, enter your name and the admin code.
2. Go to **Manage** → **Upload tracker** and drop this week's tracker.
3. Check the **Chain of command**. It starts with Sun Holdings' chain as we know it (store WO managers under $2,000; James for $2,000 and over; brand rosters for Uncle Julio, IHOP and Bar Louie).
4. Switch the top bar to **Client view** to see exactly what Sun Holdings sees.
5. Send the URL to the Sun Holdings contacts (and the viewer code, if one is set).

## Test checklist

| Check | Expected |
|---|---|
| Open the URL in a fresh browser | Client view, read-only, **Live** in the top bar; "No live data yet" until a tracker is uploaded |
| Click **Seamless FM sign-in**, enter name + admin code | Top bar shows your name, the **SFM admin / Client view** switch, and **Manage** |
| Wrong admin code | "That code isn't right", still read-only |
| Upload the tracker | Approvals, BFI counter and work order list fill in |
| Second browser, no code | Same data, read-only |
| Admin posts an update | The other browser shows it within ~15 s |
| Click your name twice | Signs out of editing |

## Troubleshooting

| Symptom | Fix |
|---|---|
| Admin code is refused | `PORTAL_ADMIN_KEY` isn't set in Vercel Production, or you didn't redeploy after setting it. |
| **"Enter the access code"** for viewers | `PORTAL_VIEW_KEY` is set. Give the code to the client, or remove the variable and redeploy. |
| **"Couldn't reach the portal"**, or 500 errors in Vercel logs | The Blob store isn't connected to Production (`BLOB_READ_WRITE_TOKEN` missing). Check Vercel → Storage. |
| Top bar shows **Offline** | The browser lost the connection; it retries every 15 seconds. |

## Security and data notes

- With no viewer code, **the link alone gives read access to the work orders.** The address is not indexed (`noindex` headers and meta), but treat it as private and set `PORTAL_VIEW_KEY` if the client's data should not be reachable by link alone.
- Writes always need the admin code. The code is stored in the admin's browser after they enter it; "Sign out" (click your name twice) removes it.
- Every save writes a new version, and the **last 30 versions** are kept. To roll back, open Vercel → Storage → the Blob store and delete the newest `portal-state-…` files. The portal always reads the newest remaining one.
- If two admins save at the same instant, the later save wins. Avoid two people uploading trackers at the same moment.
- Limits: 5,000 documents, and 256 KB per document. A tracker is split into 250-row pieces, so about 6,000 rows are fine.

## Updating the portal later

- Edit `index.html` or `api/portal.js`, commit, and push to `main`. Vercel deploys it. The data is untouched.
- A separate copy of the portal also exists on claude.ai. Its data is stored separately from this deployment and is not shared with it.
