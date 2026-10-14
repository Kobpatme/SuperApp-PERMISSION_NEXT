# หลักฐาน control และ handler ต้นทาง

> Native coverage 14/10/2569: source controls 403 attributes/24 files ใช้เป็นบัญชีเทียบฟอร์ม/handler Native mappings คือ RequestForm (new/edit/design), RequestWorkspace (9 action phases/missing docs), FileList/AttachmentPicker/PdfViewer (private previews), SignatureWorkspace (assets/position/sign), ProcessWorkspace (annual/cancel), TrackingWorkspace และ Core inbox รายละเอียด [05](05-screen-and-ux-map.md) / [07](07-parity-matrix.md)
>
> Browser ตรวจ full NT/non-NT, signature page 4, annual keep/drop/stages/private contract, cancellation, notes draft preservation, keyboard modal, mobile/dark, offline และ permissions/session Module disable ยังไม่ยืนยันทุก attribute ด้วย browser assertion แยก ไม่มี Source app screenshot comparison; มี actual frozen PDF reference และ Core before/after 13 คู่


รายการสกัด AST จาก source SHA เดียวกับ 08 เก็บชื่อ label/placeholder/disabled/handler ตามโค้ดเพื่อใช้แตก test cases ไม่ใช่ผล browser QA; ข้อความ JSX ที่ไม่ได้อยู่ใน attribute ต้องตรวจผ่านหน้าจออีกครั้ง

## app/(dashboard)/dashboard/duct-rental/[id]/3rdparty/page.tsx

ฟังก์ชัน: RORow:34, AutoSaveFileZone:44, ThirdPartyPage:71, handleDataChange:115, getRateNoticeData:128, uploadSelectedFiles:136, handleSaveDraft:147, handleSubmit:162

- `49:inputId={'fz-${label.replace(/\s/g, "-")}'}`
- `50:label={label}`
- `54:disabled={disabled}`
- `251:disabled={!canAccept}`
- `275:label="ชื่อโครงการ"`
- `276:label="เส้นทาง"`
- `279:label="Owner Duct"`
- `280:label="ชนิดสาย"`
- `281:label="Fiber Type"`
- `282:label="ระยะ (m)"`
- `311:placeholder="0.00"`
- `321:placeholder="0.00"`
- `353:label="หนังสือแจ้งอัตรา"`
- `353:disabled={!canSubmit}`
- `354:label="ใบแจ้งค่าใช้บริการ"`
- `354:disabled={!canSubmit}`
- `357:label="ฉบับลงนาม (ถ้ามี)"`
- `357:disabled={!canSubmit}`
- `363:aria-label="สถานะเอกสารที่บันทึกไว้"`
- `381:placeholder="บันทึกข้อมูลเพิ่มเติม... (บันทึกอัตโนมัติ)"`
- `405:disabled={status !== "accepted" || !canSubmit || savingDraft || submitting || (!hasUnsavedFiles && !monthlyFee && !yearlyFee && !notes)}`
- `414:disabled={status !== "accepted" || !canSubmit || !hasRequiredFiles || submitting}`

เงื่อนไขที่พบ:

- `97:!req`
- `138:rateNoticeFile`
- `139:invoiceFile`
- `140:signedFile`
- `163:hasRequiredFiles && (!rateNoticeFile || !invoiceFile)`
- `180:!rateNoticeFile || !invoiceFile`
- `188:signedFile`

## app/(dashboard)/dashboard/duct-rental/[id]/contract/page.tsx

ฟังก์ชัน: RORow:32, ContractPage:41, handleGuaranteeChange:77, handleSubmit:96

- `167:disabled={!canAccept}`
- `208:inputId="contract-upload"`
- `209:label="เอกสารสัญญาเข้าระบบ (PDF)"`
- `213:disabled={!canSubmit}`
- `226:label="ค่าใช้บริการ ต่อเดือน"`
- `227:label="ค่าใช้บริการ ต่อปี"`
- `230:label="วันที่เริ่มสัญญา"`
- `231:label="วันที่สิ้นสุดสัญญา"`
- `238:placeholder="ระบุเลขที่สัญญา..."`
- `242:placeholder="0.00"`
- `254:disabled={!canSubmit}`
- `270:disabled={!canSubmit}`
- `280:placeholder="ระบุเลขใบเสร็จ..."`
- `287:inputId="receipt-upload"`
- `288:label="แนบใบเสร็จ / BG (PDF)"`
- `292:disabled={!canSubmit}`
- `322:disabled={status !== "accepted" || !canSubmit || !contractFile || !hasRequiredGuarantee || hasIncompleteDocs || submitting}`

