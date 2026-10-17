interface ReviewsEnv {
  GOOGLE_PLACES_API_KEY?: string;
  GOOGLE_PLACE_ID?: string;
  REVIEWS_CACHE_TTL_SECONDS?: string;
}

interface LocalizedText {
  text?: string;
}

interface PlacesReview {
  authorAttribution?: {
    displayName?: string;
    uri?: string;
  };
  rating?: number;
  text?: LocalizedText;
  originalText?: LocalizedText;
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

interface PlacesApiResponse {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
}

interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  authorUri?: string;
}

interface ReviewsPayload {
  hidden: false;
  rating: number;
  count: number;
  mapsUri: string;
  reviews: Review[];
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapPlacesResponse(value: unknown): ReviewsPayload | null {
  if (!isRecord(value)) return null;

  const { rating, userRatingCount, googleMapsUri, reviews } = value;
  if (
    typeof rating !== "number" ||
    !Number.isFinite(rating) ||
    typeof userRatingCount !== "number" ||
    !Number.isFinite(userRatingCount) ||
    typeof googleMapsUri !== "string" ||
    !Array.isArray(reviews) ||
    reviews.length === 0
  ) {
    return null;
  }

  const datedReviews: { publishedAt: number; review: Review }[] = [];
  for (const item of reviews) {
    if (!isRecord(item) || typeof item.publishTime !== "string") continue;

    const publishedAt = Date.parse(item.publishTime);
    const authorAttribution = isRecord(item.authorAttribution)
      ? item.authorAttribution
      : null;
    const reviewRating = item.rating;
    const author = authorAttribution?.displayName;
    const text = isRecord(item.text) ? item.text.text : undefined;
    const originalText = isRecord(item.originalText)
      ? item.originalText.text
      : undefined;
    const relativeTime = item.relativePublishTimeDescription;

    if (
      !Number.isFinite(publishedAt) ||
      typeof reviewRating !== "number" ||
      !Number.isFinite(reviewRating) ||
      typeof author !== "string"
    ) {
      continue;
    }

    const review: Review = {
      author,
      rating: reviewRating,
      text:
        typeof text === "string"
          ? text
          : typeof originalText === "string"
            ? originalText
            : "",
      relativeTime: typeof relativeTime === "string" ? relativeTime : "",
    };
    if (typeof authorAttribution?.uri === "string") {
      review.authorUri = authorAttribution.uri;
    }
    datedReviews.push({ publishedAt, review });
  }

  const mappedReviews = datedReviews
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 3)
    .map(({ review }) => review);

  if (mappedReviews.length === 0) return null;

  return {
    hidden: false,
    rating,
    count: userRatingCount,
    mapsUri: googleMapsUri,
    reviews: mappedReviews,
  };
}

function hiddenResponse(): Response {
  return new Response(JSON.stringify({ hidden: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function cacheTtlSeconds(env: ReviewsEnv): number {
  const configured = env.REVIEWS_CACHE_TTL_SECONDS;
  if (configured === undefined || configured.trim() === "") return 21600;

  const ttl = Number(configured);
  return Number.isSafeInteger(ttl) && ttl >= 0 ? ttl : 21600;
}

export async function onRequestGet({
  request,
  env,
  context,
}: {
  request: Request;
  env: ReviewsEnv;
  context: { waitUntil: (p: Promise<unknown>) => void };
}): Promise<Response> {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return hiddenResponse();

  try {
    const cloudflareGlobals = globalThis as typeof globalThis & {
      caches: { default: EdgeCache };
    };
    const cache = cloudflareGlobals.caches.default;
    const key = new Request(new URL("/api/reviews", request.url).toString());
    const cached = await cache.match(key);
    if (cached) return cached;

    const placesResponse = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
        },
      },
    );
    if (!placesResponse.ok) return hiddenResponse();

    const data = (await placesResponse.json()) as PlacesApiResponse;
    const result = mapPlacesResponse(data);
    if (!result) return hiddenResponse();

    const response = new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${cacheTtlSeconds(env)}`,
      },
    });
    context.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch {
    return hiddenResponse();
  }
}
