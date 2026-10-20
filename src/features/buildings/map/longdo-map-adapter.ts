export type LongdoLocation = { lat: number; lon: number };
export type LongdoStyle = { layers?: Array<{ paint?: Record<string, unknown>; [key: string]: unknown }>; [key: string]: unknown };

// Longdo's road opacity expressions read optional tunnel attributes as booleans.
// Missing attributes must fall back to false before MapLibre evaluates the style.
export function normalizeLongdoStyle(style: LongdoStyle): LongdoStyle {
  return { ...style, layers: style.layers?.map((layer) => ({ ...layer,
    ...(layer.paint ? { paint: Object.fromEntries(Object.entries(layer.paint).map(([key, value]) => {
      if (Array.isArray(value) && value[0] === "case" && Array.isArray(value[1]) && value[1].length === 2 && value[1][0] === "get" && value[1][1] === "tunnel") {
        return [key, ["case", ["boolean", ["get", "tunnel"], false], ...value.slice(2)]];
      }
      return [key, value];
    })) } : {}),
  })) };
}
export type LongdoMarker = { buildingId?: string; buildingIds?: string[]; clusterLocation?: LongdoLocation; location?: LongdoLocation };
export type LongdoMapInstance = {
  location(value?: LongdoLocation | unknown): LongdoLocation;
  zoom(value?: number): number;
  Overlays: { add(overlay: unknown): void; remove(overlay: unknown): void; clear(): void };
  Event: { bind(name: string, listener: (event: unknown) => void): void; unbind(name: string, listener: (event: unknown) => void): void };
  Renderer?: { addSource(id: string, source: unknown): void; addLayer(layer: unknown): void; removeLayer(id: string): void; removeSource(id: string): void; getLayer(id: string): unknown; getSource(id: string): unknown; isStyleLoaded(): boolean; once(name: string, listener: () => void): void; off(name: string, listener: () => void): void; remove(): void };
  resize?(): void;
  destroy?(): void;
};
export type LongdoNamespace = {
  Map: new (options: Record<string, unknown>) => LongdoMapInstance;
  Layer: new (style: unknown, options: Record<string, unknown>) => unknown;
  Layers: { NORMAL: { style: unknown } };
  Marker: new (location: LongdoLocation, options: Record<string, unknown>) => LongdoMarker;
  LocationMode?: { Pointer: unknown };
  EventName?: { Ready: string; LayerChange: string };
};

declare global { interface Window { longdo?: LongdoNamespace } }

let sdkLoad: Promise<LongdoNamespace> | null = null;

export function subscribeMapReady(map: LongdoMapInstance, eventName: string, onReady: () => void) {
  let cancelled = false;
  const notify = () => { if (!cancelled) onReady(); };
  const initialize = () => {
    if (cancelled) return;
    if (map.Renderer && !map.Renderer.isStyleLoaded()) map.Renderer.once("load", notify);
    else notify();
  };
  map.Event.bind(eventName, initialize);
  return () => {
    cancelled = true;
    map.Event.unbind(eventName, initialize);
    map.Renderer?.off("load", notify);
  };
}

export function loadLongdoMap(apiKey: string): Promise<LongdoNamespace> {
  if (!apiKey) return Promise.reject(new Error("Longdo Map API key is not configured"));
  if (window.longdo) return Promise.resolve(window.longdo);
  if (sdkLoad) return sdkLoad;
  sdkLoad = new Promise<LongdoNamespace>((resolve, reject) => {
    const selector = 'script[data-longdo-map-api="3"]';
    const existing = document.querySelector<HTMLScriptElement>(selector);
    const script = existing ?? document.createElement("script");
    const loaded = () => window.longdo ? resolve(window.longdo) : reject(new Error("Longdo Map API did not initialize"));
    const failed = () => reject(new Error("Longdo Map API could not be loaded"));
    if (existing) {
      if (window.longdo) loaded();
      else { script.addEventListener("load", loaded, { once: true }); script.addEventListener("error", failed, { once: true }); }
      return;
    }
    script.dataset.longdoMapApi = "3";
    script.src = `https://api.longdo.com/map3/?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => { sdkLoad = null; throw error; });
  return sdkLoad;
}

export function escapeMapText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
