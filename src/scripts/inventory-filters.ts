/** Inventory: client-side filtering over server-rendered cards, sorting,
 * mobile filter sheet and active-filter chips (spec §4.2). No reloads. */

interface ItemData {
  element: HTMLElement;
  make: string;
  body: string;
  year: number;
  price: number;
  mileage: number;
  posted: string;
  pending: boolean;
}

const SORTS: Record<string, (a: ItemData, b: ItemData) => number> = {
  newest: byStatus((a, b) => b.posted.localeCompare(a.posted)),
  "price-asc": byStatus((a, b) => a.price - b.price),
  "price-desc": byStatus((a, b) => b.price - a.price),
  mileage: byStatus((a, b) => a.mileage - b.mileage),
};

/** Available vehicles always sort ahead of pending (spec §4.2). */
function byStatus(compare: (a: ItemData, b: ItemData) => number) {
  return (a: ItemData, b: ItemData) => {
    const weight = Number(a.pending) - Number(b.pending);
    return weight !== 0 ? weight : compare(a, b);
  };
}

function inPriceBand(price: number, band: string): boolean {
  if (band === "under-15") return price < 15_000;
  if (band === "15-25") return price >= 15_000 && price < 25_000;
  if (band === "over-25") return price >= 25_000;
  return true;
}

function prefillSelect(select: HTMLSelectElement | null | undefined, value: string | null): void {
  if (!select || !value) return;
  const option = [...select.options].find(
    (candidate) => candidate.value.toLowerCase() === value.toLowerCase(),
  );
  if (option) select.value = option.value;
}

function initInventory(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>("[data-filters-form]");
  const sortSelect = root.querySelector<HTMLSelectElement>("[data-sort]");
  const gridElement = root.querySelector<HTMLElement>("[data-grid]");
  const count = root.querySelector<HTMLElement>("[data-count]");
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  const chips = root.querySelector<HTMLElement>("[data-chips]");
  const sheetToggle = root.querySelector<HTMLButtonElement>("[data-filters-toggle]");
  if (!form || !sortSelect || !gridElement) return;
  const grid = gridElement;

  const items: ItemData[] = [...grid.querySelectorAll<HTMLElement>("[data-item]")].map(
    (element) => ({
      element,
      make: element.dataset.make ?? "",
      body: element.dataset.body ?? "",
      year: Number(element.dataset.year ?? 0),
      price: Number(element.dataset.price ?? 0),
      mileage: Number(element.dataset.mileage ?? 0),
      posted: element.dataset.posted ?? "",
      pending: element.dataset.status === "pending",
    }),
  );

  const controls = ["make", "price", "year", "body"].map((name) =>
    form.querySelector<HTMLSelectElement>(`select[name="${name}"]`),
  );

  // ?make= / ?body= prefilter (used by "See similar vehicles"), read once on load.
  const params = new URLSearchParams(window.location.search);
  prefillSelect(controls[0], params.get("make"));
  prefillSelect(controls[3], params.get("body"));

  function apply(): void {
    const values = controls.map((select) => select?.value ?? "");
    const sort = sortSelect?.value ?? "newest";

    const visible = items.filter((item, i) => {
      const [make, price, year, body] = values;
      const match =
        (!make || item.make === make) &&
        (!year || String(item.year) === year) &&
        (!body || item.body === body) &&
        inPriceBand(item.price, price);
      item.element.hidden = !match;
      return match;
    });

    const comparator = SORTS[sort] ?? SORTS.newest;
    visible
      .slice()
      .sort((a, b) => comparator(a, b))
      .forEach((item) => grid.append(item.element));

    if (count) count.textContent = `${visible.length} vehicles available`;
    if (empty) empty.hidden = visible.length > 0;
    renderChips();
  }

  function renderChips(): void {
    if (!chips) return;
    chips.textContent = "";
    const labels: string[] = [];
    for (const select of controls) {
      if (!select || !select.value) continue;
      const option = select.selectedOptions[0];
      if (!option) continue;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className =
        "inline-flex min-h-9 items-center gap-2 border border-charcoal px-3 text-[15px]";
      chip.append(document.createTextNode(option.text));
      const remove = document.createElement("span");
      remove.setAttribute("aria-hidden", "true");
      remove.textContent = "×";
      chip.append(remove);
      chip.addEventListener("click", () => {
        select.value = "";
        apply();
      });
      chips.append(chip);
      labels.push(option.text);
    }
    chips.hidden = labels.length === 0;
  }

  form.addEventListener("change", apply);
  sortSelect.addEventListener("change", apply);

  const setSheet = (open: boolean) => {
    form.dataset.open = String(open);
    sheetToggle?.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (open) form.querySelector<HTMLElement>("select, button")?.focus();
  };
  sheetToggle?.addEventListener("click", () => setSheet(form.dataset.open !== "true"));
  form.querySelector("[data-filters-apply]")?.addEventListener("click", () => setSheet(false));
  form.querySelector("[data-filters-close]")?.addEventListener("click", () => setSheet(false));
  for (const button of document.querySelectorAll("[data-filters-clear]")) {
    button.addEventListener("click", () => {
      form.reset();
      apply();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && form.dataset.open === "true") setSheet(false);
  });

  apply();
}

const root = document.querySelector<HTMLElement>("[data-inventory]");
if (root) initInventory(root);
