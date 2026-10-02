"use client";

import { copy } from "@/lib/copy";

import { useEffect, useRef, useState } from "react";
import { escapeMapText, loadLongdoMap, normalizeLongdoStyle, subscribeMapReady, type LongdoMapInstance, type LongdoMarker, type LongdoNamespace, type LongdoStyle } from "./longdo-map-adapter";

export type MapPoint = { id: string; name: string; code: string; latitude: number; longitude: number; detail?: string; status?: string; weight?: number };
type Props = { apiKey: string; points: MapPoint[]; selectedId?: string | null; heatmap?: boolean; onSelect?: (id: string) => void;
  onPick?: (latitude: number, longitude: number) => void; className?: string };
type Cluster = { latitude: number; longitude: number; points: MapPoint[] };

function removeHeatmap(map: LongdoMapInstance) {
  const renderer = map.Renderer;
  if (!renderer?.isStyleLoaded()) return;
  if (renderer.getLayer("building-expense-heat")) renderer.removeLayer("building-expense-heat");
  if (renderer.getSource("building-expense-heat-source")) renderer.removeSource("building-expense-heat-source");
}

function buildClusters(points: MapPoint[], zoom: number): Cluster[] {
  const precision = zoom < 7 ? 2 : zoom < 9 ? 6 : zoom < 11 ? 15 : zoom < 13 ? 45 : zoom < 15 ? 150 : zoom < 17 ? 800 : 5_000;
  const clusters = new Map<string, Cluster>();
  for (const point of points) {
    const key = `${Math.round(point.latitude * precision)}:${Math.round(point.longitude * precision)}`;
    const current = clusters.get(key);
    if (current) current.points.push(point);
    else clusters.set(key, { latitude: point.latitude, longitude: point.longitude, points: [point] });
  }
  return [...clusters.values()];
}

function features(points: MapPoint[]) {
  return { type: "FeatureCollection", features: points.map((point) => ({ type: "Feature", geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
    properties: { weight: Math.max(0.1, Math.min(point.weight ?? 1, 100)) } })) };
}

