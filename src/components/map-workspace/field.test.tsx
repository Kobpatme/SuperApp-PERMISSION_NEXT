import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./ui";

describe("map workspace Core field opt-in", () => {
 it.each([<input key="text" className="existing" />, <select key="select"><option>เลือก</option></select>, <textarea key="textarea" />, <select key="multiple" multiple size={4}><option>เลือก</option></select>])("uses the existing shared skin for text controls", control => {
  const html=renderToStaticMarkup(<Field label="ข้อมูล">{control}</Field>);
  expect(html).toContain("ui-field-control ui-building-field");
  if(control.props.className)expect(html).toContain("existing ui-field-control");
 });
 it.each(["checkbox","radio","hidden","file","range","color","submit"])("does not skin native %s controls", type => {
  expect(renderToStaticMarkup(<Field label="ข้อมูล"><input type={type}/></Field>)).not.toContain("ui-building-field");
 });
 it("skins the input but not its companion datalist",()=>{
  const html=renderToStaticMarkup(<Field label="จังหวัด"><input list="provinces"/><datalist id="provinces"><option value="กรุงเทพมหานคร"/></datalist></Field>);
  expect(html).toContain('class="ui-field-control ui-building-field"');
  expect(html).toContain('<datalist id="provinces">');
 });
 it("preserves validation, disabled and readonly semantics",()=>{
  const html=renderToStaticMarkup(<Field label="ข้อมูล" controlId="map-field" error="กรุณาตรวจสอบ"><input id="map-field" disabled readOnly/></Field>);
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="map-field-error"');
  expect(html).toContain('disabled=""');expect(html).toContain('readOnly=""');
 });
});
