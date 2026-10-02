export const workViews = ["mine", "mine-list", "team", "assign", "people", "tracker", "kpi", "reports", "activity", "due"] as const;
export type WorkView = (typeof workViews)[number];

export function isWorkView(value: string): value is WorkView {
  return workViews.includes(value as WorkView);
}
