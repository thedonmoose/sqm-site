/** Vehicle gallery: thumbnail selection with +N overflow, arrow keys and
 * touch swipe. No layout shift: the main frame keeps a fixed 4:3 box. */
const MAX_THUMBS = 5;

function initGallery(root: HTMLElement): void {
  const main = root.querySelector<HTMLImageElement>("[data-gallery-main]");
  const counter = root.querySelector<HTMLElement>("[data-gallery-counter]");
  const live = root.querySelector<HTMLElement>("[data-gallery-live]");
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]")];
  if (!main || thumbs.length === 0) return;
  const mainImage = main;

  let index = 0;

  function update(): void {
    const thumb = thumbs[Math.min(index, thumbs.length - 1)] ?? thumbs[0];
    index = thumbs.indexOf(thumb);
    const src = thumb?.dataset.full ?? "";
    const srcset = thumb?.dataset.fullSrcset ?? "";
    const alt = thumb?.dataset.alt ?? "";
    if (mainImage.getAttribute("srcset") !== srcset) mainImage.srcset = srcset;
    if (mainImage.getAttribute("src") !== src) mainImage.src = src;
    mainImage.alt = alt;
    for (const other of thumbs) {
      const activeThumb = other === thumb;
      other.classList.toggle("outline-[3px]", activeThumb);
      other.classList.toggle("-outline-offset-3", activeThumb);
      other.classList.toggle("outline-green", activeThumb);
      other.setAttribute("aria-pressed", String(activeThumb));
    }
    const overflow = Math.max(0, thumbs.length - MAX_THUMBS);
    thumbs.forEach((item, i) => {
      const badge = item.querySelector<HTMLElement>("[data-thumb-more]");
      if (badge) badge.hidden = !(overflow > 0 && i === MAX_THUMBS - 1);
      if (badge && !badge.hidden) badge.textContent = `+${overflow}`;
    });
    if (counter) counter.textContent = `${thumbs.length} photos`;
    if (live) live.textContent = `Photo ${index + 1} of ${thumbs.length}: ${alt}`;
  }

  function show(nextIndex: number): void {
    index = (nextIndex + thumbs.length) % thumbs.length;
    update();
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener("click", () => {
      index = i;
      update();
    });
  });

  const prevButton = root.querySelector<HTMLButtonElement>("[data-gallery-prev]");
  const nextButton = root.querySelector<HTMLButtonElement>("[data-gallery-next]");
  prevButton?.addEventListener("click", () => show(index - 1));
  nextButton?.addEventListener("click", () => show(index + 1));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      show(index - 1);
    } else if (event.key === "ArrowRight") {
      show(index + 1);
    } else {
      return;
    }
    event.preventDefault();
  });

  let touchX: number | null = null;
  root.addEventListener(
    "touchstart",
    (event) => {
      touchX = event.touches[0]?.clientX ?? null;
    },
    { passive: true },
  );
  root.addEventListener(
    "touchend",
    (event) => {
      if (touchX == null) return;
      const delta = (event.changedTouches[0]?.clientX ?? touchX) - touchX;
      if (Math.abs(delta) > 40) show(index + (delta < 0 ? 1 : -1));
      touchX = null;
    },
    { passive: true },
  );

  update();
}

document.querySelectorAll<HTMLElement>("[data-gallery]").forEach(initGallery);
