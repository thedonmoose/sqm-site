/** Full-screen overlays: make everything except `overlay` inert while open, so
 * Tab and screen readers can't reach the hidden page behind it. */
export function setInertOutside(overlay: HTMLElement, inert: boolean): void {
  for (let node: HTMLElement | null = overlay; node && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling !== node && sibling instanceof HTMLElement) sibling.inert = inert;
    }
  }
}