เงื่อนไขที่พบ:

- `64:!req`
- `97:!contractFile`
- `98:!hasRequiredGuarantee`
- `99:hasIncompleteDocs`
- `107:receiptFile`

## app/(dashboard)/dashboard/duct-rental/[id]/design/page.tsx

ฟังก์ชัน: ROField:28, DesignDetailPage:39, handleDownloadPDF:47, handleDownloadNTForm:59, handleGenerateAndSaveNTForm:71

- `123:disabled={isSavingNT}`
- `132:disabled={isGeneratingNT}`
- `141:disabled={isGenerating}`
- `157:label="ประเภทคำขอ"`
- `158:label="ชื่อโครงการ"`
- `161:label="ชื่อเส้นทาง / ถนน"`
- `162:label="Owner Duct"`
- `163:label="Service Center"`
- `166:label="รายละเอียดเส้นทาง"`
- `169:label="ประเภทของงาน"`
- `170:label="รองรับ / Support"`
- `176:label="ชนิดสาย"`
- `177:label="Fiber Type"`
- `178:label="ไดมิตเตอร์ (mm)"`
- `179:label="ระยะ (m)"`
- `182:label="พิกัดต้นทาง"`
- `183:label="พิกัดปลายทาง"`
- `186:label="ตำบล"`
- `187:label="อำเภอ / เขต"`
- `188:label="จังหวัด"`
- `189:label="UIH Area / Contract"`
- `200:label="ชื่อ-สกุล"`
- `201:label="โทรศัพท์"`
- `202:label="อีเมล"`
- `210:label="ชื่อ-สกุล"`
- `211:label="โทรศัพท์"`
- `212:label="อีเมล"`

เงื่อนไขที่พบ:

- `85:!req`

## app/(dashboard)/dashboard/duct-rental/[id]/draftsman/page.tsx

ฟังก์ชัน: ROField:34, DraftsmanPage:47, handleAccept:93, handleSaveDrawing:97, handleSubmit:119

- `225:disabled={!canAccept}`
- `251:label="ชื่อโครงการ"`
- `252:label="ชื่อเส้นทาง / ถนน"`
- `255:label="Owner Duct"`
- `256:label="ประเภทงาน"`
- `257:label="Service Center"`
- `260:label="รายละเอียดเส้นทาง"`
- `263:label="ประเภทคำขอ"`
- `264:label="เลขที่ Memo"`
- `265:label="รองรับ / Support"`
- `272:label="ชนิดสาย"`
- `273:label="Fiber Type"`
- `274:label="จำนวนสาย"`
- `275:label="ไดมิตเตอร์ (mm)"`
- `278:label="ระยะทาง (m)"`
- `279:label="ตำบล"`
- `280:label="อำเภอ / เขต"`
- `283:label="จังหวัด"`
- `284:label="รหัสไปรษณีย์"`
- `285:label="UIH Area / Contract"`
- `288:label="พิกัดต้นทาง"`
- `289:label="พิกัดปลายทาง"`
- `315:inputId="drawing-upload"`
- `316:label="คลิกหรือลากไฟล์ Drawing มาวางที่นี่"`
- `320:disabled={!canSubmit}`
- `338:disabled={!canSubmit || !drawingFile || submitting}`
- `347:disabled={status !== "accepted" || !canSubmit || submitting}`

เงื่อนไขที่พบ:

- `69:!req`
- `94:canAccept`
- `98:!drawingFile`
- `102:shouldSkipToRateNotice && status === "accepted"`
- `120:!drawingFile && !hasSavedDrawing`
- `123:drawingFile`

## app/(dashboard)/dashboard/duct-rental/[id]/draftsman2/page.tsx

ฟังก์ชัน: RORow:34, AutoSaveFileZone:44, handleDrop:63, Draftsman2Page:116, handleNotesChange:151, handleSubmit:162

