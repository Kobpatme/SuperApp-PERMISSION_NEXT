"use client";

import { useEffect, useRef, useState } from "react";
import type { PermissionBuildingRow } from "@/lib/permission-building-server";

type Coordinates = [number, number];
type Layer = { addTo(map: LeafletMap): Layer };
type LayerGroup = Layer & { clearLayers(): void; addLayer(marker: Marker): void };
type Marker = { bindPopup(content: HTMLElement, options?: Record<string, unknown>): Marker; on(event: string, handler: () => void): Marker;
  getLatLng(): Coordinates; openPopup(): void };
type LeafletMap = { setView(center: Coordinates, zoom: number): LeafletMap; flyTo(center: Coordinates, zoom: number): void;
  fitBounds(coords: Coordinates[], options?: Record<string, unknown>): void; getZoom(): number; removeLayer(layer: Layer): void;
  invalidateSize(): void; remove(): void };
type LeafletNamespace = { map(element: HTMLElement, options?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, options?: Record<string, unknown>): Layer; layerGroup(): LayerGroup;
  markerClusterGroup?: (options?: Record<string, unknown>) => LayerGroup;
  marker(coords: Coordinates, options?: Record<string, unknown>): Marker;
  divIcon(options: Record<string, unknown>): unknown };
type MapMode = "osm" | "satellite" | "hybrid";
const tileUrls = {
  osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  labels: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
};
const attribution = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  esri: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>',
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "1") { resolve(); return; }
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", reject, { once: true }); return; }
    const script = document.createElement("script");
    script.src = src; script.async = true;
    script.addEventListener("load", () => { script.dataset.loaded = "1"; resolve(); }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });
}

function popupFor(item: PermissionBuildingRow, onOpen: (id: string) => void) {
  const root = document.createElement("div"); root.className = "permission-map-popup";
  const eyebrow = document.createElement("small"); eyebrow.className = "permission-map-popup-eyebrow"; eyebrow.textContent = "ข้อมูลอาคาร";
  const title = document.createElement("strong"); title.textContent = item.nameTh;
  const subtitle = document.createElement("span"); subtitle.className = "permission-map-popup-english"; subtitle.textContent = item.nameEn || "";
  const summary = document.createElement("div"); summary.className = "permission-map-popup-summary";
  const status = document.createElement("span"); status.textContent = item.status || "ไม่ระบุสถานะ";
  status.className = item.status === "Permission Confirmed" ? "status-confirmed" : item.status === "MOU" ? "status-mou" : item.status === "อาคารปิดถาวร" ? "status-closed" : "status-check";
  const place = document.createElement("span"); place.textContent = [item.area, item.province].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่";
  summary.append(status, place);
  const meta = document.createElement("div"); meta.className = "permission-map-popup-meta";
  meta.textContent = [item.type, item.installType].filter(Boolean).join(" · ") || "ไม่ระบุรูปแบบติดตั้ง";
  const button = document.createElement("button"); button.type = "button"; button.textContent = "เปิดรายละเอียดอาคาร →";
  button.addEventListener("click", () => onOpen(item.id));
  root.append(eyebrow, title, subtitle, summary, meta);
  if (item.feeReviewRequired) { const warning = document.createElement("p"); warning.textContent = "ค่าใช้จ่ายรอตรวจสอบข้อมูล"; root.append(warning); }
  root.append(button);
  return root;
}

