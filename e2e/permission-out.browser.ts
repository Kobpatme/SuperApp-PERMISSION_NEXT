import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async({page})=>{await page.route("https://tile.openstreetmap.org/**",r=>r.abort());});
for(const width of [390,1440])for(const theme of ["light","dark"])test(`sites ${width} ${theme}: accessible list and keyboard detail`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto(`/?view=sites&theme=${theme}&readonly=1`);
  await expect(page.getByRole("button",{name:"SITE-001",exact:true})).toBeVisible();
  await expect(page.getByRole("link",{name:/ส่งออก/})).toHaveCount(0);
  await page.getByRole("button",{name:"SITE-001",exact:true}).focus();await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();await expect(page.getByRole("button",{name:"บันทึกการแก้ไข"})).toHaveCount(0);
  await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);await expect(page.getByRole("button",{name:"SITE-001",exact:true})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);
  await page.screenshot({path:`.data/permission-out-sites-${width}-${theme}.png`,fullPage:true});
});
for(const view of ["analysis","projects","datasets","settings","reports","site-datasets","site-reports"])for(const width of [390,1440])for(const theme of ["light","dark"])test(`${view} ${width} ${theme}: layout and accessibility`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto(`/?view=${view}&theme=${theme}`);
  await expect(page.getByRole("heading",{level:1})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(v=>["serious","critical"].includes(v.impact||""))).toEqual([]);
  await page.screenshot({path:`.data/permission-out-${view}-${width}-${theme}.png`,fullPage:true});
});
test("analysis filters change map/table/export scope together",async({page})=>{
  await page.goto("/?view=analysis&project=00000000-0000-4000-8000-000000000003");
  await expect(page.getByRole("region",{name:"ผลวิเคราะห์เส้นทาง",exact:true}).getByRole("button",{name:"เส้นทางทดสอบ",exact:true})).toBeVisible();
  await page.getByRole("listbox",{name:"ผลเปรียบเทียบ",exact:true}).selectOption("remove");
  await expect(page.getByText("ไม่พบเส้นทางตามตัวกรอง",{exact:true})).toBeVisible();
  await expect(page.getByRole("link",{name:"ส่งออก CSV"})).toHaveAttribute("href",/status=remove/);
});
test("site edit failure retains entered data and reports Thai error",async({page})=>{
  await page.goto("/?view=sites");await page.getByRole("button",{name:"SITE-001",exact:true}).click();
  await page.getByRole("dialog").getByLabel("ชื่อไซต์",{exact:true}).fill("ชื่อที่ยังไม่บันทึก");await page.getByRole("button",{name:"บันทึกการแก้ไข"}).click();
  await expect(page.getByRole("alert")).toContainText("ไม่บันทึกข้อมูลจริง");await expect(page.getByRole("dialog").getByLabel("ชื่อไซต์",{exact:true})).toHaveValue("ชื่อที่ยังไม่บันทึก");
});
test("MOD 1 opens its map before analysis and keeps map-focus controls keyboard accessible",async({page})=>{
 await page.goto("/?view=analysis");await expect(page.locator('[data-ui-screen="route-intelligence"]')).toBeVisible();
 await expect(page.getByRole("region",{name:"แผนที่เส้นทาง PEA / UFM",exact:true})).toBeVisible();
 await expect(page.locator(".leaflet-container")).toBeVisible();
 await expect(page.getByRole("navigation",{name:"ส่วนงานวิเคราะห์เส้นทาง"}).getByRole("link",{name:"ไซต์",exact:true})).toHaveCount(0);
 const expand=page.getByRole("button",{name:"ขยายแผนที่",exact:true});await expand.click();await expect(page.locator(".ui-map-expanded")).toBeVisible();await page.keyboard.press("Escape");await expect(page.locator(".ui-map-expanded")).toHaveCount(0);
 await page.getByRole("combobox",{name:"แผนที่พื้นหลัง",exact:true}).selectOption("none");await expect(page.locator(".leaflet-tile-pane img")).toHaveCount(0);
});
test("MOD 1 table selection opens a map detail drawer instead of an unrelated form",async({page})=>{
 await page.goto("/?view=analysis&project=00000000-0000-4000-8000-000000000003");
 await page.getByRole("region",{name:"ผลวิเคราะห์เส้นทาง",exact:true}).getByRole("button",{name:"เส้นทางทดสอบ",exact:true}).click();
 await expect(page.getByRole("complementary",{name:"รายละเอียดบนแผนที่"})).toContainText("เส้นทางทดสอบ");await expect(page.getByRole("complementary",{name:"รายละเอียดบนแผนที่"})).toBeFocused();
 await page.keyboard.press("Escape");await expect(page.getByRole("complementary",{name:"รายละเอียดบนแผนที่"})).toHaveCount(0);await expect(page.getByRole("region",{name:"ผลวิเคราะห์เส้นทาง",exact:true}).getByRole("button",{name:"เส้นทางทดสอบ",exact:true})).toBeFocused();
});
test("MOD 2 marker selection loads authorized detail and route overlays are explicit",async({page})=>{
 await page.goto("/?view=sites&routes=1");await expect(page.locator('[data-ui-screen="site-facility"]')).toBeVisible();
 await expect(page.locator(".leaflet-container canvas")).toBeVisible();const map=page.locator(".ui-map-view"),size=await map.boundingBox();await map.click({position:{x:size!.width/2,y:size!.height/2}});await expect(page.getByRole("dialog")).toBeVisible();
 await expect(page.getByRole("dialog")).toContainText("SITE-001");await page.keyboard.press("Escape");
 await page.getByLabel("แสดงเส้นทาง PEA / UFM จาก MOD 1",{exact:true}).check();
 await page.getByRole("combobox",{name:"รูปแบบข้อมูลไซต์",exact:true}).selectOption("overview");
 await expect(page.getByRole("navigation",{name:"ส่วนงาน Site Facility"})).toContainText("แผนที่ไซต์");
 await expect(page.getByRole("navigation",{name:"ส่วนงาน Site Facility"})).not.toContainText("สูตรค่าพาดสาย");
});
test("both modules use the canonical shared control skin",async({page})=>{
 for(const view of ["analysis","sites"]){await page.goto(`/?view=${view}`);const fit=page.getByRole("button",{name:"พอดีจอ",exact:true});await expect(fit).toHaveClass(/ui-button/);expect(await fit.evaluate(e=>getComputedStyle(e).minHeight)).toBe("44px");await expect(page.locator(".ui-map-workbench")).toBeVisible();const canvas=page.locator(".leaflet-container canvas");await expect(canvas).toBeVisible();await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.evaluate(()=>document.documentElement.dataset.theme="dark");await expect.poll(()=>canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);}
});
for(const theme of ["light","dark"])test(`map fields match Core reference in ${theme}, including interaction states`,async({page})=>{
 for(const view of ["analysis","sites","datasets","site-datasets"]){
  await page.goto(`/?view=${view}&theme=${theme}`);
  const fields=page.locator('input:not([type="checkbox"]):not([type="file"]):not([type="hidden"]),select,textarea');
  await expect(fields.first()).toBeVisible();
  for(const field of await fields.all())await expect(field).toHaveClass(/ui-field-control ui-building-field/);
  for(const excluded of await page.locator('input[type="checkbox"],input[type="file"]').all())await expect(excluded).not.toHaveClass(/ui-building-field/);
  for(const listbox of await page.locator("select[multiple]").all())expect(await listbox.evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThan(44);
  const target=fields.first();
  await target.evaluate(element=>{
   const reference=element.cloneNode(false) as HTMLElement;reference.id="core-field-reference";reference.className="ui-field-control ui-building-field";reference.setAttribute("aria-label","ช่องอ้างอิง Core");document.body.append(reference);
  });
  const reference=page.locator("#core-field-reference");
  const appearance=(element:Element)=>{const style=getComputedStyle(element);return Object.fromEntries(["backgroundColor","borderColor","borderRadius","boxShadow","color","minHeight","padding","opacity","cursor","outlineColor","outlineStyle","outlineWidth","outlineOffset"].map(key=>[key,style[key as keyof CSSStyleDeclaration]]));};
  for(const state of ["enabled","focus","invalid","disabled","readonly"]){
   for(const field of [target,reference]){
    await field.evaluate((e,state)=>{for(const attr of ["disabled","readonly","aria-invalid"])e.removeAttribute(attr);if(state==="invalid")e.setAttribute("aria-invalid","true");if(state==="disabled")e.setAttribute("disabled","");if(state==="readonly")e.setAttribute("readonly","");(e as HTMLElement).blur();},state);
   }
   if(state==="focus"){
    await target.focus();const actual=await target.evaluate(appearance);await reference.focus();expect(actual).toEqual(await reference.evaluate(appearance));
   }else expect(await target.evaluate(appearance)).toEqual(await reference.evaluate(appearance));
  }
 }
 await page.goto(`/?view=sites&theme=${theme}`);await page.getByRole("button",{name:"SITE-001",exact:true}).click();
 await expect(page.getByRole("dialog").locator("textarea")).toHaveClass(/ui-field-control ui-building-field/);
 await expect(page.getByRole("dialog").getByLabel("ชื่อไซต์",{exact:true})).toHaveClass(/ui-field-control ui-building-field/);
});