- `52:inputId={'fz-${label.replace(/\s/g, "-")}'}`
- `53:label={label}`
- `57:disabled={disabled}`
- `235:disabled={!canAccept}`
- `259:label="ชื่อโครงการ"`
- `260:label="เส้นทาง"`
- `263:label="ระยะออกแบบ (m)"`
- `264:label="ระยะจริง (m)"`
- `265:label="วันที่ติดตั้ง"`
- `268:label="พิกัดต้นทางจริง"`
- `269:label="พิกัดปลายทางจริง"`
- `295:label="CAD File"`
- `295:disabled={!canSubmit}`
- `296:label="PDF File"`
- `296:disabled={!canSubmit}`
- `297:label="KMZ File"`
- `297:disabled={!canSubmit}`
- `309:placeholder="บันทึกข้อมูลเพิ่มเติม... (บันทึกอัตโนมัติ)"`
- `334:disabled={status !== "accepted" || !canSubmit || !hasRequiredFiles || submitting}`

เงื่อนไขที่พบ:

- `49:acceptExt === ".pdf"`
- `66:!f`
- `68:ext === acceptExt`
- `78:disabled`
- `137:!req`
- `163:!pdfFile`

## app/(dashboard)/dashboard/duct-rental/[id]/edit/page.tsx

ฟังก์ชัน: FileZone:39, EditRequestPage:65, onUpdate:147, onSubmitAndProgress:166, handleConfirmSubmit:171

- `54:inputId={'fz-${label}'}`
- `55:label={label}`
- `59:disabled={disabled}`
- `230:label="ประเภทคำขอ"`
- `230:required`
- `235:label="ชื่อโครงการ"`
- `235:required`
- `236:placeholder="กรุณาระบุชื่อโครงการ..."`
- `240:label="ชื่อเส้นทาง / ถนน"`
- `240:required`
- `241:placeholder="กรุณาระบุชื่อเส้นทาง / ถนน..."`
- `243:label="Owner Duct"`
- `243:required`
- `248:label="Service Center"`
- `248:required`
- `256:label="รายละเอียดเส้นทาง"`
- `256:required`
- `257:placeholder="กรุณาระบุรายละเอียดเส้นทาง..."`
- `261:label="ประเภทของงาน"`
- `261:required`
- `266:label="รองรับ / Support"`
- `267:placeholder="กรุณาระบุข้อมูลรองรับ / Support (ถ้ามี)..."`
- `274:label="ชนิดสาย"`
- `274:required`
- `280:label="Fiber Type"`
- `280:required`
- `281:disabled={fiberTypeOptions.length === 0}`
- `290:label="ไดมิตเตอร์ (mm)"`
- `290:required`
- `291:placeholder="0.00"`
- `293:label="ระยะโดยประมาณ (m.)"`
- `293:required`
- `294:placeholder="0.00"`
- `298:label="พิกัดต้นทาง"`
- `298:required`
- `299:placeholder="0.000000, 0.000000"`
- `301:label="พิกัดปลายทาง"`
- `301:required`
- `302:placeholder="0.000000, 0.000000"`
- `306:label="ตำบล"`
- `307:placeholder="ระบุตำบล..."`
- `309:label="อำเภอ / เขต"`
- `309:required`
- `310:placeholder="กรุณาระบุอำเภอ / เขต..."`
- `312:label="จังหวัด"`
- `312:required`
- `313:placeholder="กรุณาระบุจังหวัด..."`
- `315:label="UIH Area / Contract"`
- `316:placeholder="ระบุ UIH Area..."`
- `328:label="ชื่อ-สกุล"`
- `329:label="โทรศัพท์"`
- `329:placeholder="ระบุเบอร์โทรศัพท์..."`
- `330:label="อีเมล"`
- `330:placeholder="ระบุอีเมล..."`
- `338:label="ชื่อ-สกุล"`
- `338:placeholder="ระบุชื่อ-สกุล..."`
- `339:label="โทรศัพท์"`
- `339:placeholder="ระบุเบอร์โทรศัพท์..."`
- `340:label="อีเมล"`
- `340:placeholder="ระบุอีเมล..."`
- `348:label="Memo PDF (ใหม่)"`
- `349:label="แนบ Memo"`
- `351:label="แบบท่อ PDF (ใหม่)"`
- `352:label="แนบแบบท่อ"`
- `364:disabled={saving}`
- `368:disabled={saving}`

เงื่อนไขที่พบ:

- `89:req?.designData`
- `95:!selectedCableType`
- `101:!options.some((option) => option.fiberType === selectedFiberType)`
- `108:diameter !== undefined`
- `113:!req`
- `133:!canEdit`
- `151:memoFile`
- `152:ductFile`
- `172:!pendingSubmitData`
- `177:memoFile`
- `178:ductFile`
- `186:supaErr?.code === "42501"`