export function BuildingMap({ buildings, selectedId, onOpenDetails }: { buildings: PermissionBuildingRow[]; selectedId: string | null; onOpenDetails: (id: string) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<LayerGroup | null>(null);
  const tileRef = useRef<Layer | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const callbackRef = useRef(onOpenDetails);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<MapMode>("satellite");

  useEffect(() => { callbackRef.current = onOpenDetails; }, [onOpenDetails]);

  useEffect(() => {
    if (!ready || !elementRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    async function initialize() {
      try {
        await loadScript("/vendor/leaflet/leaflet.js");
        await loadScript("/vendor/leaflet-markercluster/leaflet.markercluster.js");
        if (cancelled || !elementRef.current) return;
        const L = (window as unknown as { L?: LeafletNamespace }).L;
        if (!L) throw new Error("Leaflet unavailable");
        const map = L.map(elementRef.current, { center: [13.15, 101], zoom: 6, maxZoom: 19, zoomControl: true });
        mapRef.current = map;
        groupRef.current = (L.markerClusterGroup ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 46, spiderfyOnMaxZoom: true }) : L.layerGroup()).addTo(map) as LayerGroup;
        setReady(true);
        window.setTimeout(() => map.invalidateSize(), 50);
      } catch (error) { console.error("Building map initialization failed", error); if (!cancelled) setError(true); }
    }
    initialize();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; groupRef.current = null; markers.clear(); };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = (window as unknown as { L?: LeafletNamespace }).L;
    if (!L) return;
    if (tileRef.current) mapRef.current.removeLayer(tileRef.current);
    const options = { maxZoom: 19, updateWhenIdle: true, keepBuffer: 3 };
    if (mode === "osm") tileRef.current = L.tileLayer(tileUrls.osm, { ...options, attribution: attribution.osm });
    else if (mode === "satellite") tileRef.current = L.tileLayer(tileUrls.satellite, { ...options, attribution: attribution.esri });
    else { const layers = L.layerGroup(); L.tileLayer(tileUrls.satellite, { ...options, attribution: attribution.esri }).addTo(layers as unknown as LeafletMap);
      L.tileLayer(tileUrls.labels, { ...options, attribution: attribution.esri }).addTo(layers as unknown as LeafletMap); tileRef.current = layers; }
    tileRef.current.addTo(mapRef.current);
  }, [ready, mode]);

  useEffect(() => {
    if (!ready || !groupRef.current || !mapRef.current) return;
    const L = (window as unknown as { L?: LeafletNamespace }).L;
    if (!L) return;
    groupRef.current.clearLayers(); markersRef.current.clear();
    const coords: Coordinates[] = [];
    const used = new Map<string, number>();
    buildings.forEach((item) => {
      if (item.lat === null || item.lng === null || item.lat < 5 || item.lat > 25) return;
      const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`;
      const count = used.get(key) ?? 0; used.set(key, count + 1);
      const radius = 0.00015 + count * 0.00005;
      const position: Coordinates = count ? [item.lat + radius * Math.cos(count * Math.PI / 4), item.lng + radius * Math.sin(count * Math.PI / 4)] : [item.lat, item.lng];
      const tone = item.status === "Permission Confirmed" ? "confirmed" : item.status === "MOU" ? "mou" : item.status === "อาคารปิดถาวร" ? "closed" : "check";
      const icon = L.divIcon({ className: "permission-map-pin", html: `<span class="permission-map-pin-shape ${tone}"></span>`, iconSize: [28, 36], iconAnchor: [14, 34], popupAnchor: [0, -30] });
      const marker = L.marker(position, { icon }).bindPopup(popupFor(item, (id) => callbackRef.current(id)), { minWidth: 230, maxWidth: 280 });
      marker.on("click", () => { mapRef.current?.flyTo(position, Math.max(mapRef.current.getZoom(), 15)); marker.openPopup(); });
      groupRef.current?.addLayer(marker); markersRef.current.set(item.id, marker); coords.push(position);
    });
    if (coords.length === 1) mapRef.current.flyTo(coords[0], 15);
    else if (coords.length > 1 && coords.length <= 5) mapRef.current.fitBounds(coords, { padding: [60, 60], maxZoom: 14 });
  }, [ready, buildings]);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) mapRef.current.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 15));
  }, [selectedId]);

  function fitVisible() {
    const coords = [...markersRef.current.values()].map((marker) => marker.getLatLng());
    if (coords.length && mapRef.current) mapRef.current.fitBounds(coords, { padding: [35, 35], maxZoom: 16 });
  }

  return <div className="permission-map-shell">
    <div ref={elementRef} className="permission-map-canvas" role="region" aria-label="แผนที่ตำแหน่งอาคาร ใช้รายการค้นหาและตัวกรองเพื่อเปิดรายละเอียดด้วยแป้นพิมพ์" />
    <div className="permission-map-tools">
      <div className="permission-map-controls" aria-label="รูปแบบแผนที่">{([ ["osm", "แผนที่"], ["satellite", "ดาวเทียม"], ["hybrid", "ผสม"] ] as const).map(([key, label]) => <button key={key} type="button" className={mode === key ? "active" : ""} aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</div>
      <button type="button" className="permission-map-fit" onClick={fitVisible}>ดูหมุดทั้งหมด</button>
    </div>
    {error && <div className="permission-map-error" role="status">โหลดแผนที่ไม่สำเร็จ ลองค้นหาอาคารจากช่องค้นหาด้านบน</div>}
  </div>;
}
