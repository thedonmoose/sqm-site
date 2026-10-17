/** Vehicle page: mobile sticky bar visibility (after the price block, hidden
 * while the enquiry form is on screen), enquiry scroll and copy-link. */
function initStickyBar(): void {
  const bar = document.querySelector<HTMLElement>("[data-sticky-bar]");
  const priceBlock = document.querySelector<HTMLElement>("[data-price-block]");
  const form = document.querySelector<HTMLElement>("#vehicle-enquiry");
  if (!bar || !priceBlock) return;

  let ticking = false;
  const update = () => {
    // Bar appears once the price block is fully above the viewport and hides
    // while the enquiry form is on screen (spec §4.4).
    const priceRect = priceBlock.getBoundingClientRect();
    const past = priceRect.bottom < 0;
    const formRect = form?.getBoundingClientRect();
    const formVisible = Boolean(formRect && formRect.top < innerHeight && formRect.bottom > 0);
    bar.hidden = !(past && !formVisible);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  update();

  document.querySelector<HTMLElement>("[data-scroll-enquiry]")?.addEventListener("click", () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    form?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    form?.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true });
  });
}

function initCopyLink(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-copy-link]");
  const confirmation = document.querySelector<HTMLElement>("[data-copy-confirm]");
  if (!button || !confirmation) return;
  let timer: number | undefined;

  button.addEventListener("click", async () => {
    const url = window.location.href;
    const title = document.title;
    let done = false;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        done = true;
      } catch {
        /* user dismissed — fall through to clipboard */
      }
    }
    if (!done) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        return;
      }
    }
    confirmation.hidden = false;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      confirmation.hidden = true;
    }, 2500);
  });
}

initStickyBar();
initCopyLink();
