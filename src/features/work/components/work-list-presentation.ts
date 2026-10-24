export type WorkListSort = "recent" | "due" | "title";
export function pageWorkItems<T>(items: readonly T[], page: number, size: number) {
  const pageSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 10;
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Number.isFinite(page) ? Math.min(pages, Math.max(1, Math.floor(page))) : 1;
  const offset = (current - 1) * pageSize;
  return { items: items.slice(offset, offset + pageSize), page: current, pages, start: items.length ? offset + 1 : 0, end: Math.min(offset + pageSize, items.length), total: items.length };
}
export function sortWorkItems<T extends { title: string; dueAt: string | null }>(items: readonly T[], sort: WorkListSort): T[] {
  const result = [...items];
  if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "th"));
  if (sort === "due") result.sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));
  return result;
}
