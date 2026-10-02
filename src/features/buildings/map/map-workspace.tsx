"use client";

import Decimal from "decimal.js";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { matchesBuildingMapCategory, summarizeBuildingMapFees, type BuildingMapExpenseCategory } from "@/lib/building-map-domain";
import { LongdoMapCanvas, type MapPoint } from "./longdo-map-canvas";

type Mode = "buildings" | "status" | "expense" | "heatmap";
type HeatMetric = "building_count" | "fee_count" | "amount";
type MapFee = { source_field: string; cost_type: string; revenue_period: string | null; payable: boolean; amount: number | null };
export type MapBuilding = { id: string; code: string; nameTh: string; nameEn: string | null; status: string; area: string; province: string; subdistrict: string; district: string;
  address: string; location: string; lat: number | null; lng: number | null; locationVerified: boolean; locationSource: string | null;
  conditionEffectiveAt: string | null; canUpdateLocation: boolean; boq: { fees: MapFee[] } | null };
const groups: Array<[BuildingMapExpenseCategory, string]> = [["CAPEX", "ค่าใช้จ่ายครั้งแรก"], ["OPEX_MONTHLY", "ค่าใช้จ่ายรายเดือน"], ["OPEX_ANNUAL", "ค่าใช้จ่ายรายปี"], ["DEPOSIT", "เงินประกัน / มัดจำ"], ["UNCLASSIFIED", "รายการรอตรวจสอบ"]];
const money = (value: Decimal) => {
  const [whole, fraction = "00"] = value.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `฿${grouped}${fraction === "00" ? "" : `.${fraction.replace(/0$/, "")}`}`;
};

