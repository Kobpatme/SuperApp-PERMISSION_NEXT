let liveRegion: HTMLDivElement | undefined;
let pendingAnnouncement: number | undefined;

function getLiveRegion(): HTMLDivElement | undefined {
  if (typeof document === "undefined") return undefined;
  if (liveRegion?.isConnected) return liveRegion;

  const existing = document.querySelector<HTMLDivElement>("[data-duct-rental-live-region]");
  liveRegion = existing ?? document.createElement("div");
  if (!existing) {
    liveRegion.dataset.ductRentalLiveRegion = "true";
    liveRegion.setAttribute("role", "status");
    liveRegion.style.position = "absolute";
    liveRegion.style.width = "var(--space-1)";
    liveRegion.style.height = "var(--space-1)";
    liveRegion.style.overflow = "hidden";
    liveRegion.style.clipPath = "inset(var(--space-1))";
    liveRegion.style.whiteSpace = "nowrap";
    liveRegion.style.border = "0";
    liveRegion.style.padding = "0";
    liveRegion.style.margin = "calc(var(--space-1) * -1)";
    (document.body ?? document.documentElement).appendChild(liveRegion);
  }
  return liveRegion;
}

/** Announce a message through the singleton live region. */
export function announce(message: string, politeness: "polite" | "assertive" = "polite"): void {
  const region = getLiveRegion();
  if (!region) return;

  region.setAttribute("aria-live", politeness);
  region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
  region.textContent = "";
  if (pendingAnnouncement !== undefined) window.clearTimeout(pendingAnnouncement);
  pendingAnnouncement = window.setTimeout(() => {
    region.textContent = message;
    pendingAnnouncement = undefined;
  }, 0);
}