## app/(dashboard)/dashboard/duct-rental/[id]/install/page.tsx

ฟังก์ชัน: RORow:39, InstallPage:50, handleSaveOnly:98, onSubmit:117

- `180:disabled={!canAccept}`
- `202:label="ชื่อโครงการ"`
- `203:label="ชื่อเส้นทาง"`
- `206:label="ชนิดสาย"`
- `207:label="Fiber Type"`
- `208:label="ไดมิตเตอร์ (mm)"`
- `209:label="ระยะออกแบบ (m)"`
- `235:label="พิกัดต้นทางจริง"`
- `235:required`
- `236:placeholder="0.000000, 0.000000"`
- `238:label="พิกัดปลา·างจริง"`
- `238:required`
- `239:placeholder="0.000000, 0.000000"`
- `243:label="ระยะทางจริง (m)"`
- `243:required`
- `244:placeholder="0.00"`
- `246:label="Mark length (ML)"`
- `246:required`
- `247:placeholder="xx.xx - xx.xx"`
- `249:label="วันที่ติดตั้ง"`
- `249:required`
- `254:label="ชื่อผู้ควบคุมงาน"`
- `255:placeholder="ระบุชื่อผู้ควบคุมงาน..."`
- `259:label="หมายเหตุ / บันทึกหน้างาน"`
- `260:placeholder="ระบุหมายเหตุ หรือบันทึกหน้างาน..."`
- `268:inputId="install-confirm"`
- `269:label="แบบยืนยันการใช้งาน หลังติดตั้งเสร็จ"`
- `273:disabled={!canSubmit}`
- `289:disabled={!canSubmit || submitting}`
- `296:disabled={status !== "accepted" || !canSubmit || submitting}`

เงื่อนไขที่พบ:

- `69:req?.installData`
- `83:!req`
- `103:confirmFile`
- `118:!confirmFile && !hasSavedConfirmation`
- `122:confirmFile`

## app/(dashboard)/dashboard/duct-rental/[id]/missing-docs/page.tsx

ฟังก์ชัน: MissingDocsPage:17, handleSave:43, ChevronRight:153

- `91:inputId="memo-upload"`
- `92:label="คลิกเพื่อประกอบไฟล์ Memo PDF"`
- `111:label="รายการที่ยังไม่ครบ / สิ่งที่ต้องติดตาม"`
- `113:placeholder="ระบุรายการ..."`
- `117:disabled={!canEdit || saving}`
- `134:disabled={saving}`
- `142:disabled={!canEdit || saving}`

เงื่อนไขที่พบ:

- `30:!req`
- `47:memoFile`

## app/(dashboard)/dashboard/duct-rental/[id]/permission/page.tsx

ฟังก์ชัน: RORow:54, getLatestFileByType:63, formatRequestDate:73, Permission1Page:90, handleMessage:158, handleStorage:165, handleGeneratePreview:219, handleConfirmAndSave:249, handleSaveSigner:285, handleRevokeSignoff:321, handleSubmit:343

- `401:aria-label="งานลงนามที่ได้รับมอบหมาย"`
- `420:disabled={!canAccept}`
- `441:label="Project"`
- `442:label="Route"`
- `443:label="Created Date"`
- `446:label="Owner Duct"`
- `447:label="Job Type"`
- `448:label="Service Center"`
- `451:label="Cable Type"`
- `452:label="Fiber Type"`
- `453:label="Diameter (mm)"`
- `454:label="Distance (m)"`
- `507:aria-label="ลำดับการจัดทำและลงนาม"`
- `534:disabled={savingSigner}`
- `600:disabled={isRevokingSigned}`
- `647:label="เลขที่หนังสือคำขออนุญาต"`
- `649:placeholder="ระบุเลขที่หนังสือ..."`
- `659:disabled={isGeneratingPreview}`
- `682:inputId="perm-file"`
- `683:label="Permission letter (PDF)"`
- `687:disabled={!canUploadResponseDocs}`
- `694:inputId="confirm-file"`
- `695:label="Confirmation form (PDF)"`
- `699:disabled={!canUploadResponseDocs}`
- `730:disabled={status !== "accepted" || !canSubmit || !ntFormFile || !isSigned || !permissionFile || !confirmFile || submitting}`
- `779:disabled={isSavingPDF}`
- `786:disabled={isSavingPDF}`

เงื่อนไขที่พบ:

- `74:!value`
- `81:Number.isNaN(date.getTime())`
- `128:previewUrl`
- `133:!req?.permission1Signoff?.assignedSignerId`
- `141:!isAdmin`
- `149:error`
- `159:event.origin !== window.location.origin`
- `160:event.data?.type === "permission1-signed" && event.data?.requestId === id`
- `166:!event.key?.startsWith("pdf-preview-result:") || !event.newValue`
- `169:data.type === "permission1-signed" && data.requestId === id`
- `185:!req`
- `220:!req?.designData`
- `224:!permissionNum.trim()`
- `250:!req?.designData`
- `264:assignedSignerId && permission1Signoff?.assignedSignerName`
- `273:previewUrl`
- `286:!isAdmin`
- `295:signer && ntFormFile`
- `322:!isAdmin`
- `326:assignedSignerId && permission1Signoff?.assignedSignerName`
- `344:!permissionFile || !confirmFile`
- `348:!ntFormFile`
- `352:!isSigned`
- `758:previewUrl`
- `775:previewUrl`

## app/(dashboard)/dashboard/duct-rental/[id]/permission2/page.tsx

ฟังก์ชัน: RORow:27, Permission2Page:36, handleSend:60

- `103:disabled={!canAccept}`
- `131:label="ชื่อโครงการ"`
- `132:label="ชื่อเส้นทาง"`
- `135:label="Owner Duct"`
- `136:label="ชนิดสาย"`
- `137:label="Fiber Type"`
- `138:label="ระยะออกแบบ (m)"`
- `146:label="ระยะทางจริง (m)"`
- `147:label="จำนวนท่อ"`
- `148:label="วันที่ติดตั้ง"`
- `151:label="พิกัดต้นทางจริง"`
- `152:label="พิกัดปลายทางจริง"`
- `155:label="บันทึกหน้างาน"`
- `190:disabled={status !== "accepted" || !canSubmit || sending}`

เงื่อนไขที่พบ:

- `50:!req`

## app/(dashboard)/dashboard/duct-rental/[id]/permission3/page.tsx

ฟังก์ชัน: Permission3Page:29, handleSubmit:55

- `103:disabled={!canAccept}`
- `144:inputId="payment-upload"`
- `145:label="เอกสาร Payment (PDF)"`
- `149:disabled={!canSubmit}`
- `167:disabled={status !== "accepted" || !canSubmit || !paymentFile || submitting}`

เงื่อนไขที่พบ:

- `43:!req`
- `56:!paymentFile`

## app/(dashboard)/dashboard/duct-rental/cancellation/[id]/page.tsx

ฟังก์ชัน: getCancelActionLabel:30, RORow:37, CancellationDetailPage:48, handleApprove:79, handleDelete:99, handleReject:112

- `180:label="ชื่อโครงการ"`
- `181:label="เส้นทาง / ถนน"`
- `182:label="เจ้าของท่อ"`
- `183:label="Service Center"`
- `184:label="จังหวัด"`
- `185:label="อำเภอ / เขต"`
- `213:label="วันที่มีผล"`
- `214:label="ผู้ขอยกเลิก"`
- `291:placeholder="หมายเหตุ (ถ้ามี)..."`
- `302:disabled={processing}`
- `310:disabled={processing}`
- `423:disabled={processing}`
- `428:disabled={processing}`
- `456:disabled={processing}`
- `462:disabled={processing}`

เงื่อนไขที่พบ:

- `31:status === "cancel_initiated" || status === "pending"`
- `32:status === "in_progress"`
- `33:status === "tracking"`
- `80:!record`
- `83:record.status === "cancel_initiated" || record.status === "pending"`
- `85:record.status === "in_progress"`
- `87:record.status === "tracking"`
- `113:!record`
- `126:!record`

## app/(dashboard)/dashboard/duct-rental/cancellation/new/page.tsx

ฟังก์ชัน: CancellationNewPage:14, handleSubmit:45

- `124:placeholder="ค้นหาโครงการ, เส้นทาง หรือ ID..."`
- `193:label="วันที่มีผล (Effective Date)"`
- `193:required`
- `200:label="เส้นทางที่ยกเลิก"`
- `204:label="เหตุผลการยกเลิก"`
- `204:required`
- `206:placeholder="กรุณาระบุเหตุผลในการขอยกเลิกใช้งานท่อเส้นทางนี้..."`
- `212:label="หมายเหตุเพิ่มเติม"`
- `214:placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)..."`
- `257:disabled={!selectedReq || !reason.trim() || !effectiveDate || submitting}`

