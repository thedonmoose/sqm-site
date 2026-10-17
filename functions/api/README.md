# Google reviews API setup

The `/api/reviews` Pages Function calls Places API (New) at request time and briefly edge-caches successful responses. Review text is not included in the static build or stored in the repository. If configuration or the Google API call fails, the function returns `{ "hidden": true }` so the site can hide the section.

## Google Cloud setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/). Use the project selector at the top of the page, choose **New Project**, enter a project name, and click **Create**.
2. Enable billing for the project: open **Billing**, link an active billing account, and confirm the project is linked. Google requires billing to be enabled for Places API requests.
3. Open **APIs & Services → Library**, search for **Places API (New)**, open it, and click **Enable**.
4. Open **APIs & Services → Credentials → Create credentials → API key**.
5. Open the new key's settings. Under **API restrictions**, choose **Restrict key** and allow **Places API (New)** only, then save. This endpoint calls Google from a Cloudflare Worker, so use the API restriction; do not configure a browser HTTP-referrer restriction.
6. Copy the key into Cloudflare as a secret (steps below). Do not put it in frontend code, a committed file, or a public build variable.

### Billing allowance

Google's current pricing lists **10,000 free monthly requests** for the Place Details Essentials SKU. That allowance does **not** apply to this endpoint's field mask: requesting `reviews` is billed at the higher **Place Details Enterprise + Atmosphere** SKU, whose current free usage cap is **1,000 requests per month**. The first pricing tier after that cap is currently $25 per 1,000 requests (USD). Google pricing can change; check the [current pricing table](https://developers.google.com/maps/billing-and-pricing/pricing#places-api-new) before launch. The Function's default one-hour edge cache reduces repeat Google calls for the same request URL.

## Find the Place ID

1. Open Google's [Place ID Finder](https://geo-devrel-javascript-samples.web.app/samples/places-placeid-finder/app/dist/).
2. Search for **Serene Quality Motors** at **4650 Kingston Rd, Scarborough, ON**.
3. Select the matching business and copy its Place ID. Confirm the name and address match before using it; do not substitute a different nearby listing.

Google recommends refreshing a stored Place ID if it is more than 12 months old. See [Google's Place ID documentation](https://developers.google.com/maps/documentation/places/web-service/place-id).

## Cloudflare Pages variables

In the Cloudflare dashboard, open **Workers & Pages → your Pages project → Settings → Variables and Secrets**. Add the bindings for the production environment (and Preview too if the reviews section should work on preview deployments):

| Binding | Type | Value |
| --- | --- | --- |
| `GOOGLE_PLACES_API_KEY` | Secret | The restricted API key created above |
| `GOOGLE_PLACE_ID` | Variable | The Place ID Finder result for this business |
| `REVIEWS_CACHE_TTL_SECONDS` | Variable, optional | Cache lifetime in seconds; defaults to `3600` |

Save the settings and redeploy the project for the bindings to take effect.

## Review ordering and field mask

The request uses the documented Places API (New) field names `rating`, `userRatingCount`, `reviews`, and `googleMapsUri` in its `X-Goog-FieldMask`. Google's current Place resource documentation says it returns up to five `reviews` **sorted by relevance**, not by date, and Place Details currently documents no review-sort request parameter. The Function therefore sorts those returned reviews by each review's `publishTime` newest-first, drops reviews without a valid `publishTime`, then takes the first three. This can sort only the small set Google returns; it cannot retrieve older reviews that were excluded from the API response.

The site must retain Google's required attribution when rendering these reviews and link review content to Google using the supplied Google Maps/author URLs. Check the [Place Details documentation](https://developers.google.com/maps/documentation/places/web-service/place-details) and Google's current Maps Platform terms before launch.
