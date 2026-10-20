"use client";

import { useMemo } from "react";
import type { PermissionBuildingRow } from "@/lib/permission-building-server";
import { LongdoMapCanvas, type MapPoint } from "@/features/buildings/map/longdo-map-canvas";

export function BuildingMap({ buildings, selectedId, apiKey, onOpenDetails }: { buildings: PermissionBuildingRow[]; selectedId: string | null; apiKey: string; onOpenDetails: (id: string) => void }) {
  const points = useMemo(() => buildings.flatMap((item): MapPoint[] => item.lat === null || item.lng === null ? [] : [{ id: item.id,
    code: item.code, name: item.nameTh, latitude: item.lat, longitude: item.lng, status: item.status,
    detail: [item.area, item.province, item.locationVerified ? "ตำแหน่งยืนยันแล้ว" : "ตำแหน่งยังไม่ยืนยัน"].filter(Boolean).join(" · ") }]), [buildings]);
  return <div className="permission-map-shell">
    <LongdoMapCanvas apiKey={apiKey} points={points} selectedId={selectedId} onSelect={onOpenDetails} />
    {!points.length && <div className="permission-map-empty" role="status"><strong>ยังไม่มีอาคารที่ระบุตำแหน่ง</strong><span>อาคารเดิมยังค้นหาและตรวจสอบจากรายการได้ตามปกติ</span></div>}
  </div>;
}
