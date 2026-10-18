# Serene Quality Motors (SQM) — website

Marketing and inventory site for SQM, a small OMVIC-registered used-car dealer
at 4650 Kingston Rd, Scarborough, ON. Every vehicle carries an all-in price
(nothing hidden beyond HST and licensing) and full disclosures, per OMVIC
advertising rules.

## Stack

- [Astro 5](https://astro.build) (static output, TypeScript strict)
- [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite`
- Self-hosted [Space Grotesk](https://fontsource.org/fonts/space-grotesk) (no Google Fonts)
- Inventory: sample fixture or Sanity CDN (plain `fetch`, no SDK)
- Forms: [Web3Forms](https://web3forms.com) (no backend)
- Reviews: `/api/reviews` Cloudflare Pages Function (Google Places API (New), edge-cached)
- Hosting: Cloudflare Pages (git integration; `functions/` deployed automatically)

## Quickstart

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static build to dist/
npm run preview    # serve dist/
npx tsc --noEmit   # type-check
```

## Environment variables

| Variable | Where it lives | What it does |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | Build env (Cloudflare Pages) | Canonical/OG/sitemap base URL. Defaults to `https://sqm-site.pages.dev`. |
| `PUBLIC_WEB3FORMS_KEY` | Build env | Web3Forms access key. Without it, forms show an inline "not connected" error on submit. |
| `SANITY_PROJECT_ID` | Build env | When set, inventory is fetched from the Sanity CDN instead of the sample fixture. |
| `SANITY_DATASET` | Build env | Sanity dataset. Defaults to `production`. |
| `GOOGLE_PLACES_API_KEY` | Build env + Pages secret (Functions) | Google Places API (New) key for `/api/reviews`. Restricted key recommended. Set together with `GOOGLE_PLACE_ID` to switch the home reviews section to live Google data. |
| `GOOGLE_PLACE_ID` | Build env + Pages secret (Functions) | Place ID of the Google Business Profile. |
| `REVIEWS_CACHE_TTL_SECONDS` | Pages env (Functions) | Edge-cache TTL for reviews. Defaults to 21600 (6 h). |
| `CF_PAGES_DEPLOY_HOOK` | GitHub **secret** | Deploy-hook URL used by the nightly rebuild workflow. |

Local dev copies `.env.example` to `.env` for the build-time variables. When
either Google variable is absent, home reviews render server-side from the
reviews fixture. Set both at build time to switch to live Google reviews; that
branch uses the deployed `/api/reviews` Pages Function (`astro preview` does
not run Functions).

## Where content lives

- **Inventory** comes from Sanity once `SANITY_PROJECT_ID` is set at build time.
  Until then `src/data/vehicles.fixture.json` serves four clearly-marked
  sample vehicles (dates are generated relative to the build day so badges and
  the Recently-sold window stay exercisable).
- **Sanity Studio** lives in [`studio/`](studio/) — see `studio/README.md` and
  `studio/STAFF-GUIDE.md` for the editor workflow (add a car, reorder photos,
  set a price as reduced, mark sold).
- **Owner-tunable copy** (hero headline, "Drive home" step) sits in
  `src/pages/index.astro` behind `[CONFIRM]` comments.

## Deploy (Cloudflare Pages)

1. Connect the GitHub repo to Cloudflare Pages: build command `npm run build`,
   output `dist/`. Add the build environment variables above.
2. `functions/` deploys automatically with the site (the `/api/reviews`
   Function); set its env/secret values in the Pages project.
3. Sanity publish webhook → a Pages **Deploy hook** so inventory edits go live
   within minutes.
4. **Nightly rebuild:** `.github/workflows/daily-rebuild.yml` POSTs to the same
   deploy hook at 08:00 UTC (~3–4am Toronto) so sold vehicles drop off
   Recently sold after 30 days and "Just arrived" badges expire without anyone
   editing. Store the hook URL as the GitHub secret `CF_PAGES_DEPLOY_HOOK`
   (repo → Settings → Secrets and variables → Actions).

## Staff listing kit

`/admin/listing-kit/<slug>` renders paste-ready ad text (price, specs,
disclosures, photo URLs) for AutoTrader/Kijiji/Marketplace. It is noindex and
not linked from anywhere. **Put `/admin/*` behind Cloudflare Access before
launch** (Cloudflare Zero Trust → Access → self-hosted app on your domain,
path `/admin/`).

## Photo import

One folder per vehicle, named by stock number or VIN, files ordered by name;
`interior` in a filename marks interior shots. See the seed/import scripts and
conventions in `studio/` (`studio/README.md`).

## Removing sample data

The four sample vehicles come from `src/data/vehicles.fixture.json` and are
used **only** while `SANITY_PROJECT_ID` is unset. Set the variable (or delete
the fixture and its fallback in `src/lib/data.ts`) to go live with real
inventory.

## Deferred by owner decision

- AutoTrader/Kijiji feed generation (`/feeds/*.csv|xml`) — deferred; staff use
  the listing kit manually for now.

## Owner [CONFIRM] checklist

- [ ] Phone number and text-capable number (`src/data/site.ts`)
- [ ] Email address and opening hours
- [ ] Registered legal business name
- [ ] Final domain + DNS (set `PUBLIC_SITE_URL`, redirect apex/www)
- [ ] Web3Forms access key
- [ ] Sanity project ID (+ dataset) and invited editor accounts
- [ ] Google Business Profile link, review rating/count, Place ID
- [ ] Google Places API key (restricted) + Place ID for `/api/reviews`
- [ ] About page copy and "Drive home" step copy
- [ ] Legal review of ad wording against current OMVIC guidelines
- [ ] Cloudflare Access on `/admin/`
