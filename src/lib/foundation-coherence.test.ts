import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const globalsCss = readFileSync(resolve(repoRoot, "src/app/globals.css"), "utf8");
const tokensCss = readFileSync(resolve(repoRoot, "src/styles/tokens.css"), "utf8");
const darkTokens = tokensCss.match(/html\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function resolveToken(name: string, source: string) {
  const declaration = source.match(new RegExp(`${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*:\\s*([^;]+);`));
  if (!declaration) throw new Error(`Missing token ${name}`);
  return declaration[1].trim();
}

function channel(value: string) {
  const parsed = Number.parseInt(value, 16) / 255;
  return parsed <= 0.03928 ? parsed / 12.92 : ((parsed + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const normalized = hex.replace("#", "");
  return 0.2126 * channel(normalized.slice(0, 2)) + 0.7152 * channel(normalized.slice(2, 4)) + 0.0722 * channel(normalized.slice(4, 6));
}

describe("plain-CSS foundation remains coherent", () => {
  it("does not retain unused Tailwind foundation imports or dependencies", () => {
    expect(globalsCss).not.toContain('@import "tailwindcss"');
    expect(packageJson.dependencies ?? {}).not.toHaveProperty("clsx");
    expect(packageJson.dependencies ?? {}).not.toHaveProperty("tailwind-merge");
    expect(packageJson.devDependencies ?? {}).not.toHaveProperty("tailwindcss");
    expect(packageJson.devDependencies ?? {}).not.toHaveProperty("@tailwindcss/turbopack");
  });

  it("keeps dark module-tab hover text readable against its effective hover surface", () => {
    const hoverRule = globalsCss.match(/html\[data-theme="dark"\] \.module-tab:hover\{([^}]+)\}/)?.[1] ?? "";
    expect(hoverRule).toContain("background:var(--color-info-soft)");
    expect(hoverRule).toContain("color:var(--color-text)");
    expect(hoverRule).not.toContain("color:var(--color-info-soft)");

    const background = resolveToken("--color-info-soft", darkTokens);
    const foreground = resolveToken("--color-text", darkTokens);
    const contrast = (Math.max(luminance(background), luminance(foreground)) + 0.05) / (Math.min(luminance(background), luminance(foreground)) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);

    expect(globalsCss).toContain(".module-tab:focus-visible");
    const focusRing = resolveToken("--color-focus-ring", darkTokens);
    const darkSurface = resolveToken("--color-bg", darkTokens);
    const focusContrast = (Math.max(luminance(focusRing), luminance(darkSurface)) + 0.05) / (Math.min(luminance(focusRing), luminance(darkSurface)) + 0.05);
    expect(focusContrast).toBeGreaterThanOrEqual(3);
  });
});
