/**
 * Hero video: poster-only under prefers-reduced-motion, Save-Data or 2g/3g
 * (spec §4.1); otherwise plays muted and offers a pause control.
 */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

function slowConnection(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || /^(slow-)?2g$/.test(connection.effectiveType ?? "");
}

function usePosterOnly(video: HTMLVideoElement | null, toggle: HTMLElement | null): void {
  video?.remove();
  toggle?.remove();
}

const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
const toggle = document.querySelector<HTMLElement>("[data-hero-toggle]");

if (!video) {
  toggle?.remove();
} else {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches || slowConnection()) {
    usePosterOnly(video, toggle);
  } else {
    video.play().catch(() => usePosterOnly(video, toggle));
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) usePosterOnly(video, toggle);
    });
    toggle?.addEventListener("click", () => {
      const iconPause = toggle.querySelector<HTMLElement>("[data-icon-pause]");
      const iconPlay = toggle.querySelector<HTMLElement>("[data-icon-play]");
      const label = toggle.querySelector<HTMLElement>("[data-toggle-label]");
      // SVGElement has no `hidden` IDL attribute — toggle Tailwind's class.
      const wasPlaying = !video.paused;
      iconPause?.classList.toggle("hidden", wasPlaying);
      iconPlay?.classList.toggle("hidden", !wasPlaying);
      if (label) label.textContent = wasPlaying ? "Play video" : "Pause video";
      if (wasPlaying) {
        video.pause();
      } else {
        video.play();
      }
    });
  }
}
