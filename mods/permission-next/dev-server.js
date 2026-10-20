const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const HOST = process.env.DEV_HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 8766;
const WEB_ROOT = __dirname;
const NAS_ROOT = process.env.NAS_BUILDING_ROOT
  || 'P:\\BBG\\Outside Plant&Coordination\\!!!_Data Base Building Drawing';
const INDEX_TTL_MS = 10 * 60_000;
const MISS_REFRESH_COOLDOWN_MS = 5_000;
const DOWNLOAD_TOKEN_TTL_MS = 15 * 60_000;
const MAX_UPLOAD_FILE_BYTES = 100 * 1024 * 1024;
const BRIDGE_SECRET = String(process.env.PERMISSION_NAS_BRIDGE_SECRET || '');
const AREA_TOKEN_PATTERN = '(?:BKK|CMI|CBI|RYG|PKT|SNI|SIN)\\d*';
const THAI_PROVINCES = new Set(`
กรุงเทพมหานคร กระบี่ กาญจนบุรี กาฬสินธุ์ กำแพงเพชร ขอนแก่น จันทบุรี ฉะเชิงเทรา ชลบุรี
ชัยนาท ชัยภูมิ ชุมพร เชียงราย เชียงใหม่ ตรัง ตราด ตาก นครนายก นครปฐม นครพนม
นครราชสีมา นครศรีธรรมราช นครสวรรค์ นนทบุรี นราธิวาส น่าน บึงกาฬ บุรีรัมย์ ปทุมธานี
ประจวบคีรีขันธ์ ปราจีนบุรี ปัตตานี พระนครศรีอยุธยา พะเยา พังงา พัทลุง พิจิตร พิษณุโลก
เพชรบุรี เพชรบูรณ์ แพร่ ภูเก็ต มหาสารคาม มุกดาหาร แม่ฮ่องสอน ยโสธร ยะลา ร้อยเอ็ด
ระนอง ระยอง ราชบุรี ลพบุรี ลำปาง ลำพูน เลย ศรีสะเกษ สกลนคร สงขลา สตูล
สมุทรปราการ สมุทรสงคราม สมุทรสาคร สระแก้ว สระบุรี สิงห์บุรี สุโขทัย สุพรรณบุรี
สุราษฎร์ธานี สุรินทร์ หนองคาย หนองบัวลำภู อ่างทอง อำนาจเจริญ อุดรธานี อุตรดิตถ์
อุทัยธานี อุบลราชธานี
`.trim().split(/\s+/u));
const SUPPORTED_EXTENSIONS = new Map([
  ['.dwg', 'dwg'], ['.pdf', 'pdf'], ['.jpg', 'image'], ['.jpeg', 'image'],
  ['.png', 'image'], ['.webp', 'image'], ['.gif', 'image'], ['.tif', 'image'],
  ['.tiff', 'image'], ['.bmp', 'image'], ['.heic', 'image'], ['.heif', 'image']
]);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

let folderIndex = [];
let folderIndexAt = 0;
let folderIndexPromise = null;
const missRefreshTimes = new Map();
const downloadTokens = new Map();
let resolveReady;
let rejectReady;
const ready = new Promise((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});

function createDownloadUrl(fullPath, actorId) {
  const now = Date.now();
  for (const [token, entry] of downloadTokens) {
    if (entry.expiresAt <= now) downloadTokens.delete(token);
  }
  const token = crypto.randomUUID();
  downloadTokens.set(token, { fullPath, actorId, expiresAt: now + DOWNLOAD_TOKEN_TTL_MS });
  return '/api/nas/download?token=' + encodeURIComponent(token);
}

function normalizeBuildingName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Folder names are not consistent: some include "อาคาร", "Building",
    // or an area suffix while the Firestore name fields do not.
    .replace(/^(?:อาคาร|building|bldg\.?)\s*/iu, '')
    .replace(new RegExp(`\\s*(?:\\(${AREA_TOKEN_PATTERN}\\)|\\[${AREA_TOKEN_PATTERN}\\]|\\{${AREA_TOKEN_PATTERN}\\})\\s*$`, 'iu'), '')
    .replace(new RegExp(`(?:\\s|[-_.])${AREA_TOKEN_PATTERN}\\s*$`, 'iu'), '')
    // Keep Unicode letters, marks, and numbers so Thai vowels/tone marks and
    // non-ASCII English names are not accidentally discarded.
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
}