เงื่อนไขที่พบ:

- `46:!selectedReq || !reason.trim() || !effectiveDate`
- `47:!user?.displayName && !user?.email`
- `77:!canCreate`

## app/(dashboard)/dashboard/duct-rental/new/page.tsx

ฟังก์ชัน: normalizeLookupValue:38, NewRequestPage:54, registerTwoDecimalField:216, onBlur:220, onSubmit:261, onSaveDraft:287

- `336:label="ชื่อโครงการ"`
- `336:required`
- `337:placeholder="กรุณาระบุชื่อโครงการ..."`
- `341:label="ชื่อเส้นทาง / ถนน"`
- `341:required`
- `342:placeholder="กรุณาระบุชื่อเส้นทาง / ถนน..."`
- `344:label="Owner Duct"`
- `344:required`
- `345:disabled={!canSubmit}`
- `349:label="เลข MEMO"`
- `350:placeholder="ระบุเลข MEMO..."`
- `352:label="Service Center"`
- `352:required`
- `353:disabled={!canSubmit}`
- `360:label="รายละเอียดเส้นทาง"`
- `360:required`
- `361:placeholder="กรุณาระบุรายละเอียดเส้นทาง..."`
- `365:label="ประเภทของงาน"`
- `365:required`
- `366:disabled={!canSubmit}`
- `370:label="รองรับ / Support"`
- `371:placeholder="กรุณาระบุข้อมูลรองรับ / Support (ถ้ามี)..."`
- `379:label="ชนิดสาย"`
- `379:required`
- `380:disabled={!canSubmit}`
- `385:label="Fiber Type"`
- `385:required`
- `386:disabled={!canSubmit || fiberTypeOptions.length === 0}`
- `395:label="ไดมิตเตอร์ (mm)"`
- `395:required`
- `396:placeholder="0.00"`
- `398:label="ระยะโดยประมาณ (m.)"`
- `398:required`
- `399:placeholder="0.00"`
- `401:label="ระบุจำนวนสาย"`
- `402:placeholder="0"`
- `406:label="พิกัดต้นทาง"`
- `406:required`
- `407:placeholder="0.000000, 0.000000"`
- `409:label="พิกัดปลายทาง"`
- `409:required`
- `410:placeholder="0.000000, 0.000000"`
- `414:label="ตำบล"`
- `415:placeholder="ระบุตำบล..."`
- `417:label="อำเภอ / เขต"`
- `417:required`
- `418:placeholder="กรุณาระบุอำเภอ / เขต..."`
- `420:label="จังหวัด"`
- `420:required`
- `421:placeholder="กรุณาระบุจังหวัด..."`
- `423:label="รหัสไปรษณีย์"`
- `424:placeholder="00000"`
- `426:label="UIH Area / Contract"`
- `427:placeholder="ระบุ UIH Area..."`
- `441:label="ชื่อ-สกุล"`
- `441:placeholder="ระบุชื่อ-สกุล..."`
- `442:label="โทรศัพท์"`
- `442:placeholder="ระบุเบอร์โทรศัพท์..."`
- `443:label="อีเมล"`
- `443:placeholder="ระบุอีเมล..."`
- `459:disabled={!canSubmit}`
- `470:label="ชื่อ-สกุล"`
- `470:placeholder="เลือก Service Center เพื่อดึงข้อมูลทีม INSTALL..."`
- `471:label="โทรศัพท์"`
- `471:placeholder="ข้อมูลทีม INSTALL จะขึ้นอัตโนมัติ"`
- `472:label="อีเมล"`
- `472:placeholder="ข้อมูลทีม INSTALL จะขึ้นอัตโนมัติ"`
- `481:label="Memo PDF"`
- `482:inputId="new-request-memo"`
- `482:label="แนบ Memo"`
- `482:disabled={!canSubmit}`
- `484:label="แบบท่อ PDF"`
- `485:inputId="new-request-duct"`
- `485:label="แนบแบบท่อ"`
- `485:disabled={!canSubmit}`
- `505:disabled={saving || !canSubmit}`
- `508:disabled={saving || !canSubmit}`
- `515:aria-label="ภาพรวมการสร้างคำขอ"`
- `530:aria-label="หัวข้อในแบบฟอร์ม"`

เงื่อนไขที่พบ:

- `83:user || currentUser`
- `87:stored`
- `133:!selectedServiceCenter`
- `171:fallbackProfiles.length === 0`
- `188:!selectedInstallCoordinatorId || installCoordinators.length === 0`
- `198:!selectedCableType`
- `204:!options.some((option) => option.fiberType === selectedFiberType)`
- `211:diameter !== undefined`
- `223:!rawValue`
- `226:!Number.isNaN(parsed)`
- `238:!isAuthorized`
- `267:memoFile`
- `268:ductFile`
- `277:supaErr?.code === "42501"`

## app/(dashboard)/dashboard/duct-rental/page.tsx

ฟังก์ชัน: ModuleListPage:51, isDocsIncomplete:78, getWorkflowStatus:84, showWaitingJobs:203, showMissingDocuments:213, resetFilters:223, handleDeleteRequest:232, handleAcceptJob:250, getRequestHref:267



เงื่อนไขที่พบ:

- `79:request.missingDocs`
- `80:request.currentPhase === "DESIGN"`
- `85:request.cancelledAt`
- `86:request.currentPhase === "COMPLETE"`
- `126:request.cancelledAt`
- `233:userRole !== "admin" || isDeleting`
- `234:userRole !== "admin"`
- `252:!request`
- `253:!currentUserId || !canAcceptPhase(currentUserId, request.currentPhase)`
- `258:!accepted`

## app/(dashboard)/dashboard/duct-rental/renewal/[year]/page.tsx

ฟังก์ชัน: RouteCard:32, RenewalYearPage:174, handleRouteUpdate:205, handleSubmitForApproval:210, handleStartMemo:223, handleConfirmProvider:236, handleDelete:251, handleSaveContract:264

- `131:placeholder="หมายเหตุ (ถ้ามี)..."`
- `400:disabled={!allReviewed || processing}`
- `429:disabled={processing}`
- `451:disabled={processing}`
- `469:disabled={processing}`
- `509:placeholder="CONTRACT-XXXX-YYYY"`
- `517:inputId="contract-file-input"`
- `518:label="อัปโหลดสัญญา PDF"`
- `531:placeholder="หมายเหตุจาก 3rd Party (ถ้ามี)..."`
- `541:disabled={processing}`
- `696:disabled={processing}`
- `701:disabled={processing}`

เงื่อนไขที่พบ:

- `206:!renewal`
- `211:!renewal`
- `224:!renewal`
- `237:!renewal`
- `265:!renewal`
- `269:contractFile`
- `289:!renewal`

## app/(dashboard)/dashboard/duct-rental/renewal/page.tsx

ฟังก์ชัน: getStatusConfig:20, RenewalListPage:23, handleDelete:50, handleCreateRenewal:63

- `139:disabled={creating || activeRoutes.length === 0}`
- `321:disabled={deleting}`
- `326:disabled={deleting}`

เงื่อนไขที่พบ:

- `64:nextYearExists`

## app/pdf-preview/page.tsx

ฟังก์ชัน: readFileAsDataUrl:44, formatDateInput:53, clampPlacementValue:66, formatOffset:70, buildPdfViewerSrc:75, PdfPreviewContent:89, loadRequest:150, buildPreview:235, broadcastPreviewResult:273, handleConfirm:291, handleClose:296, handleSignatureUpload:303, resetPlacement:319, moveStamp:333, resizeStamp:358, handleSignPermission1:365, PdfPreviewPage:890

- `430:aria-label="ขั้นตอนการลงนาม"`
- `440:aria-label="ปิดหน้าลงนาม"`
- `447:aria-label="ตัวอย่างเอกสาร"`
- `458:aria-label="เครื่องมือลงนาม"`
- `504:disabled={signing}`
- `876:disabled={signing}`

เงื่อนไขที่พบ:

- `54:!value`
- `76:!url`
- `151:!requestId || requests[requestId]`
- `152:!cancelled`
- `162:!cancelled`
- `167:!cancelled`
- `171:!cancelled`
- `218:selectedAsset?.id`
- `236:!request || !canSignPermission1 || !selectedAsset?.dataUrl`
- `250:cancelled`
- `261:!cancelled`
- `269:objectUrlToRevoke`
- `274:token`
- `286:window.opener`
- `297:isConfirmMode`
- `305:!inputFile || !currentUser`
- `366:!currentUser || !requestId || !request || !selectedAsset || isSigned`
- `409:!file`
- `417:isPermission1SignoffMode`
- `504:signDisabledReason`
- `870:signDisabledReason`