export function MapWorkspace({ buildings, apiKey, selectedBuildingId = "", initialQuery = "", initialProvince = "", initialStatus = "", initialMode = "buildings", initialCategory = "CAPEX", initialHeatMetric = "building_count", initialFromDate = "", initialToDate = "", truncated = false }: {
  buildings: MapBuilding[]; apiKey: string; selectedBuildingId?: string; initialQuery?: string; initialProvince?: string;
  initialStatus?: string; initialMode?: string; initialCategory?: string; initialHeatMetric?: string; initialFromDate?: string; initialToDate?: string; truncated?: boolean;
}) {
  const router = useRouter(), pathname = usePathname(), searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [province, setProvince] = useState(initialProvince);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState<BuildingMapExpenseCategory>(groups.some(([key]) => key === initialCategory) ? initialCategory as BuildingMapExpenseCategory : "CAPEX");
  const [heatMetric, setHeatMetric] = useState<HeatMetric>((["building_count", "fee_count", "amount"].includes(initialHeatMetric) ? initialHeatMetric : "building_count") as HeatMetric);
  const [mode, setMode] = useState<Mode>((["buildings", "status", "expense", "heatmap"].includes(initialMode) ? initialMode : "buildings") as Mode);
  const [selectedId, setSelectedId] = useState(selectedBuildingId);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [locationMessage, setLocationMessage] = useState("");
  const located = useMemo(() => buildings.filter((item) => item.lat !== null && item.lng !== null), [buildings]);
  const provinces = useMemo(() => [...new Set(buildings.map((item) => item.province).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th")), [buildings]);
  const visible = useMemo(() => buildings.filter((item) => {
    const haystack = [item.nameTh, item.nameEn, item.code, item.area, item.province, item.address].join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
    const needle = query.trim().normalize("NFC").toLocaleLowerCase("th-TH");
    return (!needle || needle.split(/\s+/).every((part) => haystack.includes(part))) && (!province || item.province === province) && (!status || item.status === status) &&
      (item.lat !== null && item.lng !== null) && (!fromDate || (item.conditionEffectiveAt && item.conditionEffectiveAt.slice(0, 10) >= fromDate)) &&
      (!toDate || (item.conditionEffectiveAt && item.conditionEffectiveAt.slice(0, 10) <= toDate));
  }), [buildings, fromDate, province, query, status, toDate]);
  const summary = useMemo(() => visible.reduce((result, item) => {
    const current = summarizeBuildingMapFees(item.boq?.fees ?? [], category);
    return { count: result.count + current.count, amount: result.amount.plus(current.amount) };
  }, { count: 0, amount: new Decimal(0) }), [category, visible]);
  const selected = visible.find((item) => item.id === selectedId) ?? null;
  const weighted = visible.map((item) => {
    const fees = (item.boq?.fees ?? []).filter((fee) => fee.payable && matchesBuildingMapCategory(fee, category));
    return { item, fees, amount: summarizeBuildingMapFees(fees, category).amount };
  });
  const maxAmount = weighted.reduce((max, row) => row.amount.greaterThan(max) ? row.amount : max, new Decimal(0));
  const maxFeeCount = Math.max(0, ...weighted.map((row) => row.fees.length));
  const heatPoints = weighted.filter(({ amount, fees }) => mode !== "heatmap" || heatMetric === "building_count" || (heatMetric === "fee_count" ? fees.length > 0 : (category === "UNCLASSIFIED" ? fees.length > 0 : amount.greaterThan(0))));
  const points: MapPoint[] = heatPoints.map(({ item, fees, amount }) => ({ id: item.id, name: item.nameTh, code: item.code,
    latitude: item.lat!, longitude: item.lng!, status: item.status,
    weight: mode !== "heatmap" ? 1 : heatMetric === "building_count" ? 1 : heatMetric === "fee_count"
      ? maxFeeCount ? fees.length / maxFeeCount : 0 : maxAmount.isZero() ? 0 : amount.div(maxAmount).toNumber(),
    detail: [item.area, item.province, item.locationVerified ? "ยืนยันตำแหน่งแล้ว" : "ยังไม่ยืนยันตำแหน่ง"].filter(Boolean).join(" · ") }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of [["q", query], ["province", province], ["status", status], ["mode", mode], ["buildingId", selectedId],
        ["category", category], ["heatMetric", mode === "heatmap" ? heatMetric : ""], ["from", fromDate], ["to", toDate]] as const) {
        if (value) params.set(key, value); else params.delete(key);
      }
      if (params.toString() !== searchParams.toString()) {
        router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, fromDate, heatMetric, mode, pathname, province, query, router, searchParams, selectedId, status, toDate]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? ""); setProvince(params.get("province") ?? ""); setStatus(params.get("status") ?? "");
      setSelectedId(params.get("buildingId") ?? "");
      const nextMode = params.get("mode") ?? "buildings";
      if (["buildings", "status", "expense", "heatmap"].includes(nextMode)) setMode(nextMode as Mode);
      const nextCategory = params.get("category") ?? "CAPEX";
      if (groups.some(([key]) => key === nextCategory)) setCategory(nextCategory as BuildingMapExpenseCategory);
      const nextMetric = params.get("heatMetric") ?? "building_count";
      if (["building_count", "fee_count", "amount"].includes(nextMetric)) setHeatMetric(nextMetric as HeatMetric);
      setFromDate(params.get("from") ?? ""); setToDate(params.get("to") ?? "");
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  return <main className="building-map-page">
    <header className="building-map-header"><div><Link href="/buildings" className="building-map-back">← อาคารและค่าใช้จ่าย</Link><h1>แผนที่อาคาร</h1><p>ค้นหาอาคารและตรวจสอบข้อมูลค่าใช้จ่ายตามเงื่อนไขปัจจุบัน</p></div>
      <div className="building-map-summary" aria-live="polite"><div><strong>{visible.length.toLocaleString("th-TH")}</strong><span>อาคารมีพิกัด</span></div><div><strong>{buildings.length.toLocaleString("th-TH")}</strong><span>อาคารในขอบเขต</span></div>
        {(mode === "expense" || mode === "heatmap") && <div><strong>{summary.count.toLocaleString("th-TH")}</strong><span>รายการตามเงื่อนไข · {money(summary.amount)}</span></div>}</div>
    </header>
    <section className="building-map-filters" aria-label="ค้นหาและกรองแผนที่">
      <label>ค้นหาอาคาร<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่ออาคาร รหัส หรือพื้นที่" /></label>
      <label>จังหวัด<select value={province} onChange={(event) => setProvince(event.target.value)}><option value="">ทุกจังหวัด</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">ทุกสถานะ</option>{[...new Set(buildings.map((item) => item.status).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>มุมมอง<select value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="buildings">อาคาร</option><option value="status">สถานะอาคาร</option><option value="expense">ค่าใช้จ่ายตามเงื่อนไข</option><option value="heatmap">Heatmap</option></select></label>
      {(mode === "expense" || mode === "heatmap") && <>
        <label>หมวดค่าใช้จ่าย<select value={category} onChange={(event) => setCategory(event.target.value as BuildingMapExpenseCategory)}>{groups.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        {mode === "heatmap" && <label>ตัวชี้วัดความหนาแน่น<select value={heatMetric} onChange={(event) => setHeatMetric(event.target.value as HeatMetric)}><option value="building_count">จำนวนอาคาร</option><option value="fee_count">จำนวนรายการตามเงื่อนไข</option><option value="amount">ยอดตามหมวดที่เลือก</option></select></label>}
        <label>เงื่อนไขมีผลตั้งแต่<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label>ถึงวันที่<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
      </>}
      <button type="button" className="building-location-button" onClick={() => {
        setLocationMessage("กำลังขอตำแหน่งจากอุปกรณ์…");
        if (!navigator.geolocation) { setLocationMessage("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง คุณยังค้นหาอาคารจากแผนที่ได้"); return; }
        navigator.geolocation.getCurrentPosition((position) => { window.dispatchEvent(new CustomEvent("building-map-current-location", { detail: { lat: position.coords.latitude, lon: position.coords.longitude } })); setLocationMessage(`แสดงตำแหน่งปัจจุบัน · ความแม่นยำประมาณ ${Math.round(position.coords.accuracy)} เมตร`); }, (error) => setLocationMessage(error.code === error.PERMISSION_DENIED ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง คุณยังค้นหาอาคารจากแผนที่ได้" : error.code === error.TIMEOUT ? "ใช้เวลารอตำแหน่งนานเกินไป กรุณาลองอีกครั้ง" : "ไม่สามารถอ่านตำแหน่งได้ กรุณาลองอีกครั้ง"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      }}>◎ ตำแหน่งปัจจุบัน</button>
    </section>
    {locationMessage && <p className="building-map-notice" role="status">{locationMessage}</p>}
    {truncated && <p className="building-map-notice" role="status">แสดงข้อมูล 2,000 อาคารแรกในขอบเขต โปรดจำกัดการค้นหาหรือจังหวัดเพื่อดูรายการเพิ่มเติม</p>}
    <div className="building-map-layout"><section className="building-map-list" aria-label="รายการอาคารบนแผนที่"><div className="building-map-list-head"><strong>อาคารบนแผนที่</strong><span>{visible.length.toLocaleString("th-TH")} รายการ</span></div>
      {visible.length ? <ul>{visible.map((item) => <li key={item.id}><button type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)}><strong>{item.nameTh}</strong><span>{item.code} · {[item.area, item.province].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่"}</span><small>{item.status} · {item.locationVerified ? "ยืนยันตำแหน่งแล้ว" : "ยังไม่ยืนยันตำแหน่ง"}</small></button><Link href={`/buildings/${item.id}`} aria-label={`เปิดข้อมูลอาคาร ${item.nameTh}`}>เปิด</Link></li>)}</ul> : <div className="building-map-empty-state"><strong>{buildings.length ? "ไม่พบผลลัพธ์" : "ไม่มีอาคารที่ระบุตำแหน่ง"}</strong><span>{buildings.length ? "ปรับหรือล้างตัวกรองเพื่อดูอาคาร" : "อาคารเดิมยังคงใช้งานได้จากรายการอาคาร"}</span></div>}</section>
      <section className="building-map-canvas-panel" aria-label="แผนที่และรายละเอียดอาคาร"><div className="building-map-legend"><strong>คำอธิบาย</strong><span><i className="building-map-legend-pin"/> จุดอาคาร</span>{mode !== "heatmap" && <span><i className="building-map-legend-cluster"/> กลุ่มอาคาร</span>}{mode === "heatmap" && <span><i className="building-map-legend-heat"/> ความหนาแน่น: {heatMetric === "building_count" ? "จำนวนอาคาร" : heatMetric === "fee_count" ? `จำนวนรายการ · ${groups.find(([key]) => key === category)?.[1]}` : `ยอด · ${groups.find(([key]) => key === category)?.[1]}`}</span>}</div>
        <LongdoMapCanvas apiKey={apiKey} points={points} selectedId={selectedId} heatmap={mode === "heatmap"} onSelect={setSelectedId} />
        {selected && <article className="building-map-detail" aria-live="polite"><button type="button" className="building-map-detail-close" onClick={() => setSelectedId("")} aria-label="ปิดรายละเอียด">×</button><small>รายละเอียดอาคาร</small><h2>{selected.nameTh}</h2><p>{selected.code} · {selected.status}</p><p>{[selected.subdistrict, selected.district, selected.province].filter(Boolean).join(" · ") || selected.address || "ยังไม่มีข้อมูลที่อยู่"}</p><p>{selected.locationVerified ? "ยืนยันตำแหน่งแล้ว" : "ตำแหน่งยังไม่ยืนยัน"}{selected.locationSource ? ` · ${selected.locationSource}` : ""}</p>
          {(mode === "expense" || mode === "heatmap") && <p>{groups.find(([key]) => key === category)?.[1]}: {money(summarizeBuildingMapFees(selected.boq?.fees ?? [], category).amount)}</p>}
          <div><Link href={`/buildings/${selected.id}`}>ข้อมูลอาคาร</Link>{selected.canUpdateLocation && <Link href={`/buildings/${selected.id}?tab=location`}>แก้ไขตำแหน่ง</Link>}</div></article>}
      </section></div>
    <p className="building-map-footnote">ยอดบนแผนที่อ่านจาก BOQ ของเงื่อนไขอาคารปัจจุบันและแยกตามหมวด ไม่ใช่ธุรกรรมที่จ่ายจริง ค่าใช้จ่ายจากต้นทางที่รอตรวจสอบจะไม่ถูกรวม</p>
  </main>;
}
