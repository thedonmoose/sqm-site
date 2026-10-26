/** Reviews section: fetches /api/reviews at request time; stays hidden on
 * failure or when the payload is marked hidden. No review content in the bundle. */
interface ReviewItem {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  authorUri?: string;
  authorPhotoUri?: string;
}

interface ReviewsPayload {
  hidden?: boolean;
  rating?: number;
  count?: number;
  mapsUri?: string;
  reviews?: ReviewItem[];
}

function starRow(rating: number): HTMLElement {
  const row = document.createElement("span");
  row.className = "flex gap-1";
  row.setAttribute("role", "img");
  row.setAttribute("aria-label", `Rated ${rating} out of 5 stars`);
  for (let i = 0; i < 5; i++) {
    row.insertAdjacentHTML(
      "beforeend",
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.1L12 16.9 6.4 20l1.3-6.1L3 9.6l6.3-.7z"></path></svg>',
    );
  }
  return row;
}

function reviewCard(review: ReviewItem, extraClass: string): HTMLElement {
  const figure = document.createElement("figure");
  figure.className = `flex flex-col gap-5 border border-alabaster/25 p-8 ${extraClass}`;

  figure.append(starRow(review.rating));

  const quote = document.createElement("blockquote");
  quote.className = "text-xl";
  quote.textContent = review.text;
  figure.append(quote);

  const caption = document.createElement("figcaption");
  caption.className = "flex items-center gap-3 text-sm uppercase tracking-[0.08em]";

  const isHttps = (uri?: string): uri is string => Boolean(uri?.startsWith("https://"));

  if (isHttps(review.authorPhotoUri)) {
    const avatar = document.createElement("img");
    avatar.src = review.authorPhotoUri;
    avatar.alt = "";
    avatar.width = 40;
    avatar.height = 40;
    avatar.className = "size-10 shrink-0 rounded-full object-cover";
    caption.append(avatar);
  }

  const text = document.createElement("span");
  if (isHttps(review.authorUri)) {
    const link = document.createElement("a");
    link.href = review.authorUri;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "hover:underline underline-offset-4";
    link.textContent = review.author;
    text.append(link);
  } else {
    text.textContent = review.author;
  }
  if (review.relativeTime) {
    text.append(document.createTextNode(` · ${review.relativeTime}`));
  }
  caption.append(text);
  figure.append(caption);
  return figure;
}

async function init(): Promise<void> {
  const section = document.querySelector<HTMLElement>("[data-reviews]");
  if (!section) return;

  let payload: ReviewsPayload;
  try {
    const response = await fetch("/api/reviews");
    if (!response.ok) return;
    payload = (await response.json()) as ReviewsPayload;
  } catch {
    return;
  }
  if (
    payload.hidden ||
    typeof payload.rating !== "number" ||
    typeof payload.count !== "number" ||
    !payload.mapsUri ||
    !payload.reviews?.length
  ) {
    return;
  }

  const rating = section.querySelector<HTMLElement>("[data-reviews-rating]");
  const count = section.querySelector<HTMLAnchorElement>("[data-reviews-count]");
  const cards = section.querySelector<HTMLElement>("[data-reviews-cards]");
  const read = section.querySelector<HTMLAnchorElement>("[data-reviews-read]");
  if (!rating || !count || !cards || !read) return;

  rating.textContent = `${payload.rating} stars`;
  count.textContent = `${payload.count} reviews on Google Maps`;
  count.href = payload.mapsUri;
  read.href = payload.mapsUri;

  payload.reviews.slice(0, 3).forEach((review, index) => {
    cards.append(reviewCard(review, index === 2 ? "hidden md:flex" : "flex"));
  });

  section.hidden = false;
}

init();