function exactBuildingAliases(value) {
  const rawName = String(value || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
  const aliases = new Set();
  const addAlias = alias => {
    const normalized = normalizeBuildingName(alias);
    if (normalized) aliases.add(normalized);
  };
  const addScriptAliases = alias => {
    const thaiAlias = String(alias || '').replace(/[^\p{Script=Thai}\p{M}\p{N}]+/gu, ' ');
    const latinAlias = String(alias || '').replace(/[^\p{Script=Latin}\p{M}\p{N}]+/gu, ' ');
    if (/\p{Script=Thai}/u.test(thaiAlias)) addAlias(thaiAlias);
    if (/\p{Script=Latin}/u.test(latinAlias)) addAlias(latinAlias);
  };

  addAlias(rawName);
  const bracketPattern = /[([{]([^()[\]{}]+)[)\]}]/gu;
  for (const match of rawName.matchAll(bracketPattern)) {
    const bracketValue = match[1].trim();
    if (new RegExp(`^${AREA_TOKEN_PATTERN}$`, 'iu').test(bracketValue)) continue;
    addAlias(bracketValue);
  }
  const withoutBrackets = rawName.replace(bracketPattern, ' ');
  addAlias(withoutBrackets);
  // NAS folders often contain both languages in one name, for example
  // "อาคาร วานิชเพลซ อารีย์ Vanit Place Aree (BKK2)". Treat each script as
  // an exact alias instead of falling back to unsafe substring matching.
  addScriptAliases(withoutBrackets);
  return aliases;
}

function normalizeArea(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Some legacy NAS folders use SIN for the Samui area whose application code is SNI.
  return normalized.replace(/^SIN(?=\d*$)/, 'SNI');
}

function areaFromFolderName(folderName) {
  const areaPattern = new RegExp(`(?:^|[^a-z0-9])(${AREA_TOKEN_PATTERN})(?=$|[^a-z0-9])`, 'i');
  return normalizeArea(String(folderName || '').match(areaPattern)?.[1] || '');
}

function isProvinceFolder(folderName) {
  const normalized = String(folderName || '')
    .normalize('NFKC')
    .replace(/^[\s\d._-]+/u, '')
    .replace(/^(?:จังหวัด|จ\.?)[\s._-]*/u, '')
    .replace(/[^\p{L}\p{M}]+/gu, '');
  return THAI_PROVINCES.has(normalized);
}

async function directoryEntries(directoryPath) {
  try {
    return await fs.promises.readdir(directoryPath, { withFileTypes: true });
  } catch (cause) {
    const isRoot = path.resolve(directoryPath) === path.resolve(NAS_ROOT);
    const error = new Error(isRoot
      ? 'ไม่สามารถเข้าถึงแหล่งเอกสาร NAS ได้ กรุณาตรวจสอบการเชื่อมต่อหรือสิทธิ์ของ NAS Bridge'
      : 'อ่านรายการโฟลเดอร์จาก NAS ไม่สำเร็จ กรุณาลองใหม่');
    error.code = isRoot ? 'NAS_ROOT_UNAVAILABLE' : 'NAS_DIRECTORY_UNAVAILABLE';
    error.cause = cause;
    throw error;
  }
}

async function buildFolderIndex() {
  const rootEntries = await directoryEntries(NAS_ROOT);
  if (!rootEntries.length) {
    const error = new Error('ไม่สามารถเข้าถึงแหล่งเอกสาร NAS ได้');
    error.code = 'NAS_ROOT_UNAVAILABLE';
    throw error;
  }

  const regionCandidates = await Promise.all(rootEntries.filter(item => item.isDirectory()).map(async entry => {
    const fullPath = path.join(NAS_ROOT, entry.name);
    const candidates = [{
      name: entry.name,
      relativePath: entry.name,
      fullPath,
      depth: 1,
      area: areaFromFolderName(entry.name)
    }];

    const children = await directoryEntries(fullPath);
    const childDirectories = children.filter(item => item.isDirectory());
    for (const child of childDirectories) {
      candidates.push({
        name: child.name,
        relativePath: path.join(entry.name, child.name),
        fullPath: path.join(fullPath, child.name),
        depth: 2,
        area: areaFromFolderName(child.name) || areaFromFolderName(entry.name)
      });
    }
    const provinceCandidates = await Promise.all(
      childDirectories.filter(child => isProvinceFolder(child.name)).map(async province => {
        const provincePath = path.join(fullPath, province.name);
        const buildings = await directoryEntries(provincePath);
        return buildings.filter(item => item.isDirectory()).map(building => ({
          name: building.name,
          relativePath: path.join(entry.name, province.name, building.name),
          fullPath: path.join(provincePath, building.name),
          depth: 3,
          area: areaFromFolderName(building.name)
            || areaFromFolderName(province.name)
            || areaFromFolderName(entry.name)
        }));
      })
    );
    candidates.push(...provinceCandidates.flat());
    return candidates;
  }));
  const candidates = regionCandidates.flat();
  folderIndex = candidates;
  folderIndexAt = Date.now();
  return folderIndex;
}

async function getFolderIndex({ forceRefresh = false } = {}) {
  const indexExpired = Date.now() - folderIndexAt > INDEX_TTL_MS;
  if (!folderIndex.length || forceRefresh || indexExpired) {
    if (!folderIndexPromise) {
      folderIndexPromise = buildFolderIndex().finally(() => {
        folderIndexPromise = null;
      });
    }
    // Wait for a complete refresh. Returning the stale index here made the
    // first request miss folders that appeared or were renamed on the NAS.
    return folderIndexPromise;
  }
  return folderIndex;
}

function exactMatchRank(candidate, nameTh, nameEng, area) {
  const candidateAliases = exactBuildingAliases(candidate.name);
  if (!candidateAliases.size) return null;
  if (area && candidate.area && area !== candidate.area) return null;

  const normalizedThaiName = normalizeBuildingName(nameTh);
  const normalizedEnglishName = normalizeBuildingName(nameEng);
  const languageRank = normalizedThaiName && candidateAliases.has(normalizedThaiName)
    ? 2
    : normalizedEnglishName && candidateAliases.has(normalizedEnglishName)
      ? 1
      : 0;
  if (!languageRank) return null;
  return {
    languageRank,
    areaRank: area && candidate.area === area ? 2 : 1
  };
}

async function findBuildingFolders({ nameTh, nameEng, area }) {
  const normalizedArea = normalizeArea(area);
  const missKey = [normalizeBuildingName(nameTh), normalizeBuildingName(nameEng), normalizedArea].join('|');
  const hadFreshIndex = folderIndex.length > 0 && Date.now() - folderIndexAt <= INDEX_TTL_MS;
  const collectMatches = index => index.map(candidate => ({
      candidate,
      rank: exactMatchRank(candidate, nameTh, nameEng, normalizedArea)
    }))
    .filter(item => item.rank);
  let matches = collectMatches(await getFolderIndex());

  // A folder may have been added or renamed during the cache lifetime. On a
  // miss, rebuild once and retry so the user does not have to wait ten minutes.
  const lastMissRefreshAt = missRefreshTimes.get(missKey) || 0;
  if (!matches.length && hadFreshIndex && Date.now() - lastMissRefreshAt >= MISS_REFRESH_COOLDOWN_MS) {
    missRefreshTimes.set(missKey, Date.now());
    matches = collectMatches(await getFolderIndex({ forceRefresh: true }));
  }

  if (!matches.length) return null;
  const bestLanguageRank = Math.max(...matches.map(item => item.rank.languageRank));
  const languageMatches = matches.filter(item => item.rank.languageRank === bestLanguageRank);
  const bestAreaRank = Math.max(...languageMatches.map(item => item.rank.areaRank));
  const exactMatches = languageMatches.filter(item => item.rank.areaRank === bestAreaRank);

  if (exactMatches.length > 1) {
    const error = new Error(`พบโฟลเดอร์ชื่อเดียวกัน ${exactMatches.length.toLocaleString('th-TH')} แห่ง ระบบจึงหยุดเพื่อป้องกันการใช้ข้อมูลผิดอาคาร`);
    error.code = 'AMBIGUOUS_BUILDING_FOLDER';
    throw error;
  }
  return [exactMatches[0].candidate];
}

async function findBuildingFolder(query) {
  const candidates = await findBuildingFolders(query);
  if (!candidates?.length) return null;
  return candidates[0];
}

async function scanSupportedFiles(buildingFolder, actorId) {
  const output = [];
  const queue = [{ fullPath: buildingFolder.fullPath, relativePath: '' }];

  while (queue.length) {
    const currentBatch = queue.splice(0);
    const directoryBatches = await Promise.all(currentBatch.map(async current => ({
      current,
      entries: await directoryEntries(current.fullPath)
    })));
    const fileTasks = [];

    for (const { current, entries } of directoryBatches) {
      for (const entry of entries) {
        const fullPath = path.join(current.fullPath, entry.name);
        const relativePath = current.relativePath ? path.join(current.relativePath, entry.name) : entry.name;
        if (entry.isDirectory()) {
          queue.push({ fullPath, relativePath });
          continue;
        }
        const extension = path.extname(entry.name).toLowerCase();
        const category = SUPPORTED_EXTENSIONS.get(extension);
        if (!category) continue;
        fileTasks.push(fs.promises.stat(fullPath).then(stat => ({
          name: entry.name,
          download_url: createDownloadUrl(fullPath, actorId),
          category,
          extension: extension.slice(1),
          size: stat.size,
          modified_at: stat.mtime.toISOString()
        })).catch(() => null));
      }
    }
    output.push(...(await Promise.all(fileTasks)).filter(Boolean));
  }

  return output.sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'th')
  );
}

