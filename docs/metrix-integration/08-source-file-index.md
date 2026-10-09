# บัญชีไฟล์ต้นทางและหลักฐานเชิงโครงสร้าง

ต้นทาง `Kobpatme/METRIX@f87220bf94b765e4896388632c3dbeabb5286510` ตรงกับ remote HEAD ที่ตรวจ 10/10/2569 สำเนา `_discovery_sources/METRIX` อ่านอย่างเดียว

ตรวจทุก TS/TSX/SQL ผ่าน TypeScript AST/รายการไฟล์ Git ด้านล่าง การมีชื่อฟังก์ชันในดัชนีไม่ได้พิสูจน์ว่า runtime ใช้งานได้ ทุก handler ต้องผ่าน golden/integration/browser ใน milestone ที่เกี่ยวข้อง ไม่มีการอ่าน `.env` หรือข้อมูลจริง

| ไฟล์ต้นทาง | บรรทัด | ฟังก์ชัน/จุดตรวจ | ขอบเขต |
|---|---:|---|---|
| `app/(dashboard)/[moduleId]/[requestId]/page.tsx` | 246 | RequestDetailPage:31, onSubmit:84 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/admin/page.tsx` | 1081 | getErrorMessage:38, hasPermission:41, setPermissionEnabled:44, getAuthToken:64, mapProfile:69, AdminPage:82, handleAddUser:113, handleEditUser:160, handleResetPassword:209, handleDeleteUser:234, handleUpdateRole:262 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/communication-cable/page.tsx` | 486 | daysBetween:158, getSlaLabel:163, nextStage:172, StatusPill:178, CommunicationCablePage:188, createRequest:215, updateStage:249 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/documents/page.tsx` | 66 | DocumentsPage:5 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/duct-rental/[id]/3rdparty/page.tsx` | 441 | RORow:34, AutoSaveFileZone:44, ThirdPartyPage:71, handleDataChange:115, getRateNoticeData:128, uploadSelectedFiles:136, handleSaveDraft:147, handleSubmit:162 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/contract/page.tsx` | 353 | RORow:32, ContractPage:41, handleGuaranteeChange:77, handleSubmit:96 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/design/page.tsx` | 247 | ROField:28, DesignDetailPage:39, handleDownloadPDF:47, handleDownloadNTForm:59, handleGenerateAndSaveNTForm:71 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/draftsman/page.tsx` | 366 | ROField:34, DraftsmanPage:47, handleAccept:93, handleSaveDrawing:97, handleSubmit:119 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/draftsman2/page.tsx` | 362 | RORow:34, AutoSaveFileZone:44, handleDrop:63, Draftsman2Page:116, handleNotesChange:151, handleSubmit:162 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/edit/page.tsx` | 395 | FileZone:39, EditRequestPage:65, onUpdate:147, onSubmitAndProgress:166, handleConfirmSubmit:171 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/install/page.tsx` | 323 | RORow:39, InstallPage:50, handleSaveOnly:98, onSubmit:117 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/missing-docs/page.tsx` | 163 | MissingDocsPage:17, handleSave:43, ChevronRight:153 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/permission/page.tsx` | 800 | RORow:54, getLatestFileByType:63, formatRequestDate:73, Permission1Page:90, handleMessage:158, handleStorage:165, handleGeneratePreview:219, handleConfirmAndSave:249, handleSaveSigner:285, handleRevokeSignoff:321, handleSubmit:343 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/permission2/page.tsx` | 215 | RORow:27, Permission2Page:36, handleSend:60 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/[id]/permission3/page.tsx` | 194 | Permission3Page:29, handleSubmit:55 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/cancellation/[id]/page.tsx` | 475 | getCancelActionLabel:30, RORow:37, CancellationDetailPage:48, handleApprove:79, handleDelete:99, handleReject:112 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/cancellation/new/page.tsx` | 322 | CancellationNewPage:14, handleSubmit:45 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/new/page.tsx` | 550 | normalizeLookupValue:38, NewRequestPage:54, registerTwoDecimalField:216, onBlur:220, onSubmit:261, onSaveDraft:287 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/page.tsx` | 337 | ModuleListPage:51, isDocsIncomplete:78, getWorkflowStatus:84, showWaitingJobs:203, showMissingDocuments:213, resetFilters:223, handleDeleteRequest:232, handleAcceptJob:250, getRequestHref:267 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/renewal/[year]/page.tsx` | 715 | RouteCard:32, RenewalYearPage:174, handleRouteUpdate:205, handleSubmitForApproval:210, handleStartMemo:223, handleConfirmProvider:236, handleDelete:251, handleSaveContract:264 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/duct-rental/renewal/page.tsx` | 339 | getStatusConfig:20, RenewalListPage:23, handleDelete:50, handleCreateRenewal:63 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `app/(dashboard)/dashboard/licenses/page.tsx` | 51 | LicensesPage:5 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/page.tsx` | 218 | Metric:53, requestHref:66, formatActivityDate:70, DashboardPage:82 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/profile/page.tsx` | 717 | readCachedUser:85, updateCachedProfile:98, getInitials:114, formatId:124, getRoleLabel:130, getRoleTone:135, ProfilePage:142, handleEdit:198, handleCancel:206, handleSave:213, ReadOnlyField:693 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/support/page.tsx` | 79 | SupportPage:5 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/dashboard/tasks/page.tsx` | 78 | isOpenTask:8, TaskRow:10, TasksPage:33 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/(dashboard)/layout.tsx` | 115 | DashboardLayout:17 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/admin/create-user/route.ts` | 97 | getErrorMessage:5, normalizeInstallServiceCenters:8, normalizePermissions:22, POST:35 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/admin/delete-user/route.ts` | 48 | getErrorMessage:4, POST:7 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/admin/reset-password/route.ts` | 44 | getErrorMessage:4, POST:7 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/admin/update-user/route.ts` | 94 | getErrorMessage:6, normalizeInstallServiceCenters:9, normalizePermissions:24, POST:37 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/auth/forgot-password/route.ts` | 58 | getErrorMessage:4, POST:10, normalize:40 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/auth/signout/route.ts` | 20 | POST:8 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/auth/verify-password/route.ts` | 28 | POST:3 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/profile/update/route.ts` | 71 | getErrorMessage:5, normalizeText:8, POST:10 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/requests/accept-phase/route.ts` | 137 | getErrorMessage:44, POST:47 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/api/requests/create-draft/route.ts` | 83 | generateRequestId:19, getErrorMessage:25, POST:28 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/layout.tsx` | 67 | RootLayout:29 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/login/page.tsx` | 312 | LoginPage:25, handleSubmit:56, openForgot:79, handleForgotVerify:90, handleForgotReset:97 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/page.tsx` | 37 | Home:8 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `app/pdf-preview/page.tsx` | 897 | readFileAsDataUrl:44, formatDateInput:53, clampPlacementValue:66, formatOffset:70, buildPdfViewerSrc:75, PdfPreviewContent:89, loadRequest:150, buildPreview:235, broadcastPreviewResult:273, handleConfirm:291, handleClose:296, handleSignatureUpload:303, resetPlacement:319, moveStamp:333, resizeStamp:358, handleSignPermission1:365, PdfPreviewPage:890 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/duct-rental/DuctRentalWorkspace.tsx` | 451 | formatDueDate:136, DuctRentalWorkspace:142 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/layout/Sidebar.tsx` | 230 | Sidebar:48, isActive:140 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/layout/StatusBar.tsx` | 66 | StatusBar:22 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/layout/Topbar.tsx` | 295 | getPageContext:49, Topbar:61, handleLogout:104, openChangePassword:110, handleChangePassword:120 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/pdf/DuctRentalPDF.tsx` | 402 | getRequestTypeLabel:194, getRequestTypeStyle:208, DuctRentalPDF:225 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/pdf/ntFormFiller.ts` | 556 | getPdfjsLib:40, loadSarabunFont:47, buildFieldValues:60, getViewportRect:110, isEmptyImagePlaceholder:125, renderPageWithText:129, fillNTDuctRentalForm:186, toArrayBuffer:232, generateFilledPDFPreviewUrl:237, generateFilledPDFBlob:244, downloadFilledPDF:250, generateAndSaveNTForm:266, dataUrlToUint8Array:298, normalizePlacement:303, loadPdfThaiFontBytes:317, fitImageIntoBox:325, fitTextSize:338, getCenteredTextPosition:346, splitSignDateParts:354, loadImageElement:359, isNearWhitePaperPixel:368, prepareTransparentSignatureBytes:373, generateSignedPermission1PdfBytes:438, generateSignedPermission1PreviewUrl:538, generateSignedPermission1File:547 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/pdf/pdfUtils.tsx` | 100 | sanitizeFilename:8, buildFilename:17, generateAndDownloadPDF:29, generatePDFBlob:67, generatePDFFile:78, generatePDFPreviewUrl:93 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/providers/AuthProvider.tsx` | 271 | readCachedUser:28, AuthProvider:43, clearResolvedUser:58, applyResolvedUser:68, loadProfileAndApply:136 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/providers/QueryProvider.tsx` | 22 | QueryProvider:6 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/AppDialog.tsx` | 66 | AppDialog:16 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/BrandMark.tsx` | 25 | BrandMark:8 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/ConfirmDialog.tsx` | 42 | ConfirmDialog:17 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/ContactCard.tsx` | 46 | ContactCard:15, ContactGrid:43 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/FileUpload.tsx` | 72 | FileUpload:21 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/Input.tsx` | 54 | types/config/presentation | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/LoadingOverlay.tsx` | 96 | LoadingOverlay:8 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/MissingDocsPanel.tsx` | 50 | MissingDocsPanel:13 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/NotificationCenter.tsx` | 108 | isOpenTask:9, formatDueDate:11, NotificationCenter:16, openTask:40 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/PdfUploadZone.tsx` | 310 | createPreviewToken:18, getPreviewStorageKey:24, isPdfPreviewResult:26, PdfUploadZone:37, clearPending:66, handleMessage:75, clearPending:99, handleStorage:108, queueFile:167, reopenPendingPreview:188, clearPendingFile:193, openAttachedPreview:202 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/PdfViewButton.tsx` | 71 | PdfViewButton:18, handleOpen:29 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/PhaseTabs.tsx` | 81 | PhaseTabs:37, handlePhaseChange:46 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/ProcessFlow.tsx` | 59 | ProcessFlow:19 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/RequestDetailModal.tsx` | 338 | fmtDateTime:126, fmtRoute:137, phaseOrder:141, sortFiles:146, fileLabel:154, RequestDetailModal:164 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `components/ui/Section.tsx` | 54 | Section:15, FormGrid:34, FormField:46 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/StorageDownloadButton.tsx` | 36 | StorageDownloadButton:15 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/ThemeToggle.tsx` | 71 | getPreferredTheme:7, readStoredTheme:12, applyTheme:21, ThemeToggle:26, onToggle:41 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `components/ui/Toast.tsx` | 239 | ToastCard:47, ToastContainer:198 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `hooks/useAutoLogout.ts` | 50 | useAutoLogout:11, handleActivity:37 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/branding.ts` | 3 | types/config/presentation | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/processTracking.ts` | 72 | getRenewOwner:31, getCancelOwner:38, addDays:45, getSlaStatus:52, formatDate:66 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `lib/supabase/admin.ts` | 23 | getSupabaseAdminClient:7 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/client.ts` | 24 | getSupabaseBrowserClient:10 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/config.ts` | 60 | missingMessage:16, assertSupabaseEnv:19, assertSupabaseAdminEnv:40 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/server.ts` | 27 | getSupabaseServerClient:6 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/session.ts` | 38 | withTimeout:6, getSessionWithTimeout:21, refreshSessionWithTimeout:30 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/storage.ts` | 70 | sanitizeFileName:11, buildRequestStoragePath:14, buildRenewalStoragePath:18, extractStoragePath:23, getStorageSignedUrl:31, openStorageFile:49 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/supabase/types.ts` | 341 | types/config/presentation | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/toast.ts` | 31 | show:12, success:23, error:24, warning:25, info:26, loading:27, dismiss:28, clear:29 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `lib/utils.ts` | 122 | cn:4, getOwnedPhasesForRole:27, canRoleActOnPhase:31, canRoleViewAllRequests:36, isReadOnlyManagementRole:41, hasPhaseBeenTouched:46, canRoleSeeRequest:51, getPreferredPhaseForRole:58, isMemoMissing:74, hasIncompleteRequiredDocuments:83, canViewFile:97 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `next.config.ts` | 15 | types/config/presentation | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `schemas/ductRentalSchema.ts` | 172 | getFiberTypeOptions:53, getDiameterForCable:58 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useAuthStore.ts` | 56 | canAcceptPhase:35, setUser:46, setCurrentUser:47, setRole:48, setPermissions:49, setLoading:50, canAcceptPhase:51 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `store/useCancellationStore.ts` | 247 | now:49, nextCancellationId:51, dbRowToRecord:58, syncCancellations:91, createCancellation:130, startCancellation:164, moveToTracking:177, completeCancellation:190, approveCancellation:205, rejectCancellation:220, deleteCancellation:235 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useRenewalStore.ts` | 325 | now:62, calcEstimatedCost:64, routeRowToReview:68, dbRowToRenewal:86, loadAllRenewals:108, loadOneRenewal:121, syncRenewals:135, createRenewal:169, updateRouteReview:210, submitForApproval:240, approveRenewal:252, startMemoPreparation:264, confirmProvider:274, uploadContractFile:286, saveContractDetails:298, deleteRenewal:313 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useRequestStore.ts` | 789 | now:151, updateRequestOrThrow:154, getActiveAccessTokenOrThrow:166, fileRowToPhaseFile:195, dbRowToRecord:207, loadAllRequests:230, loadOneRequest:246, fetchRequestRecordById:261, syncRequests:273, refreshAll:277, handleOnline:296, handleOffline:297, touchRealtime:301, createDraft:361, saveDesign:382, submitDesign:402, acceptPhase:432, submitPhase:488, saveInstall:544, saveAsBuilt:554, saveRateNotice:564, saveGuarantee:574, setMissingDocs:584, savePermission1SignoffConfig:594, signPermission1:613, resetPermission1Signoff:636, uploadFile:657, addFile:689, cancelRoute:726, deleteRequest:752, addNotification:766, markNotificationRead:781, clearNotifications:787 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useSignatureStore.ts` | 124 | now:31, getAssetsForUser:38, saveSignatureAsset:50, setDefaultAsset:78, removeAsset:92 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useSignatureTaskStore.ts` | 165 | mapTask:38, syncTasks:56, refresh:60, assignSignatureTask:94, cancelSignatureTasks:125, markTaskRead:136, completeSignatureTask:148 | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `store/useToastStore.ts` | 39 | addToast:24, removeToast:33, clearAll:37 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `store/useUserStore.ts` | 307 | simpleHash:6, verifyPassword:16, now:159, login:172, logout:193, createUser:197, updateUser:215, deleteUser:237, getUser:246, hasPermission:250, canAcceptPhase:266, canSubmitPhase:272, setUserRole:278, setUserPermissions:282, toggleUserStatus:286, setCurrentUser:293 | Core/โมดูลอื่น ใช้ประกอบ discovery ไม่ย้ายระบบทั้งก้อน |
| `supabase/migrations/20260416000001_initial_schema.sql` | 255 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260416000002_rls_policies.sql` | 148 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260417000002_add_install_service_centers_to_profiles.sql` | 6 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260419000001_fix_renewal_rls.sql` | 59 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260419000002_add_management_roles.sql` | 11 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260421000001_allow_request_phase_role_updates.sql` | 68 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260421000002_enable_workflow_realtime.sql` | 64 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260428000001_add_storage_upload_policies.sql` | 54 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260430042035_allow_draftsman_skip_to_3rdparty.sql` | 20 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260430073000_extend_renew_cancel_workflows.sql` | 55 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260707000001_make_management_roles_readonly.sql` | 55 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |
| `supabase/migrations/20260809151215_add_signature_tasks.sql` | 80 | DDL/policy | โมดูล/สัญญาข้อมูล ต้องพอร์ตหรือเทียบ |

ไม่ได้ตรวจ: runtime ของระบบต้นทางที่ deploy, ข้อมูล Supabase/Storage จริง, ไฟล์ legacy `maxiwa-Cyber.html` ทั้งก้อน (ไม่มี import ใน Next runtime; ต้องตรวจเป็น reference เพิ่มก่อน cutover), binary templates/fonts และภาพ PDF แบบ render จริง ดัชนีไม่ได้รับรองความครบของ call graph แบบ dynamic
