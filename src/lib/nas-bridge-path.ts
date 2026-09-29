export function validateNasBridgePath(path: readonly string[]) {
  if (!path.length || path.length > 12) throw new Error("Invalid NAS bridge path");
  for (const segment of path) {
    if (!segment || segment === "." || segment === ".." || segment.length > 160 || /[\\/\0]/.test(segment)) throw new Error("Invalid NAS bridge path");
  }
  return path.map(encodeURIComponent).join("/");
}
