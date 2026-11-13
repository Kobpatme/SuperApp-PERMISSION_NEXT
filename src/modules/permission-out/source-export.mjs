// Preserved geometry/export helpers from Permission_Out.html @55380a5.
// DOM/auth/UI are excluded. Source regression fixtures cover projection unions.
import { lineLength as lineLengthMeters, sampleLine as sampleCoordinates } from "./geometry.mjs";
function pointToSegmentMeters(pt,p1,p2) {
  const mx=111320*Math.cos(pt[1]*Math.PI/180),my=111320,ax=p1[0]*mx,ay=p1[1]*my,dx=(p2[0]-p1[0])*mx,dy=(p2[1]-p1[1])*my;
  const denominator=dx*dx+dy*dy,t=denominator?Math.max(0,Math.min(1,((pt[0]*mx-ax)*dx+(pt[1]*my-ay)*dy)/denominator)):0;
  return Math.hypot(pt[0]*mx-ax-t*dx,pt[1]*my-ay-t*dy);
}
const sampleLine = (coords,interval) => sampleCoordinates(coords,interval).map(coord=>({coord}));
const mod1ComparisonFileName = line => String(line.sourceFile || "").toLowerCase();
const isMaxiSourceLine = line => mod1ComparisonFileName(line).includes("maxi");
const setExportStatus = () => {};
function exportRouteIndex(lines) {
  const size = 0.02, cells = new Map(), overflow = [];
  const bounds = line => (line.coords || []).reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
  lines.forEach((line, index) => {
    const b = bounds(line), x0 = Math.floor(b[0] / size), x1 = Math.floor(b[2] / size), y0 = Math.floor(b[1] / size), y1 = Math.floor(b[3] / size);
    if (!Number.isFinite(x0) || !Number.isFinite(y0)) return;
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 4096) { overflow.push(index); return; }
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const key = `${x},${y}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(index);
    }
  });
  return (line, threshold) => {
    const b = bounds(line);
    if (!Number.isFinite(b[0])) return [];
    const padY = Math.max(0.5, Number(threshold) || 20) / 110000;
    const padX = padY / Math.max(0.01, Math.cos(Math.max(Math.abs(b[1]), Math.abs(b[3])) * Math.PI / 180));
    const x0 = Math.floor((b[0] - padX) / size), x1 = Math.floor((b[2] + padX) / size), y0 = Math.floor((b[1] - padY) / size), y1 = Math.floor((b[3] + padY) / size);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 4096) return lines.map((_, index) => index);
    const found = new Set(overflow);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (const index of cells.get(`${x},${y}`) || []) found.add(index);
    return [...found].sort((a, b) => a - b);
  };
}

function csvDirectOverlapMeters(rd03Line, maxiLine, threshold) {
  const rd = rd03Line?.coords || [], maxi = maxiLine?.coords || [];
  const tolerance = Math.max(0.5, Number(threshold) || 20);
  let total = 0;
  for (let i = 1; i < rd.length; i++) {
    const origin = rd[i - 1], end = rd[i];
    const scaleX = 111320 * Math.cos((origin[1] + end[1]) * Math.PI / 360);
    const project = p => [(p[0] - origin[0]) * scaleX, (p[1] - origin[1]) * 111320];
    const [dx, dy] = project(end), length = Math.hypot(dx, dy);
    if (!length) continue;
    const intervals = [];
    for (let j = 1; j < maxi.length; j++) {
      const a = project(maxi[j - 1]), b = project(maxi[j]);
      const vx = b[0] - a[0], vy = b[1] - a[1], size = Math.hypot(vx, vy);
      if (!size || Math.abs((vx * dx + vy * dy) / (size * length)) < Math.cos(Math.PI / 6)) continue;
      const x0 = (a[0] * dx + a[1] * dy) / length, x1 = (b[0] * dx + b[1] * dy) / length;
      const y0 = (a[1] * dx - a[0] * dy) / length, y1 = (b[1] * dx - b[0] * dy) / length;
      let lo = 0, hi = 1;
      const delta = y1 - y0;
      if (Math.abs(delta) < 1e-9) { if (Math.abs(y0) > tolerance) continue; }
      else {
        const t0 = (-tolerance - y0) / delta, t1 = (tolerance - y0) / delta;
        lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      }
      if (hi <= lo) continue;
      const start = Math.max(0, Math.min(x0 + (x1 - x0) * lo, x0 + (x1 - x0) * hi));
      const stop = Math.min(length, Math.max(x0 + (x1 - x0) * lo, x0 + (x1 - x0) * hi));
      if (stop > start) intervals.push([start, stop]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    let stop = 0, covered = 0;
    for (const [a, b] of intervals) { covered += Math.max(0, b - Math.max(a, stop)); stop = Math.max(stop, b); }
    total += covered / length * lineLengthMeters([origin, end]);
  }
  return total;
}

function exportOverlapParts(rd03Line, references, threshold) {
  const rd = rd03Line?.coords || [], maxi = references.flatMap(line => (line.coords || []).slice(1).map((point, index) => [line.coords[index], point]));
  const tolerance = Math.max(0.5, Number(threshold) || 20);
  const parts = [];
  for (let i = 1; i < rd.length; i++) {
    const origin = rd[i - 1], end = rd[i];
    const scaleX = 111320 * Math.cos((origin[1] + end[1]) * Math.PI / 360);
    const project = p => [(p[0] - origin[0]) * scaleX, (p[1] - origin[1]) * 111320];
    const [dx, dy] = project(end), length = Math.hypot(dx, dy);
    if (!length) continue;
    const intervals = [];
    for (let j = 0; j < maxi.length; j++) {
      const a = project(maxi[j][0]), b = project(maxi[j][1]);
      const vx = b[0] - a[0], vy = b[1] - a[1], size = Math.hypot(vx, vy);
      if (!size || Math.abs((vx * dx + vy * dy) / (size * length)) < Math.cos(Math.PI / 6)) continue;
      const x0 = (a[0] * dx + a[1] * dy) / length, x1 = (b[0] * dx + b[1] * dy) / length;
      const y0 = (a[1] * dx - a[0] * dy) / length, y1 = (b[1] * dx - b[0] * dy) / length;
      let lo = 0, hi = 1;
      const delta = y1 - y0;
      if (Math.abs(delta) < 1e-9) { if (Math.abs(y0) > tolerance) continue; }
      else {
        const t0 = (-tolerance - y0) / delta, t1 = (tolerance - y0) / delta;
        lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      }
      if (hi <= lo) continue;
      const start = Math.max(0, Math.min(x0 + (x1 - x0) * lo, x0 + (x1 - x0) * hi));
      const stop = Math.min(length, Math.max(x0 + (x1 - x0) * lo, x0 + (x1 - x0) * hi));
      if (stop > start) intervals.push([start, stop]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const pair of intervals) {
      const last = merged[merged.length - 1];
      if (last && pair[0] <= last[1] + 1e-7) last[1] = Math.max(last[1], pair[1]);
      else merged.push([...pair]);
    }
    const at = distance => origin.map((value, axis) => value + (end[axis] - value) * distance / length);
    for (const [start, stop] of merged) {
      const first = at(start), last = at(stop), previous = parts[parts.length - 1];
      const tail = previous?.[previous.length - 1];
      if (tail && Math.hypot(tail[0] - first[0], tail[1] - first[1]) < 1e-10) previous.push(last);
      else parts.push([first, last]);
    }
  }
  return parts;
}

function exportTrimmedMaxi(line, references, threshold) {
  return exportOverlapParts(line, references, threshold).map(coords => ({
    ...line, coords, length: lineLengthMeters(coords)
  }));
}

function trimExportSourceLines(lines, threshold) {
  const references = lines.filter(line => mod1ComparisonFileName(line).includes('rd03'));
  return lines.flatMap(line => isMaxiSourceLine(line) ? exportTrimmedMaxi(line, references, threshold) : [line]);
}

async function csvDirectMatchRows(lines, threshold, selectedKeys = null) {
  const rd03 = lines.filter(line => mod1ComparisonFileName(line).includes('rd03'));
  const maxi = lines.filter(isMaxiSourceLine), used = new Set(), rows = [];
  const hasSelectedMaxi=!selectedKeys||maxi.some(line=>selectedKeys.has(line.key));
  const bounds = line => (line.coords || []).reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);
  const maxiBounds = maxi.map(bounds);
  const queryMaxi = exportRouteIndex(maxi);
  for (let i = 0; i < rd03.length; i++) {
    const rd03Line = rd03[i], box = bounds(rd03Line), length = lineLengthMeters(rd03Line.coords || []);
    if(selectedKeys&&!selectedKeys.has(rd03Line.key)&&!hasSelectedMaxi)continue;
    const padY = Math.max(0.5, Number(threshold) || 20) / 110000;
    const padX = padY / Math.max(0.01, Math.cos(Math.max(Math.abs(box[1]), Math.abs(box[3])) * Math.PI / 180));
    let found = false;
    for (const j of queryMaxi(rd03Line, threshold)) {
      if(selectedKeys&&!selectedKeys.has(rd03Line.key)&&!selectedKeys.has(maxi[j].key))continue;
      const b = maxiBounds[j];
      if (b[2] < box[0] - padX || b[0] > box[2] + padX || b[3] < box[1] - padY || b[1] > box[3] + padY) continue;
      const overlapMeters = Math.min(length, csvDirectOverlapMeters(rd03Line, maxi[j], threshold));
      if (overlapMeters <= 0.001) continue;
      rows.push({ rd03Line, maxiLine: maxi[j], overlapMeters, overlapPercent: length ? overlapMeters / length * 100 : 0 });
      if(rows.length>50000)throw new Error('ผลจับคู่เกิน 50,000 รายการ กรุณากรองข้อมูล');
      used.add(maxi[j]); found = true;
    }
    if (!found&&(!selectedKeys||selectedKeys.has(rd03Line.key))) rows.push({ rd03Line, maxiLine: null, overlapMeters: 0, overlapPercent: 0 });
    if (i % 20 === 0) {
      setExportStatus(`กำลังคำนวณระยะทับซ้อน CSV ${i + 1} / ${rd03.length} เส้น…`, 'busy');
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  maxi.filter(line => !used.has(line)&&(!selectedKeys||selectedKeys.has(line.key))).forEach(maxiLine => rows.push({ rd03Line: null, maxiLine, overlapMeters: '', overlapPercent: '' }));
  return rows;
}

function buildExportOverlapGroups(segments, threshold, interval) {
  const labels = new Map();
  if (!Array.isArray(segments) || segments.length < 2) return labels;

  const distanceMeters = Math.max(0.5, Number(threshold) || 20);
  const sampleInterval = Math.max(2, Math.min(Number(interval) || 5, 15));
  const cellSizeDeg = Math.max(distanceMeters * 1.5, 30) / 111320;
  const grid = new Map();
  const parent = segments.map((_, index) => index);
  const rank = segments.map(() => 0);
  let cellBudget=0;

  const find = value => {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== value) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  };
  const union = (left, right) => {
    let rootLeft = find(left), rootRight = find(right);
    if (rootLeft === rootRight) return;
    if (rank[rootLeft] < rank[rootRight]) [rootLeft, rootRight] = [rootRight, rootLeft];
    parent[rootRight] = rootLeft;
    if (rank[rootLeft] === rank[rootRight]) rank[rootLeft]++;
  };

  segments.forEach((segment, ownerIndex) => {
    const coords = segment.coords || [];
    for (let coordIndex = 0; coordIndex < coords.length - 1; coordIndex++) {
      const p1 = coords[coordIndex], p2 = coords[coordIndex + 1];
      const edge = { ownerIndex, p1, p2 };
      const minCellX = Math.floor(Math.min(p1[0], p2[0]) / cellSizeDeg);
      const maxCellX = Math.floor(Math.max(p1[0], p2[0]) / cellSizeDeg);
      const minCellY = Math.floor(Math.min(p1[1], p2[1]) / cellSizeDeg);
      const maxCellY = Math.floor(Math.max(p1[1], p2[1]) / cellSizeDeg);
      cellBudget+=(maxCellX-minCellX+1)*(maxCellY-minCellY+1);
      if(cellBudget>1000000)throw new Error('พื้นที่ส่งออกกว้างเกินกำหนด กรุณากรองข้อมูล');
      for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
        for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
          const key = `${cellX},${cellY}`;
          const edges = grid.get(key) || [];
          edges.push(edge);
          grid.set(key, edges);
        }
      }
    }
  });

  segments.forEach((segment, segmentIndex) => {
    const samples = sampleLine(segment.coords || [], sampleInterval);
    if (!samples.length) return;
    const hitsByOwner = new Map();
    samples.forEach(sample => {
      const cellX = Math.floor(sample.coord[0] / cellSizeDeg);
      const cellY = Math.floor(sample.coord[1] / cellSizeDeg);
      const nearbyOwners = new Set();
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetY = -1; offsetY <= 1; offsetY++) {
          const edges = grid.get(`${cellX + offsetX},${cellY + offsetY}`) || [];
          for (const edge of edges) {
            if (edge.ownerIndex === segmentIndex || nearbyOwners.has(edge.ownerIndex)) continue;
            if (pointToSegmentMeters(sample.coord, edge.p1, edge.p2) <= distanceMeters) {
              nearbyOwners.add(edge.ownerIndex);
            }
          }
        }
      }
      nearbyOwners.forEach(ownerIndex => {
        hitsByOwner.set(ownerIndex, (hitsByOwner.get(ownerIndex) || 0) + 1);
      });
    });
    hitsByOwner.forEach((hitCount, ownerIndex) => {
      if (hitCount / samples.length >= 0.6) union(segmentIndex, ownerIndex);
    });
  });

  const membersByRoot = new Map();
  segments.forEach((_, index) => {
    const root = find(index);
    const members = membersByRoot.get(root) || [];
    members.push(index);
    membersByRoot.set(root, members);
  });
  const overlapGroups = Array.from(membersByRoot.values())
    .filter(members => members.length > 1)
    .sort((left, right) => left[0] - right[0]);
  overlapGroups.forEach((members, groupIndex) => {
    members.forEach(memberIndex => labels.set(segments[memberIndex], `ทับกัน ${groupIndex + 1}`));
  });
  return labels;
}
export {csvDirectOverlapMeters,csvDirectMatchRows,trimExportSourceLines,exportTrimmedMaxi,buildExportOverlapGroups};
