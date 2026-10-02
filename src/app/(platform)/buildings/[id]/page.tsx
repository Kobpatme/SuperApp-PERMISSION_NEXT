import type { Metadata } from "next";
export const metadata: Metadata = { title: "รายละเอียดอาคาร" };
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TruncatedText } from "@/components/ui/truncated-text";
import { getBuilding360 } from "@/lib/building-360-server";
import { BuildingLocationPicker } from "@/features/buildings/map/location-picker";
import { DeleteBuilding } from "@/features/buildings/delete-building";
import "@/features/buildings/map/building-map.css";

export default async function BuildingDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getBuilding360(id);
  if (!data) notFound();
  const tabs = [["overview", "ภาพรวม"], ["location", "ตำแหน่ง"], ["documents", "เอกสาร"], ["work", "งานที่เกี่ยวข้อง"], ["guarantees", "เงินประกัน"], ["activity", "ประวัติ"]] as const;
  const tab = tabs.some(([key]) => key === query.tab) ? query.tab : "overview";
  return <div className="building-360">
    <PageHeader title={data.building.nameTh} description={[data.building.code, data.building.nameEn].filter(Boolean).join(" · ")} parent={{ label: "อาคารและค่าใช้จ่าย", href: "/buildings" }} actions={<><StatusBadge label={data.building.status} tone={data.building.status === "active" ? "success" : "neutral"}/>{data.canDelete && <DeleteBuilding id={id} name={data.building.nameTh} version={data.building.version}/>}</>}/>
    <nav className="ui-tabs" aria-label="รายละเอียดอาคาร">{tabs.map(([key, label]) => <Link key={key} href={`/buildings/${id}?tab=${key}`} aria-current={tab === key ? "page" : undefined}>{label}</Link>)}</nav>
    {tab === "overview" && <div className="building-360-grid"><section className="ui-panel"><h2>ข้อมูลอ้างอิง</h2><dl><div><dt>รหัสอาคาร</dt><dd>{data.building.code}</dd></div><div><dt>สถานะ</dt><dd>{data.building.status}</dd></div><div><dt>เจ้าของข้อมูล</dt><dd>{data.building.ownerTeamId ?? "ไม่กำหนดทีม"}</dd></div></dl></section><section className="ui-panel"><h2>บริบทที่เกี่ยวข้อง</h2><dl><div><dt>งาน</dt><dd>{data.tasks.length}</dd></div><div><dt>เงินประกัน</dt><dd>{data.guarantees.length}</dd></div><div><dt>ใบเสนอราคา</dt><dd>{data.estimates.length}</dd></div></dl></section></div>}
    {tab === "location" && <BuildingLocationPicker buildingId={id} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} canUpdate={data.location.canUpdate} initial={data.location.latitude !== null && data.location.longitude !== null ? {
      latitude: data.location.latitude, longitude: data.location.longitude, accuracy: data.location.accuracy,
      source: data.location.source === "gps" || data.location.source === "search" || data.location.source === "manual_pin" ? data.location.source : "import",
      placeId: data.location.placeId, address: data.location.address, subdistrict: data.location.subdistrict,
      district: data.location.district, province: data.location.province, postcode: data.location.postcode,
    } : null} />}
    {tab === "documents" && <section className="ui-panel"><h2>เอกสาร</h2>{!data.attachments.length && <p>ไม่มีเอกสารที่บัญชีนี้มีสิทธิ์ดู</p>}<ul className="ui-text-list">{data.attachments.map(file => <li key={file.id}><TruncatedText className="text-safe" text={`${file.fileName} · ${file.mediaType} · ${file.provider}`} lines={2}/></li>)}</ul></section>}
    {tab === "work" && <section className="ui-panel"><h2>งานที่เกี่ยวข้อง</h2>{!data.tasks.length && <p>ไม่มีงานในขอบเขตสิทธิ์</p>}<div className="ui-table-scroll"><table className="ui-table"><thead><tr><th>งาน</th><th>สถานะ</th><th>กำหนด</th></tr></thead><tbody>{data.tasks.map(item => <tr key={item.id}><td><TruncatedText text={item.title} lines={2}/></td><td><TruncatedText text={item.status} lines={1}/></td><td>{item.dueAt?.toLocaleDateString("th-TH") ?? "ไม่กำหนด"}</td></tr>)}</tbody></table></div></section>}
    {tab === "guarantees" && <section className="ui-panel"><h2>เงินประกัน</h2>{!data.guarantees.length && <p>ไม่มีรายการในขอบเขตสิทธิ์</p>}<ul className="ui-text-list">{data.guarantees.map(item => <li key={item.id}><TruncatedText className="text-safe" text={`${item.caseNumber} · ${item.status} · ฿${Number(item.expectedDeposit).toLocaleString("th-TH")}`} lines={2}/></li>)}</ul></section>}
    {tab === "activity" && <section className="ui-panel"><h2>ประวัติ</h2>{!data.activities.length && <p>ไม่มีกิจกรรมที่บัญชีนี้มีสิทธิ์ดู</p>}<ol className="work-timeline">{data.activities.map(item => <li key={item.id}><time>{item.occurredAt.toLocaleString("th-TH")}</time><TruncatedText text={item.eventType} lines={2}/><TruncatedText text={item.entityType} lines={2}/></li>)}</ol></section>}
  </div>;
}
