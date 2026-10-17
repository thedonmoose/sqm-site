/** Vehicle gallery: Exterior/Interior filter, thumbnail selection with +N
 * overflow, arrow keys and touch swipe (spec §4.4). No layout shift: the main
 * frame keeps a fixed 4:3 box. */
const MAX_THUMBS = 5;

function initGallery(root: HTMLElement): void {
  const main = root.querySelector<HTMLImageElement>("[data-gallery-main]");
  const counter = root.querySelector<HTMLElement>("[data-gallery-counter]");
  const live = root.querySelector<HTMLElement>("[data-gallery-live]");
  const catButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-cat]")];
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]")];
  if (!main || thumbs.length === 0) return;
  const mainImage = main;

  let category = main.dataset.category ?? thumbs[0].dataset.category ?? "exterior";
  let index = 0;

  function active(): HTMLButtonElement[] {
    return thumbs.filter((thumb) => thumb.dataset.category === category);
  }

  function update(): void {
    const list = active();
    const thumb = list[Math.min(index, list.length - 1)] ?? list[0];
    index = list.indexOf(thumb);
    const src = thumb?.dataset.full ?? "";
    const alt = thumb?.dataset.alt ?? "";
    if (mainImage.getAttribute("src") !== src) {
      mainImage.src = src;
      mainImage.alt = alt;
    }
    mainImage.dataset.category = category;
    for (const other of thumbs) {
      other.hidden = other.dataset.category !== category;
      const activeThumb = other === thumb;
      other.classList.toggle("outline-[3px]", activeThumb);
      other.classList.toggle("-outline-offset-3", activeThumb);
      other.classList.toggle("outline-green", activeThumb);
      other.setAttribute("aria-pressed", String(activeThumb));
    }
    const overflow = Math.max(0, list.length - MAX_THUMBS);
    list.forEach((item, i) => {
      const badge = item.querySelector<HTMLElement>("[data-thumb-more]");
      if (badge) badge.hidden = !(overflow > 0 && i === MAX_THUMBS - 1);
      if (badge && !badge.hidden) badge.textContent = `+${overflow}`;
    });
    if (counter) counter.textContent = `${list.length} photos`;
    if (live) live.textContent = `Photo ${index + 1} of ${list.length}: ${alt}`;
  }

  function show(nextIndex: number): void {
    const list = active();
    index = (nextIndex + list.length) % list.length;
    update();
  }

  for (const button of catButtons) {
    button.addEventListener("click", () => {
      const next = button.dataset.galleryCat;
      if (!next || next === category) return;
      category = next;
      index = 0;
      for (const other of catButtons) {
        const on = other === button;
        other.setAttribute("aria-pressed", String(on));
        other.classList.toggle("bg-charcoal", on);
        other.classList.toggle("text-alabaster", on);
      }
      update();
    });
  }

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
