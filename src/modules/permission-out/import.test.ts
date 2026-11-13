import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseKml, parseSiteRows, parseSiteWorkbook, parseUpload, unzipFiles, xmlDocument } from "./import";
const headers = Array.from({ length: 70 }, (_, i) => i === 0 ? "Site Code" : i === 21 ? "Total OPEX (Yearly)" : `Column ${i + 1}`);
const row = () => { const cells = Array<string>(70).fill(""); cells[0] = "TEST-001"; cells[5] = "ไซต์จำลอง"; cells[21] = "1200.00"; return cells; };
describe("Total Site source workbook contract", () => {
  it("retains coordinate-less sites, all raw columns and exact annual OPEX privately", () => {
    const result = parseSiteRows(headers, [row()]);
    expect(result[0].data).toMatchObject({ latitude: null, longitude: null, key: "TEST-001" });
    expect(JSON.stringify(result[0].data)).not.toContain("OPEX");
    expect(result[0].privateData).toMatchObject({ opex: "1200.00" });
    expect(Object.keys(result[0].privateData.raw as object)).toHaveLength(70);
  });
  it("rejects duplicate/blank Site Codes and wrong header count", () => {
    expect(() => parseSiteRows(headers, [row(), row()])).toThrow(/ซ้ำ/);
    expect(() => parseSiteRows(headers.slice(0,69), [row()])).toThrow();
    expect(() => parseSiteRows(headers, [Array<string>(70).fill("x").map((s, i) => i ? s : "")])).toThrow();
  });
  it("keeps non-finite/out-of-range coordinates off the map without deleting the site", () => {
    const value = row(); value[11] = "91"; value[12] = "100";
    expect(parseSiteRows(headers, [value])[0].data.latitude).toBeNull();
    value[11] = "13.75"; expect(parseSiteRows(headers, [value])[0].data.latitude).toBe(13.75);
  });
  it("requires the named sheet rather than silently taking the first sheet", () => {
    const files = new Map([["xl/workbook.xml", Buffer.from('<workbook xmlns:r="r"><sheets><sheet name="Other" r:id="rId1"/></sheets></workbook>')]]);
    expect(() => parseSiteWorkbook(files)).toThrow(/Total Site/);
  });
});
describe("KML/KMZ safety and metadata", () => {
  it("parses namespaced tracks, route metadata, valid coordinates and supplied zero poles", () => {
    const kml = '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Placemark><name>ทดสอบ</name><ExtendedData><Data name="poles"><value>0</value></Data></ExtendedData><gx:Track><gx:coord>100 13 0</gx:coord><gx:coord>100.001 13 0</gx:coord></gx:Track></Placemark></kml>';
    expect(parseKml(kml, "test.kml", "pea")[0].data).toMatchObject({ name: "ทดสอบ", poles: 0, coords: [[100,13],[100.001,13]] });
  });
  it("rejects malformed XML, entities and missing geometry", () => {
    expect(() => xmlDocument('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]><x>&a;</x>')).toThrow();
    expect(() => parseKml("<kml/>", "test.kml", "ufm")).toThrow();
    expect(() => xmlDocument("<kml><x></kml>")).toThrow();
  });
  it("validates ZIP paths, expansion sizes and file signatures before import", async () => {
    const zip = new JSZip().file("doc.kml", '<kml><Placemark><LineString><coordinates>100,13 100.001,13</coordinates></LineString></Placemark></kml>');
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    expect(unzipFiles(buffer).size).toBe(1);
    expect((await parseUpload(new File([Uint8Array.from(buffer).buffer], "test.kmz"), "ufm")).rows).toHaveLength(1);
    await expect(parseUpload(new File(["broken"], "test.kmz"), "ufm")).rejects.toThrow();
    const bad = await new JSZip().file("../evil.kml", "bad").generateAsync({ type: "nodebuffer" });
    expect(() => unzipFiles(bad)).toThrow();
  });
});
