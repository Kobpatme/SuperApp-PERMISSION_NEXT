import { describe, expect, it, vi } from "vitest";
import { normalizeLongdoStyle, subscribeMapReady, type LongdoMapInstance } from "./longdo-map-adapter";

function fixture(styleLoaded: boolean) {
  const events = new Map<string, (event: unknown) => void>();
  const rendererEvents = new Map<string, () => void>();
  const map = {
    Event: {
      bind: (name: string, listener: (event: unknown) => void) => { events.set(name, listener); },
      unbind: (name: string) => { events.delete(name); },
    },
    Renderer: {
      isStyleLoaded: () => styleLoaded,
      once: (name: string, listener: () => void) => { rendererEvents.set(name, listener); },
      off: (name: string) => { rendererEvents.delete(name); },
    },
  } as unknown as LongdoMapInstance;
  return { map, events, rendererEvents };
}

describe("Longdo initialization lifecycle", () => {
  it("makes optional tunnel style conditions null-safe without changing road appearance or the source style", () => {
    const original = { version: 8, layers: [{ id: "road", paint: { "line-opacity": ["case", ["get", "tunnel"], 0.5, 1], "line-width": 2 } }] };
    const normalized = normalizeLongdoStyle(original);
    expect(normalized.layers?.[0].paint?.["line-opacity"]).toEqual(["case", ["boolean", ["get", "tunnel"], false], 0.5, 1]);
    expect(normalized.layers?.[0].paint?.["line-width"]).toBe(2);
    expect(original.layers[0].paint["line-opacity"]).toEqual(["case", ["get", "tunnel"], 0.5, 1]);
    expect(normalizeLongdoStyle(normalized)).toEqual(normalized);
  });
  it("does not permit renderer access before the SDK ready event", () => {
    const { map, events } = fixture(true);
    const ready = vi.fn();
    const dispose = subscribeMapReady(map, "ready", ready);
    expect(ready).not.toHaveBeenCalled();
    events.get("ready")?.({});
    expect(ready).toHaveBeenCalledOnce();
    dispose();
  });

  it("waits for the renderer load event while the style is loading", () => {
    const { map, events, rendererEvents } = fixture(false);
    const ready = vi.fn();
    const dispose = subscribeMapReady(map, "ready", ready);
    events.get("ready")?.({});
    expect(ready).not.toHaveBeenCalled();
    rendererEvents.get("load")?.();
    expect(ready).toHaveBeenCalledOnce();
    dispose();
  });

  it("ignores queued readiness after cleanup and detaches listeners", () => {
    const { map, events, rendererEvents } = fixture(false);
    const ready = vi.fn();
    const dispose = subscribeMapReady(map, "ready", ready);
    events.get("ready")?.({});
    const queued = rendererEvents.get("load");
    dispose();
    queued?.();
    expect(ready).not.toHaveBeenCalled();
    expect(events.size).toBe(0);
    expect(rendererEvents.size).toBe(0);
  });
});
