import type { DashboardItem } from "@/lib/dashboard";

export type QueueView = "all" | "urgent" | "today" | "mine";
export type QueueSort = "priority" | "due" | "title";
export type ViewSettings = { query: string; view: QueueView; status: string; sort: QueueSort };

export const priorityLabels = { urgent: "เร่งด่วน", attention: "ต้องติดตาม", normal: "ปกติ" } as const;
export const kindLabels = { task: "งาน", building: "อาคาร", guarantee: "เงินประกัน", approval: "รออนุมัติ", document: "เอกสาร" } as const;

export function bangkokDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export function isDueToday(item: DashboardItem, reference: string) {
  return Boolean(item.dueAt && bangkokDate(item.dueAt) === bangkokDate(reference));
}

export function formatWorkspaceDate(value?: string, time = false) {
  if (!value) return "ไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", ...(time ? { timeStyle: "short" as const } : {}), timeZone: "Asia/Bangkok" }).format(new Date(value));
}

export function matchesQuery(item: DashboardItem, query: string) {
  const words = query.normalize("NFC").trim().toLocaleLowerCase("th-TH").split(/\s+/).filter(Boolean);
  const haystack = [item.title, item.id, item.code, item.buildingName, item.ownerName, item.description, item.statusLabel]
    .filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
  return words.every((word) => haystack.includes(word));
}

export function readViewSettings(params: Pick<URLSearchParams, "get">): ViewSettings {
  const view = params.get("view");
  const sort = params.get("sort");
  return {
    query: (params.get("q") || "").slice(0, 200),
    view: view === "urgent" || view === "today" || view === "mine" ? view : "all",
    status: (params.get("status") || "").slice(0, 80),
    sort: sort === "due" || sort === "title" ? sort : "priority",
  };
}

export function filterQueue(items: DashboardItem[], settings: ViewSettings, userId: string, reference: string) {
  const priority = { urgent: 0, attention: 1, normal: 2 };
  return items.filter((item) => matchesQuery(item, settings.query)
    && (!settings.status || item.statusLabel === settings.status)
    && (settings.view !== "urgent" || item.priority === "urgent")
    && (settings.view !== "today" || isDueToday(item, reference))
    && (settings.view !== "mine" || item.ownerId === userId))
    .sort((a, b) => {
      if (settings.sort === "title") return a.title.localeCompare(b.title, "th") || a.id.localeCompare(b.id);
      if (settings.sort === "priority" && priority[a.priority] !== priority[b.priority]) return priority[a.priority] - priority[b.priority];
      const dueA = a.dueAt ? Date.parse(a.dueAt) : Infinity;
      const dueB = b.dueAt ? Date.parse(b.dueAt) : Infinity;
      return (dueA === dueB ? 0 : dueA - dueB) || a.title.localeCompare(b.title, "th") || a.id.localeCompare(b.id);
    });
}

export function recordKey(item: DashboardItem) { return `${item.moduleId}:${item.id}`; }