function contentDispositionFilename(fileName) {
  const fallback = String(fileName || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
  const encoded = encodeURIComponent(fileName).replace(/[!'()*]/g, character =>
    '%' + character.charCodeAt(0).toString(16).toUpperCase()
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

async function handleNasDownload(req, res, requestUrl) {
  const token = requestUrl.searchParams.get('token') || '';
  const tokenEntry = downloadTokens.get(token);
  const actorId = String(req.headers['x-permission-actor-id'] || '');
  if (!tokenEntry || tokenEntry.expiresAt <= Date.now() || !actorId || tokenEntry.actorId !== actorId) {
    downloadTokens.delete(token);
    sendJson(res, 404, { error: 'ลิงก์ดาวน์โหลดไม่ถูกต้องหรือหมดอายุ' });
    return;
  }
  const fullPath = tokenEntry.fullPath;
  const pathWithinNas = path.relative(NAS_ROOT, fullPath);
  const extension = path.extname(fullPath).toLowerCase();
  if (pathWithinNas.startsWith('..') || path.isAbsolute(pathWithinNas) || !SUPPORTED_EXTENSIONS.has(extension)) {
    sendJson(res, 403, { error: 'ไม่อนุญาตให้ดาวน์โหลดไฟล์นี้' });
    return;
  }
  try {
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isFile()) throw new Error('Not a file');
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': contentDispositionFilename(path.basename(fullPath)),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(fullPath).pipe(res);
  } catch {
    sendJson(res, 404, { error: 'ไม่พบไฟล์ที่ต้องการดาวน์โหลด' });
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Permission-NAS-Bridge': '1'
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;

    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
      req.destroy();
    };

    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        const error = new Error(`ไฟล์มีขนาดใหญ่เกิน ${(maxBytes / 1024 / 1024).toLocaleString('th-TH')} MB`);
        error.code = 'UPLOAD_TOO_LARGE';
        fail(error);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', fail);
  });
}

function safeUploadFileName(value) {
  const raw = String(value || '').replace(/[\\/]/g, '_');
  const baseName = path.basename(raw)
    .replace(/[<>:"|?*\u0000-\u001F]/g, '_')
    .trim();
  if (!baseName || baseName === '.' || baseName === '..') return '';
  return baseName;
}

function fileSignatureMatches(extension, body) {
  if (!Buffer.isBuffer(body) || body.length < 4) return false;
  const ascii = body.subarray(0, 16).toString('ascii');
  const hex = body.subarray(0, 12).toString('hex');
  if (extension === '.pdf') return ascii.startsWith('%PDF-');
  if (extension === '.dwg') return /^AC10\d{2}/.test(ascii);
  if (['.jpg', '.jpeg'].includes(extension)) return hex.startsWith('ffd8ff');
  if (extension === '.png') return hex.startsWith('89504e470d0a1a0a');
  if (extension === '.gif') return ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a');
  if (extension === '.bmp') return ascii.startsWith('BM');
  if (extension === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP';
  if (['.tif', '.tiff'].includes(extension)) return hex.startsWith('49492a00') || hex.startsWith('4d4d002a');
  if (['.heic', '.heif'].includes(extension)) {
    return ascii.slice(4, 8) === 'ftyp' && /(heic|heix|hevc|hevx|mif1|msf1)/.test(ascii.slice(8, 12));
  }
  return false;
}

async function handleNasUpload(req, res, requestUrl) {
  if (!req.headers['x-permission-actor-id']) {
    sendJson(res, 403, { error: 'บัญชีนี้ไม่มีสิทธิ์เพิ่มเอกสาร' });
    return;
  }

  const fileName = safeUploadFileName(requestUrl.searchParams.get('fileName'));
  const extension = path.extname(fileName).toLowerCase();
  if (!fileName || !SUPPORTED_EXTENSIONS.has(extension)) {
    sendJson(res, 400, { error: 'รองรับเฉพาะไฟล์ DWG, PDF และรูปภาพตามประเภทที่ระบบกำหนด' });
    return;
  }

  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_FILE_BYTES) {
    sendJson(res, 413, { error: `ไฟล์มีขนาดใหญ่เกิน ${(MAX_UPLOAD_FILE_BYTES / 1024 / 1024).toLocaleString('th-TH')} MB` });
    return;
  }

  try {
    const folder = await findBuildingFolder({
      nameTh: requestUrl.searchParams.get('nameTh') || '',
      nameEng: requestUrl.searchParams.get('nameEng') || '',
      area: requestUrl.searchParams.get('area') || ''
    });
    if (!folder) {
      sendJson(res, 404, { error: 'ไม่พบโฟลเดอร์อาคารสำหรับเพิ่มเอกสาร' });
      return;
    }

    const body = await readRequestBody(req, MAX_UPLOAD_FILE_BYTES);
    if (!body.length) {
      sendJson(res, 400, { error: 'ไม่พบข้อมูลไฟล์ที่ต้องการเพิ่ม' });
      return;
    }

    if (!fileSignatureMatches(extension, body)) {
      sendJson(res, 415, { error: 'File content does not match its extension. Please verify the original file.' });
      return;
    }

    const targetPath = path.join(folder.fullPath, fileName);
    const temporaryPath = path.join(folder.fullPath, `.permission-upload-${crypto.randomUUID()}.tmp`);
    try {
      await fs.promises.writeFile(temporaryPath, body, { flag: 'wx' });
      await fs.promises.copyFile(temporaryPath, targetPath, fs.constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code === 'EEXIST') {
        sendJson(res, 409, { error: `มีไฟล์ชื่อ ${fileName} อยู่แล้ว กรุณาเปลี่ยนชื่อไฟล์ก่อนเพิ่ม` });
        return;
      }
      throw error;
    } finally {
      await fs.promises.unlink(temporaryPath).catch(() => {});
    }

    const stat = await fs.promises.stat(targetPath);
    sendJson(res, 201, {
      file: {
        name: fileName,
        download_url: createDownloadUrl(targetPath, String(req.headers['x-permission-actor-id'] || '')),
        category: SUPPORTED_EXTENSIONS.get(extension),
        extension: extension.slice(1),
        size: stat.size,
        modified_at: stat.mtime.toISOString()
      }
    });
  } catch (err) {
    const statusCode = err.code === 'UPLOAD_TOO_LARGE'
      ? 413
      : err.code === 'AMBIGUOUS_BUILDING_FOLDER'
        ? 409
        : ['NAS_ROOT_UNAVAILABLE', 'NAS_DIRECTORY_UNAVAILABLE'].includes(err.code)
          ? 503
          : 500;
    sendJson(res, statusCode, {
      code: err.code || 'NAS_UPLOAD_FAILED',
      error: err.message || 'เพิ่มไฟล์ลง NAS ไม่สำเร็จ'
    });
  }
}

async function handleNasDocuments(req, res, requestUrl) {
  try {
    const query = requestUrl.searchParams;
    const folders = await findBuildingFolders({
      nameTh: query.get('nameTh') || '',
      nameEng: query.get('nameEng') || '',
      area: query.get('area') || ''
    });
    if (!folders?.length) {
      sendJson(res, 404, {
        code: 'BUILDING_FOLDER_NOT_FOUND',
        error: 'เชื่อมต่อ NAS แล้ว แต่ไม่พบโฟลเดอร์ที่ตรงกับชื่ออาคารและ Area'
      });
      return;
    }
    const actorId = String(req.headers['x-permission-actor-id'] || '');
    const files = (await Promise.all(folders.map(folder => scanSupportedFiles(folder, actorId)))).flat();
    sendJson(res, 200, {
      folder_found: true,
      matched_folders: folders.length,
      files: files.sort((a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'th')
      )
    });
  } catch (err) {
    const statusCode = err.code === 'AMBIGUOUS_BUILDING_FOLDER'
      ? 409
      : ['NAS_ROOT_UNAVAILABLE', 'NAS_DIRECTORY_UNAVAILABLE'].includes(err.code)
        ? 503
        : 500;
    sendJson(res, statusCode, {
      code: err.code || 'NAS_READ_FAILED',
      error: err.message || 'อ่านข้อมูล NAS ไม่สำเร็จ'
    });
  }
}

function serveStatic(res, requestUrl) {
  let relativePath = decodeURIComponent(requestUrl.pathname);
  if (relativePath === '/') relativePath = '/Permission_Next.html';
  const filePath = path.resolve(WEB_ROOT, relativePath.replace(/^\/+/, ''));
  const pathWithinWebRoot = path.relative(WEB_ROOT, filePath);
  if (pathWithinWebRoot.startsWith('..') || path.isAbsolute(pathWithinWebRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, 'http://' + req.headers.host);
  if (requestUrl.pathname.startsWith('/api/nas/')) {
    const provided = Buffer.from(String(req.headers['x-permission-bridge-secret'] || ''));
    const expected = Buffer.from(BRIDGE_SECRET);
    if (!BRIDGE_SECRET || provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      sendJson(res, 403, { error: 'NAS Bridge rejected a request that did not originate from the Super App.' });
      return;
    }
    if (!req.headers['x-permission-actor-id']) {
      sendJson(res, 403, { error: 'No authenticated actor was supplied for this request.' });
      return;
    }
  }
  if (requestUrl.pathname === '/api/nas/building-documents/upload') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'ต้องใช้คำสั่ง POST สำหรับเพิ่มเอกสาร' });
      return;
    }
    await handleNasUpload(req, res, requestUrl);
    return;
  }
  if (requestUrl.pathname === '/api/nas/building-documents') {
    await handleNasDocuments(req, res, requestUrl);
    return;
  }
  if (requestUrl.pathname === '/api/nas/download') {
    await handleNasDownload(req, res, requestUrl);
    return;
  }
  sendJson(res, 404, { error: 'This bridge exposes NAS API routes only.' });
});

server.on('error', err => {
  console.error('Dev server failed:', err.message);
  rejectReady(err);
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log('Permission Next dev server: http://' + HOST + ':' + PORT);
  resolveReady({ host: HOST, port: PORT });
});

module.exports = { server, ready, host: HOST, port: PORT };
