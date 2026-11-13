import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {permissionOutManifest} from "../permission-out/manifest";
import {siteFacilityManifest} from "./manifest";
describe("approved two-module map workspace contract",()=>{
 it("registers distinct routes, entry capabilities and independently default-off modules",()=>{
  expect(permissionOutManifest.href).toBe("/permission-out");expect(siteFacilityManifest.href).toBe("/site-facility");
  expect(permissionOutManifest.enabledByDefault).toBe(false);expect(siteFacilityManifest.enabledByDefault).toBe(false);
  expect(siteFacilityManifest.entryPermissions).toEqual(["site_facility.module.view"]);
  expect(permissionOutManifest.capabilities?.some(c=>c.code.includes("site.read"))).toBe(false);
  expect(siteFacilityManifest.capabilities?.every(c=>c.code.startsWith("site_facility."))).toBe(true);
 });
 it("uses canonical CSS/primitives in both map-first workspaces without the retired module skin",()=>{
  const route=readFileSync("src/modules/permission-out/workspace.tsx","utf8"),sites=readFileSync("src/modules/site-facility/workspace.tsx","utf8");
  for(const source of [route,sites]){expect(source).toContain("@/components/map-workspace/ui");expect(source).toContain("<NetworkMap");expect(source).toContain("styles.workbench");expect(source).not.toContain("workspace.module.css");}
  const css=readFileSync("src/styles/ui.css","utf8");expect(css).toContain(".ui-map-workbench");expect(css).toContain(".ui-map-view");
 });
});
