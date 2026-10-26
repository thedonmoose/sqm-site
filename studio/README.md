# SQM Sanity Studio

Content studio for **Serene Quality Motors** — inventory (vehicles), site settings and reviews. The public site (Astro, in the repo root) reads from this dataset.

Staff-facing instructions live in [STAFF-GUIDE.md](./STAFF-GUIDE.md).

## 1. Create the Sanity project (owner, one time)

1. Create an account at [sanity.io](https://www.sanity.io) and a new project at [sanity.io/manage](https://www.sanity.io/manage). The free tier is sufficient.
2. Note the **project ID** (shown on the project page) and create a **production** dataset.
3. Invite editors: project → **Members** → invite by email with the **Editor** role. Staff use their own logins at the deployed studio URL.
4. Create an API token: project → **API** → **Tokens** → add a token with the **Editor** role. Keep it secret; it is used by the seed and photo-import scripts.

## 2. Configure and run

The studio ships with a placeholder project ID (`sqmplaceholder`). Override it with environment variables — either export them, or create `studio/.env`:

```
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

```sh
cd studio
npm install
npx sanity dev        # local dev server
```

Requires Node.js 22.12+.

## 3. Deploy the studio (hosted, free)

```sh
npx sanity deploy     # prompts for a hostname, e.g. sqm.sanity.studio
```

Deployed studios read the same env config baked in at deploy time, so set `SANITY_STUDIO_PROJECT_ID` before deploying.

## 4. Seed sample content

```sh
export SANITY_API_TOKEN=your-token
node scripts/seed.mjs --project-id your-project-id
```

Creates the site settings singleton (business name, address) and 4 clearly-marked sample vehicles (one sold, one with a disclosed accident history). Samples are prefixed `[SAMPLE VEHICLE — remove before launch]` — delete those documents before going live. Fill in phone, email and hours in the Studio, then publish **Site settings**.

## 5. Import photos from a folder

```sh
export SANITY_API_TOKEN=your-token
node scripts/import-photos.mjs --dir ./photos --project-id your-project-id
node scripts/import-photos.mjs --help   # full usage + dry-run
```

Folder convention: one subfolder per vehicle named by stock number or VIN, files ordered by filename, `interior` in a filename marks an interior shot. Imports are written as **drafts** for staff review. See STAFF-GUIDE.md for the convention summary.

## 6. Publish webhook → website rebuild

When content is published, the website rebuilds automatically. Set this up once in [sanity.io/manage](https://www.sanity.io/manage):

1. Get the **deploy hook URL** from the Cloudflare Pages dashboard (*Settings → Builds & deployments → Deploy hooks*), created for the SQM site.
2. In Sanity Manage: project → **API** → **Webhooks** → *Create webhook*.
3. Trigger on **Create, Update, Delete**, HTTP method **POST**, and add the filter below so the hook only fires when a document is actually published (not on every draft keystroke):
   ```
   _type in ["vehicle", "siteSettings", "review"] && !(_id in path("drafts.**"))
   ```

The site also runs a scheduled daily rebuild (see the site repo), which expires "Just arrived" badges and the 30-day "Recently sold" window without anyone editing.

## Content model

- **vehicle** — one document per car. Publish is blocked until the all-in price, a 17-character VIN, at least one photo (with alt text), and a full set of OMVIC disclosures are present. Sold handling is via the **Mark as sold** / **Mark as available** document actions.
- **siteSettings** — singleton (address, phone, review rating, announcement banner).
- **review** — individual real customer quotes, used with permission.
