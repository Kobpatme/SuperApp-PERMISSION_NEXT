import {expect,type Page} from "@playwright/test";
export async function checkVisibleFontFloor(page:Page){
  const small=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>("body *")].filter(el=>{
    if(![...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim()))return false;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&parseFloat(s.fontSize)<12;
  }).map(el=>({tag:el.tagName,className:el.className,fontSize:getComputedStyle(el).fontSize})));
  expect(small).toEqual([]);
}
