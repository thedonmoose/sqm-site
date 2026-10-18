/** Home page reviews content, rendered server-side by ReviewsSection.
 * When GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID are both set at build time,
 * the section renders the live Places payload from /api/reviews instead
 * (see Environment variables in README.md). */
import type { Review } from "../lib/types";

export interface ReviewSummary {
  rating: number;
  count: number;
}

export type ListedReview = Review & { relativeTime: string };

export const reviewSummary: ReviewSummary = { rating: 5.0, count: 12 };

export const reviews: ListedReview[] = [
  {
    quote:
      "The price they advertise is the price you pay. No hidden fees, no last-minute add-ons — they walked me through every line of the invoice before I signed.",
    reviewerName: "Maya",
    city: "Scarborough",
    rating: 5,
    relativeTime: "2 weeks ago",
  },
  {
    quote:
      "Called in the morning, saw the car that afternoon, and the paperwork was done in half an hour. Straightforward from start to finish.",
    reviewerName: "Daniel",
    city: "Pickering",
    rating: 5,
    relativeTime: "1 month ago",
  },
  {
    quote:
      "They showed me the full disclosure report before I even asked. Easiest vehicle purchase I’ve had, and the car is exactly as described.",
    reviewerName: "Priya",
    city: "Ajax",
    rating: 5,
    relativeTime: "3 weeks ago",
  },
];
