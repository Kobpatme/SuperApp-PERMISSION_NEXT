export const ductRentalRoutes = [
  "/duct-rental",
  "/duct-rental/new",
  "/duct-rental/[id]",
  "/duct-rental/[id]/edit",
  "/duct-rental/[id]/[view]",
  "/duct-rental/renewal",
  "/duct-rental/renewal/[id]",
  "/duct-rental/cancellation",
  "/duct-rental/cancellation/new",
  "/duct-rental/cancellation/[id]",
  "/duct-rental/communication-cable",
  "/duct-rental/settings",
  "/duct-rental/tasks",
  "/duct-rental/tracking",
] as const;

export const ductRentalViews = [
  "design", "draftsman", "permission", "install", "draftsman2",
  "permission2", "3rdparty", "permission3", "contract", "missing-docs",
] as const;

export const ductRentalUiStates = ["role-user", "role-denied", "loading", "empty", "error"] as const;

export type DuctRentalUiState = (typeof ductRentalUiStates)[number];
export type DuctRentalRouteCoverage = { route: (typeof ductRentalRoutes)[number]; view?: (typeof ductRentalViews)[number]; states: readonly DuctRentalUiState[] };

/** The test-facing composition matrix is intentionally data, not copied markup. */
export const ductRentalRouteCoverage: DuctRentalRouteCoverage[] = ductRentalRoutes.reduce<DuctRentalRouteCoverage[]>((coverage, route) => {
  if (route === "/duct-rental/[id]/[view]") {
    coverage.push(...ductRentalViews.map(view => ({ route, view, states: ductRentalUiStates })));
  } else {
    coverage.push({ route, states: ductRentalUiStates });
  }
  return coverage;
}, []);
