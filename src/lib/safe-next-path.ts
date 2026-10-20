export function safeNextPath(value: string | null | undefined, fallback = "/") {
  const candidate = String(value || "").trim();
  const hasControlCharacter = [...candidate].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\") || hasControlCharacter) return fallback;
  return candidate;
}
