import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = ["src/styles/tokens.css", "src/app/globals.css", "src/styles/ui.css", "src/styles/motion.css"]
  .map(file => readFileSync(resolve(file), "utf8")).join("\n");

async function mount(page: import("@playwright/test").Page) {
  const bundle = await build({
    stdin: { contents: "import React from 'react'; import {createRoot} from 'react-dom/client'; import {PageSkeleton} from './src/components/ui/page-skeleton'; createRoot(document.getElementById('root')).render(React.createElement(PageSkeleton,{shape:'table'}));", resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' },
    plugins: [{ name: "source-alias", setup(build) {
      build.onResolve({ filter: /^@\// }, args => ({ path: resolve("src", args.path.slice(2) + ".ts") }));
    } }],
  });
  await page.route("**/*", route => route.request().url() === "https://fixture.test/"
    ? route.fulfill({ contentType: "text/html", body: `<html lang="th"><head><style>${css}</style></head><body><div id="root"></div></body></html>` })
    : route.abort());
  await page.goto("https://fixture.test/");
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("status").waitFor();
}

test("loading skeleton uses a calm cadence and keeps Thai feedback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mount(page);
  await expect(page.getByRole("status")).toContainText("กำลังโหลด");
  const style = await page.locator(".loading-line").first().evaluate(element => {
    const animation = getComputedStyle(element, "::after");
    return { name: animation.animationName, duration: animation.animationDuration };
  });
  expect(style).toEqual({ name: "skeleton-shimmer", duration: "1.4s" });
});

test("loading skeleton stops for reduced motion while feedback remains", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mount(page);
  await expect(page.getByRole("status")).toContainText("กำลังโหลด");
  const style = await page.locator(".loading-line").first().evaluate(element => {
    const animation = getComputedStyle(element, "::after");
    return { name: animation.animationName, duration: animation.animationDuration };
  });
  expect(style.name).toBe("none");
  expect(style.duration).toBe("0s");
});
