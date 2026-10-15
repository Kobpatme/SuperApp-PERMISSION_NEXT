"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Field, ModuleNav, Notice } from "./common";
import styles from "./workspace.module.css";

const stages = [
  { title: "ออกแบบเส้นทาง", owner: "ทีมออกแบบ", detail: "ระบุโครงการ เส้นทาง จุดต้นทาง–ปลายทาง จำนวนเสา และข้อมูลสายสื่อสาร", documents: "แบบเส้นทางและรายละเอียดสาย" },
  { title: "ตรวจเอกสารและรับงาน", owner: "ทีมขออนุญาต", detail: "ตรวจความครบถ้วนของแบบและข้อมูล ติดต่อหน่วยงานเจ้าของเสา", documents: "แบบเส้นทางและรายการเอกสารประกอบคำขอ" },
  { title: "ยื่นขออนุญาตพาดสาย", owner: "ทีมขออนุญาต", detail: "บันทึกเลขรับเรื่อง วันที่ยื่น และผู้ประสานงาน ติดตามผลจากหน่วยงาน", documents: "หนังสือขออนุญาตและหลักฐานรับเรื่อง" },
  { title: "รับใบอนุญาตและเงื่อนไข", owner: "ทีมขออนุญาต", detail: "ตรวจเงื่อนไขการอนุญาต บันทึกเลขใบอนุญาตและระยะเวลาที่อนุญาต รวมถึงค่าใช้จ่ายตามเอกสารหน่วยงาน", documents: "ใบอนุญาต เงื่อนไข และเอกสารค่าใช้จ่ายถ้ามี" },
  { title: "ยืนยันแบบก่อนติดตั้ง", owner: "ทีมออกแบบ", detail: "ตรวจแบบให้ตรงกับเงื่อนไขใบอนุญาต แล้วส่งมอบงานให้ทีมติดตั้ง", documents: "แบบที่ได้รับอนุญาตและใบส่งมอบงาน" },
  { title: "ติดตั้งและบันทึกผล", owner: "ทีมติดตั้ง", detail: "ดำเนินงานตามใบอนุญาต บันทึกระยะทาง จำนวนเสา และข้อมูลสายที่ติดตั้งจริง", documents: "ภาพหน้างานและแบบหลังติดตั้ง" },
  { title: "ตรวจรับและปิดงาน", owner: "ทีมขออนุญาต / ทีมติดตั้ง", detail: "ตรวจเอกสารปิดงานและเงื่อนไขคงค้าง เก็บข้อมูลอ้างอิงสำหรับดูแลสัญญาต่อไป", documents: "หลักฐานตรวจรับและเอกสารปิดงาน" },
] as const;

export function CommunicationCableWorkspace() {
  const [authority, setAuthority] = useState("PEA");
  const [step, setStep] = useState(0);
  const [revision, setRevision] = useState(false);
  const stage = stages[step];
  return <div className={styles.workspace}>
    <PageHeader title="พาดสายสื่อสาร" description="ร่างขั้นตอนขอพาดสายกับการไฟฟ้าส่วนภูมิภาคและการไฟฟ้านครหลวง" />
    <ModuleNav current="communication-cable" />
    <Notice text="แบบร่างสำหรับทบทวนโฟลว์ — ทดลองเลือกขั้นตอนได้ ยังไม่บันทึกคำขอหรือส่งข้อมูลให้หน่วยงาน" />
    <div className={styles.toolbar}>
      <Field label="หน่วยงานที่ติดต่อ"><select value={authority} onChange={event => setAuthority(event.target.value)}><option value="PEA">PEA · การไฟฟ้าส่วนภูมิภาค</option><option value="MEA">MEA · การไฟฟ้านครหลวง</option></select></Field>
      <button className={styles.button} type="button" onClick={() => { setStep(0); setRevision(false); }}>เริ่มทดลองใหม่</button>
    </div>
    <div className={styles.flowLayout}>
      <section className={styles.panel} aria-labelledby="cable-flow-title">
        <h2 id="cable-flow-title">ลำดับงานที่เสนอ</h2>
        <ol className={styles.flowList}>{stages.map((item, index) => <li key={item.title}><button className={`${styles.button} ${index === step ? styles.current : ""}`} type="button" aria-current={index === step ? "step" : undefined} onClick={() => { setStep(index); setRevision(false); }}>{index + 1}. {item.title}</button><span className={styles.muted}>{item.owner}</span></li>)}</ol>
      </section>
      <section className={styles.panel} aria-labelledby="cable-stage-title">
        <p className={styles.muted}>ตัวอย่างขั้นตอน · {authority} · {step + 1}/{stages.length}</p>
        <h2 id="cable-stage-title">{revision ? "ส่งกลับแก้ไขแบบ / เอกสาร" : stage.title}</h2>
        <p>{revision ? "บันทึกเหตุผลจากหน่วยงาน ให้ทีมออกแบบแก้ไขแบบและทีมขออนุญาตตรวจเอกสาร ก่อนยื่นใหม่" : stage.detail}</p>
        <dl className={styles.flowDetails}><div><dt>ผู้รับผิดชอบที่เสนอ</dt><dd>{revision ? "ทีมออกแบบ / ทีมขออนุญาต" : stage.owner}</dd></div><div><dt>เอกสารที่เสนอ</dt><dd>{revision ? "เหตุผลที่ต้องแก้ไขและแบบฉบับปรับปรุง" : stage.documents}</dd></div></dl>
        <div className={styles.actions}>
          <button className={styles.button} type="button" disabled={step === 0 || revision} onClick={() => setStep(step - 1)}>ขั้นก่อนหน้า</button>
          {revision ? <button className={styles.primary} type="button" onClick={() => { setRevision(false); setStep(2); }}>ทดลองยื่นใหม่หลังแก้ไข</button> : step < stages.length - 1 ? <button className={styles.primary} type="button" onClick={() => setStep(step + 1)}>ทดลองขั้นถัดไป</button> : <span role="status">สิ้นสุดโฟลว์ตัวอย่าง</span>}
          {step === 2 && !revision && <button className={styles.button} type="button" onClick={() => setRevision(true)}>ทดลองกรณีให้แก้ไข</button>}
        </div>
        <p className={styles.muted} aria-live="polite">กำลังดู: {revision ? "แก้ไขแบบ / เอกสาร → ยื่นขออนุญาตใหม่" : stage.title}</p>
      </section>
    </div>
    <section className={styles.panel} aria-labelledby="cable-review-title"><h2 id="cable-review-title">รายละเอียดที่จะปรับร่วมกัน</h2><p>ช่องทางยื่นของ PEA/MEA แบบฟอร์มที่ใช้ ผู้อนุมัติ ระยะเวลาดำเนินงาน อัตราค่าบริการและเงินประกัน รวมถึงเงื่อนไขต่อสัญญาหรือยกเลิก จะกำหนดหลังทบทวนโฟลว์นี้</p><p className={styles.muted}>เมนูต่อสัญญาและงานลงนามปัจจุบันยังใช้กับงานเช่าท่อ งานพาดสายยังไม่เชื่อมเข้าคิวเหล่านั้น</p></section>
  </div>;
}
