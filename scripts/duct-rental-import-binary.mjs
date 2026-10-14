import { PDFDocument } from "pdf-lib";
export async function verifyImportBinary(bytes, mediaType) {
 const head=bytes.subarray(0,2048), pdf=await PDFDocument.create();
 if(mediaType==="application/pdf" && head.subarray(0,5).toString()==="%PDF-"){const document=await PDFDocument.load(bytes);return document.getPageCount()>0&&document.getPageCount()<=200;}
 if(mediaType==="image/png" && head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){const image=await pdf.embedPng(bytes);return image.width<=4096&&image.height<=4096;}
 if(mediaType==="image/jpeg" && head[0]===255&&head[1]===216&&head[2]===255){const image=await pdf.embedJpg(bytes);return image.width<=4096&&image.height<=4096;}
 if(mediaType==="application/vnd.google-earth.kmz")return head.subarray(0,4).equals(Buffer.from([80,75,3,4]));
 if(mediaType==="application/vnd.google-earth.kml+xml")return head.toString().includes("<kml")&&!/<!DOCTYPE|<!ENTITY/i.test(bytes.toString());
 if(mediaType==="application/octet-stream")return /^AC10\d\d/.test(head.subarray(0,6).toString())||/SECTION|AutoCAD Binary DXF/.test(head.subarray(0,128).toString());
 return false;
}