export function LongdoMapCanvas({ apiKey, points, selectedId, heatmap = false, onSelect, onPick, className = "" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LongdoMapInstance | null>(null);
  const namespaceRef = useRef<LongdoNamespace | null>(null);
  const markersRef = useRef<LongdoMarker[]>([]);
  const callbackRef = useRef({ onSelect, onPick });
  const [state, setState] = useState<"loading" | "ready" | "missing-key" | "error">(apiKey ? "loading" : "missing-key");
  const [retry, setRetry] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomRevision, setZoomRevision] = useState(0);
  const [clusterIds, setClusterIds] = useState<string[]>([]);
  const clusterCandidates = points.filter((point) => clusterIds.includes(point.id));

  useEffect(() => { callbackRef.current = { onSelect, onPick }; }, [onPick, onSelect]);

  useEffect(() => {
    if (!apiKey || !hostRef.current) { setState("missing-key"); return; }
    let disposed = false;
    let ready = false;
    let unsubscribeReady: (() => void) | undefined;
    let map: LongdoMapInstance | null = null;
    let zoomTimer: number | undefined;
    const onRendererReady = () => {
      if (disposed || !map) return;
      ready = true;
      mapRef.current = map;
      setState("ready");
    };
    const onMapClick = () => {
      if (!callbackRef.current.onPick || !map || !namespaceRef.current?.LocationMode?.Pointer) return;
      const location = map.location(namespaceRef.current.LocationMode.Pointer) as { lat?: unknown; lon?: unknown } | null;
      if (typeof location?.lat === "number" && typeof location.lon === "number") callbackRef.current.onPick?.(location.lat, location.lon);
    };
    const onOverlayClick = (event: unknown) => {
      if (!callbackRef.current.onSelect || !event || typeof event !== "object") return;
      const data = event as LongdoMarker & { overlay?: LongdoMarker; data?: LongdoMarker };
      const marker = data.overlay ?? data.data ?? data;
      if (marker.buildingIds && marker.clusterLocation && map) {
        setClusterIds(marker.buildingIds);
        map.location(marker.clusterLocation);
        map.zoom(Math.min(19, map.zoom() + 2));
      } else if (marker.buildingId) {
        setClusterIds([]);
        callbackRef.current.onSelect(marker.buildingId);
      }
    };
    const onZoom = () => {
      if (zoomTimer !== undefined) window.clearTimeout(zoomTimer);
      zoomTimer = window.setTimeout(() => setZoomRevision((value) => value + 1), 150);
    };
    const onCurrentLocation = (event: Event) => {
      const detail = (event as CustomEvent<{ lat?: unknown; lon?: unknown }>).detail;
      if (!ready || !map || typeof detail?.lat !== "number" || typeof detail.lon !== "number") return;
      map.location({ lat: detail.lat, lon: detail.lon });
      map.zoom(15);
      const marker = namespaceRef.current?.Marker && new namespaceRef.current.Marker({ lat: detail.lat, lon: detail.lon }, { title: "ตำแหน่งปัจจุบัน", detail: "ตำแหน่งนี้ใช้เฉพาะการดูแผนที่ในครั้งนี้" });
      if (!marker) return;
      map.Overlays.add(marker);
      markersRef.current.push(marker);
    };
    void loadLongdoMap(apiKey).then((longdo) => {
      if (disposed || !hostRef.current) return;
      namespaceRef.current = longdo;
      const layer = new longdo.Layer(longdo.Layers.NORMAL.style, { contour: true, hillshade: true,
        transformStyle: (_previous: LongdoStyle | undefined, next: LongdoStyle) => normalizeLongdoStyle(next) });
      map = new longdo.Map({ placeholder: hostRef.current, zoom: 6, location: { lat: 13.7563, lon: 100.5018 }, lastView: false, language: "th", layer });
      unsubscribeReady = subscribeMapReady(map, longdo.EventName?.Ready ?? "ready", onRendererReady);
      map.Event.bind("click", onMapClick);
      map.Event.bind("overlayClick", onOverlayClick);
      map.Event.bind("zoom", onZoom);
      window.addEventListener("building-map-current-location", onCurrentLocation);
    }).catch(() => { if (!disposed) setState("error"); });
    return () => {
      disposed = true;
      if (map) {
        unsubscribeReady?.();
        map.Event.unbind("click", onMapClick);
        map.Event.unbind("overlayClick", onOverlayClick);
        map.Event.unbind("zoom", onZoom);
        window.removeEventListener("building-map-current-location", onCurrentLocation);
        if (ready) {
          for (const marker of markersRef.current) map.Overlays.remove(marker);
          removeHeatmap(map);
        }
        if (map.destroy) map.destroy();
        else map.Renderer?.remove();
      }
      if (zoomTimer !== undefined) window.clearTimeout(zoomTimer);
      markersRef.current = [];
      mapRef.current = null;
      namespaceRef.current = null;
    };
  }, [apiKey, retry]);

  useEffect(() => {
    const host = hostRef.current;
    if (state !== "ready" || !host || !mapRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => mapRef.current?.resize?.());
    observer.observe(host);
    return () => observer.disconnect();
  }, [state]);

  useEffect(() => {
    const map = mapRef.current, longdo = namespaceRef.current;
    if (state !== "ready" || !map || !longdo) return;
    for (const marker of markersRef.current) map.Overlays.remove(marker);
    markersRef.current = [];
    removeHeatmap(map);
    if (heatmap && points.length > 1 && map.Renderer?.isStyleLoaded()) {
      map.Renderer.addSource("building-expense-heat-source", { type: "geojson", data: features(points) });
      map.Renderer.addLayer({ id: "building-expense-heat", type: "heatmap", source: "building-expense-heat-source",
        paint: { "heatmap-weight": ["get", "weight"], "heatmap-intensity": 1.1, "heatmap-radius": 30, "heatmap-opacity": 0.72 } });
    }
    if (heatmap) return;
    const clusters = buildClusters(points, map.zoom());
    for (const cluster of clusters) {
      const selected = cluster.points.find((item) => item.id === selectedId);
      const first = selected ?? cluster.points[0];
      const grouped = cluster.points.length > 1;
      const status = first.status === "Permission Confirmed" ? "confirmed" : first.status === "MOU" ? "mou" : first.status === "อาคารปิดถาวร" ? "closed" : "pending";
      const buildingIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 21V3h14v18M3 21h18M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3"/></svg>';
      const label = grouped ? `${cluster.points.length} อาคาร คลิกเพื่อขยายและเลือก` : `${first.name} · ${first.status ?? ""}`;
      const marker = new longdo.Marker({ lat: cluster.latitude, lon: cluster.longitude }, {
        icon: { html: `<button type="button" aria-label="${escapeMapText(label)}" title="${escapeMapText(label)}" class="building-map-marker ${grouped ? "building-map-marker-cluster" : `building-map-marker-${status}`}${selected ? " building-map-marker-selected" : ""}">${grouped ? cluster.points.length : buildingIcon}</button>`, size: { width: 44, height: 44 }, offset: { x: 22, y: 22 } } });
      if (grouped) { marker.buildingIds = cluster.points.map((point) => point.id); marker.clusterLocation = { lat: cluster.latitude, lon: cluster.longitude }; }
      else marker.buildingId = first.id;
      map.Overlays.add(marker);
      markersRef.current.push(marker);
    }
  }, [heatmap, points, selectedId, state, zoomRevision]);

  useEffect(() => {
    if (state !== "ready" || !selectedId || !mapRef.current) return;
    const point = points.find((item) => item.id === selectedId);
    if (!point) return;
    mapRef.current.location({ lat: point.latitude, lon: point.longitude });
    mapRef.current.zoom(Math.max(mapRef.current.zoom(), 15));
  }, [points, selectedId, state]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    const container = hostRef.current?.parentElement;
    if (!container) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.requestFullscreen) await container.requestFullscreen();
    } catch { setState("error"); }
  }

  return <div className={`building-longdo-map ${className}`}>
    <div ref={hostRef} className="building-longdo-map-canvas" role="region" aria-label="แผนที่อาคาร Longdo" />
    {state === "ready" && <button type="button" className="building-longdo-fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? "ออกจากเต็มหน้าจอ" : "แสดงแผนที่เต็มหน้าจอ"}>{fullscreen ? "ย่อแผนที่" : "เต็มหน้าจอ"}</button>}
    {clusterCandidates.length > 1 && !heatmap && <section className="building-map-cluster-picker" aria-label="เลือกอาคารในกลุ่ม">
      <header><strong>เลือกอาคาร ({clusterCandidates.length})</strong><button type="button" aria-label="ปิดรายชื่อกลุ่มอาคาร" onClick={() => setClusterIds([])}>×</button></header>
      <ul>{clusterCandidates.map((point) => <li key={point.id}><button type="button" onClick={() => { setClusterIds([]); callbackRef.current.onSelect?.(point.id); }}><strong>{point.name}</strong><span>{[point.code, point.status].filter(Boolean).join(" · ")}</span></button></li>)}</ul>
    </section>}
    {state !== "ready" && <div className="building-longdo-map-state" role="status">
      {state === "loading" ? "กำลังโหลดแผนที่…" : state === "missing-key" ? <><strong>{copy.feedback.mapUnavailable}</strong><span>{copy.feedback.mapFallback}</span></> : <><strong>โหลดแผนที่ Longdo ไม่สำเร็จ</strong><span>{copy.feedback.mapRetry}</span><button type="button" onClick={() => { setState("loading"); setRetry((value) => value + 1); }}>ลองอีกครั้ง</button></>}
    </div>}
    {heatmap && points.length < 2 && <div className="building-longdo-map-hint" role="status">ต้องมีอาคารที่ระบุตำแหน่งอย่างน้อย 2 แห่ง จึงแสดงความหนาแน่นได้</div>}
  </div>;
}