## components/duct-rental/DuctRentalWorkspace.tsx

ฟังก์ชัน: formatDueDate:136, DuctRentalWorkspace:142

- `247:placeholder="ค้นหาโครงการ เส้นทาง Service Center หรือ Request ID"`
- `248:aria-label="ค้นหาคำขอ"`
- `251:aria-label="ล้างคำค้นหา"`
- `386:aria-label={'แก้ไขคำขอ ${request.id}'}`
- `389:aria-label={'ลบคำขอ ${request.id}'}`
- `409:aria-label="ภาพรวมภาระงาน"`

เงื่อนไขที่พบ:

- `138:Number.isNaN(date.getTime())`

## components/ui/MissingDocsPanel.tsx

ฟังก์ชัน: MissingDocsPanel:13

- `28:aria-label="สถานะเอกสารที่ต้องติดตาม"`

เงื่อนไขที่พบ:

- `16:!req`
- `25:!isIncomplete`

## components/ui/NotificationCenter.tsx

ฟังก์ชัน: isOpenTask:9, formatDueDate:11, NotificationCenter:16, openTask:40

- `53:aria-label={'งานที่ต้องดำเนินการ ${unreadCount} รายการใหม่'}`
- `62:aria-label="ปิดรายการแจ้งเตือน"`
- `63:aria-label="งานที่ต้องดำเนินการ"`

เงื่อนไขที่พบ:

- `12:!value`
- `28:!isOpen || !buttonRef.current`
- `41:!task.read`

## components/ui/PdfUploadZone.tsx

ฟังก์ชัน: createPreviewToken:18, getPreviewStorageKey:24, isPdfPreviewResult:26, PdfUploadZone:37, clearPending:66, handleMessage:75, clearPending:99, handleStorage:108, queueFile:167, reopenPendingPreview:188, clearPendingFile:193, openAttachedPreview:202



เงื่อนไขที่พบ:

- `55:pendingPreviewUrl`
- `61:attachedUrl`
- `67:pendingPreviewUrl`
- `76:event.origin !== window.location.origin`
- `79:!isPdfPreviewResult(data, pendingToken)`
- `81:data.type === "pdf-preview-confirm" && pendingFile`
- `86:data.type === "pdf-preview-cancel"`
- `96:!pendingToken`
- `100:pendingPreviewUrl`
- `109:event.key !== storageKey || !event.newValue`
- `113:!isPdfPreviewResult(data, pendingToken)`
- `115:data.type === "pdf-preview-confirm" && pendingFile`
- `120:data.type === "pdf-preview-cancel"`
- `141:token`
- `150:!url`
- `154:targetWindow && !targetWindow.closed`
- `168:disabled || !file || file.type !== "application/pdf"`
- `172:pendingPreviewUrl`
- `189:!pendingFile || !pendingPreviewUrl || !pendingToken`
- `194:pendingPreviewUrl`
- `203:!value || !attachedUrl`
- `217:disabled`

## components/ui/PhaseTabs.tsx

ฟังก์ชัน: PhaseTabs:37, handlePhaseChange:46

- `52:aria-label="ขั้นตอนการดำเนินงาน"`
- `67:disabled={!isClickable}`

เงื่อนไขที่พบ:

- `47:onPhaseChange`
- `48:requestId && ROUTES[phaseId]`

## components/ui/RequestDetailModal.tsx

ฟังก์ชัน: fmtDateTime:126, fmtRoute:137, phaseOrder:141, sortFiles:146, fileLabel:154, RequestDetailModal:164

- `216:aria-label="ปิดรายละเอียด"`
- `223:aria-label="สถานะงานปัจจุบัน"`
- `236:aria-label={'ความคืบหน้า ${progress}%'}`
- `285:aria-label={'ดู ${file.name}'}`
- `286:aria-label={'ดาวน์โหลด ${file.name}'}`

เงื่อนไขที่พบ:

- `127:!value`
- `155:file.fileType`
- `157:name.includes("memo")`
- `158:name.includes("drawing") || name.includes("แบบ")`
- `159:name.includes("permission") || name.includes("อนุญาต")`
- `160:name.includes("contract") || name.includes("สัญญา")`
- `170:!dialog`
- `171:isOpen && !dialog.open`
- `172:!isOpen && dialog.open`
- `175:!request`
- `202:event.target === event.currentTarget`
