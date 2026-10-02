"use client";

import { useEffect, useMemo, useState } from "react";
import { LongdoMapCanvas, type MapPoint } from "./longdo-map-canvas";

type Source = "gps" | "manual_pin" | "search";
export type BuildingLocationCandidate = { latitude: number; longitude: number; accuracy: number | null; source: Source | "import"; placeId: string | null;
  address: string; subdistrict: string; district: string; province: string; postcode: string };
type Place = { id: string | null; name: string; address: string; latitude: number; longitude: number };

export function BuildingLocationPicker({ buildingId, apiKey, initial, canUpdate, onConfirmCandidate }: { buildingId?: string; apiKey: string; initial: BuildingLocationCandidate | null; canUpdate: boolean; onConfirmCandidate?: (candidate: BuildingLocationCandidate) => void }) {
  const [candidate, setCandidate] = useState<BuildingLocationCandidate | null>(initial);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [state, setState] = useState("");
  const [searchState, setSearchState] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const points: MapPoint[] = useMemo(() => candidate ? [{ id: "candidate", code: "", name: "ตำแหน่งที่เลือก", latitude: candidate.latitude, longitude: candidate.longitude }] : [], [candidate]);

  useEffect(() => {
    if (!candidate || !apiKey) return;
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      setGeocoding(true);
      const params = new URLSearchParams({ kind: "reverse", lat: String(candidate.latitude), lon: String(candidate.longitude) });
      try {
        const response = await fetch(`/api/buildings/location-services?${params}`, { signal: abort.signal, cache: "no-store" });
        if (!response.ok) throw new Error("reverse");
        const result = await response.json() as Partial<BuildingLocationCandidate>;
        if (!abort.signal.aborted) setCandidate((current) => current && current.latitude === candidate.latitude && current.longitude === candidate.longitude ? {
          ...current, address: [result.address, result.subdistrict, result.district, result.province, result.postcode].filter(Boolean).join(" "),
          subdistrict: result.subdistrict || "", district: result.district || "", province: result.province || "", postcode: result.postcode || "",
        } : current);
      } catch { if (!abort.signal.aborted) setState("แปลงพิกัดเป็นที่อยู่ไม่สำเร็จ แต่ยังบันทึกพิกัดที่เลือกได้"); }
      finally { if (!abort.signal.aborted) setGeocoding(false); }
    }, 400);
    return () => { window.clearTimeout(timer); abort.abort(); };
  // Restart reverse lookup only when the pin moves, not when returned address fields update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, candidate?.latitude, candidate?.longitude, revision]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2 || !apiKey) return;
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("กำลังค้นหาสถานที่…");
      try {
        const params = new URLSearchParams({ kind: "search", q: value });
        const response = await fetch(`/api/buildings/location-services?${params}`, { signal: abort.signal, cache: "no-store" });
        if (!response.ok) throw new Error("search");
        const result = await response.json() as { items?: Place[] };
        if (!abort.signal.aborted) { setPlaces(result.items ?? []); setSearchState(result.items?.length ? "" : "ไม่พบสถานที่"); }
      } catch { if (!abort.signal.aborted) setSearchState("ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    }, 350);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [apiKey, query]);

  function changeQuery(value: string) {
    setQuery(value);
    if (value.trim().length < 2 || !apiKey) { setPlaces([]); setSearchState(""); }
  }
  function choose(latitude: number, longitude: number, source: Source, accuracy: number | null = null, placeId: string | null = null) {
    setCandidate({ latitude, longitude, accuracy, source, placeId, address: "", subdistrict: "", district: "", province: "", postcode: "" });
    setState("ตรวจสอบตำแหน่งและข้อมูลที่อยู่ก่อนบันทึก"); setRevision((value) => value + 1);
  }
  function useCurrentLocation() {
    setState("กำลังขอตำแหน่งจากอุปกรณ์…");
    if (!navigator.geolocation) { setState("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง คุณยังปักหมุดหรือค้นหาสถานที่ได้"); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => { choose(coords.latitude, coords.longitude, "gps", coords.accuracy); }, (error) => {
      setState(error.code === error.PERMISSION_DENIED ? "ไม่ได้รับอนุญาตเข้าถึงตำแหน่ง คุณยังเลือกหมุดหรือค้นหาสถานที่ได้" : error.code === error.TIMEOUT ? "ใช้เวลารอตำแหน่งนานเกินไป กรุณาลองใหม่" : "อ่านตำแหน่งไม่สำเร็จ กรุณาลองใหม่");
    }, { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 });
  }
  async function save() {
    if (!candidate || !canUpdate || saving) return;
    const place = [candidate.address, candidate.province].filter(Boolean).join(" · ") || `${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}`;
    if (!window.confirm(`ยืนยันบันทึกตำแหน่งอาคารนี้?\n${place}\nพิกัด ${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}`)) return;
    if (!buildingId && onConfirmCandidate) { onConfirmCandidate(candidate); setState("ยืนยันตำแหน่งสำหรับแบบฟอร์มแล้ว ตำแหน่งจะบันทึกพร้อมข้อมูลอาคาร"); return; }
    if (!buildingId) return;
    setSaving(true); setState("กำลังบันทึกตำแหน่ง…");
    try {
      const response = await fetch(`/api/buildings/${buildingId}/location`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...candidate, verified: true }) });
      if (!response.ok) throw new Error(response.status === 403 ? "บัญชีนี้ไม่มีสิทธิ์แก้ไขตำแหน่งอาคาร" : "บันทึกตำแหน่งไม่สำเร็จ กรุณาลองอีกครั้ง");
      setState("บันทึกและยืนยันตำแหน่งแล้ว");
    } catch (error) { setState(error instanceof Error ? error.message : "บันทึกตำแหน่งไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { setSaving(false); }
  }

  return <section className="building-location-picker" aria-labelledby="building-location-title">
    <div className="building-location-heading"><div><h2 id="building-location-title">ตำแหน่งอาคาร</h2><p>เลือกตำแหน่ง ตรวจสอบที่อยู่ แล้วกดยืนยันก่อนบันทึก</p></div><button type="button" onClick={useCurrentLocation} disabled={!canUpdate || saving}>◎ ใช้ตำแหน่งปัจจุบัน</button></div>
    <label className="building-location-search">ค้นหาสถานที่ / ที่อยู่<input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="พิมพ์ชื่ออาคาร ถนน หรือสถานที่" disabled={!canUpdate || saving} /></label>
    {(searchState || places.length > 0) && <div className="building-location-results" role="listbox" aria-label="ผลการค้นหาสถานที่">
      {places.map((place, index) => <button type="button" role="option" aria-selected="false" key={`${place.id ?? place.name}-${index}`} onClick={() => { choose(place.latitude, place.longitude, "search", null, place.id); setQuery(place.name); setPlaces([]); }}><strong>{place.name}</strong><span>{place.address || "ไม่มีรายละเอียดที่อยู่"}</span></button>)}
      {searchState && <p role="status">{searchState}</p>}
    </div>}
    <p className="building-location-map-hint">คลิกแผนที่เพื่อวางหมุดด้วยตนเอง</p>
    <LongdoMapCanvas apiKey={apiKey} points={points} selectedId={candidate ? "candidate" : null} onPick={(latitude, longitude) => choose(latitude, longitude, "manual_pin")} />
    {candidate ? <dl className="building-location-values"><div><dt>ละติจูด</dt><dd>{candidate.latitude.toFixed(6)}</dd></div><div><dt>ลองจิจูด</dt><dd>{candidate.longitude.toFixed(6)}</dd></div>
      <div><dt>ความแม่นยำ</dt><dd>{candidate.accuracy === null ? "ไม่ระบุ" : `${Math.round(candidate.accuracy)} เมตร`}</dd></div><div><dt>แหล่งตำแหน่ง</dt><dd>{candidate.source === "gps" ? "GPS" : candidate.source === "search" ? "ค้นหาสถานที่" : "ปักหมุด"}</dd></div>
      <div className="building-location-address"><dt>ที่อยู่</dt><dd>{geocoding ? "กำลังค้นหาที่อยู่…" : candidate.address || "ไม่พบข้อมูลที่อยู่ · พิกัดยังบันทึกได้"}</dd></div></dl> : <p className="building-location-empty">ยังไม่ได้เลือกตำแหน่งอาคาร</p>}
    {state && <p className="building-location-message" role="status">{state}</p>}
    {canUpdate && <div className="building-location-actions"><button type="button" className="secondary-action" disabled={!candidate || saving} onClick={() => { setCandidate(null); setState("ล้างตำแหน่งที่เลือกแล้ว"); }}>ล้างตำแหน่งที่เลือก</button><button type="button" disabled={!candidate || saving} onClick={save}>{saving ? "กำลังบันทึก…" : "ยืนยันและบันทึกตำแหน่ง"}</button></div>}
  </section>;
}
