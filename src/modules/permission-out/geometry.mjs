// Native JS shared by the server and bounded Node worker. Source behavior: 55380a5.
export function distance(a, b) {
    const rad = Math.PI / 180;
    const h = Math.sin((b[1] - a[1]) * rad / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin((b[0] - a[0]) * rad / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function lineLength(coords) { return coords.slice(1).reduce((sum, p, i) => sum + distance(coords[i], p), 0); }
export function sampleLine(coords, interval) {
    if (!(interval > 0))
        throw new Error("ระยะสุ่มต้องมากกว่าศูนย์");
    const lengths = coords.slice(1).map((p, i) => distance(coords[i], p));
    const total = lengths.reduce((a, b) => a + b, 0);
    if (!total)
        return [];
    if (total / interval > 200000)
        throw new Error("เส้นทางยาวเกินขีดจำกัด กรุณาเพิ่มระยะสุ่ม");
    const result = [];
    let index = 0, start = 0;
    for (let target = 0; target <= total; target += interval) {
        while (index < lengths.length && start + lengths[index] < target)
            start += lengths[index++];
        if (index >= lengths.length)
            break;
        const ratio = lengths[index] ? (target - start) / lengths[index] : 0;
        result.push([coords[index][0] + (coords[index + 1][0] - coords[index][0]) * ratio, coords[index][1] + (coords[index + 1][1] - coords[index][1]) * ratio]);
    }
    if (total % interval !== 0)
        result.push(coords[coords.length - 1]);
    return result;
}
function segmentDistance(p, edge) {
    const mx = 111320 * Math.cos(p[1] * Math.PI / 180), my = 111320;
    const ax = edge.a[0] * mx, ay = edge.a[1] * my, dx = (edge.b[0] - edge.a[0]) * mx, dy = (edge.b[1] - edge.a[1]) * my;
    const denominator = dx * dx + dy * dy;
    const t = denominator ? Math.max(0, Math.min(1, ((p[0] * mx - ax) * dx + (p[1] * my - ay) * dy) / denominator)) : 0;
    return Math.hypot(p[0] * mx - ax - t * dx, p[1] * my - ay - t * dy);
}
function spatialIndex(lines, threshold) {
    const cell = Math.max(threshold * 1.5, 30) / 111320, grid = new Map();
    let cells = 0;
    for (const line of lines)
        for (let i = 1; i < line.coords.length; i++) {
            const edge = { a: line.coords[i - 1], b: line.coords[i] };
            const x1 = Math.floor(Math.min(edge.a[0], edge.b[0]) / cell), x2 = Math.floor(Math.max(edge.a[0], edge.b[0]) / cell);
            const y1 = Math.floor(Math.min(edge.a[1], edge.b[1]) / cell), y2 = Math.floor(Math.max(edge.a[1], edge.b[1]) / cell);
            cells += (x2 - x1 + 1) * (y2 - y1 + 1);
            if (cells > 1000000)
                throw new Error("ข้อมูลพื้นที่ใหญ่เกินขีดจำกัด กรุณาแบ่งชุดข้อมูล");
            for (let x = x1; x <= x2; x++)
                for (let y = y1; y <= y2; y++) {
                    const key = `${x},${y}`, bucket = grid.get(key) ?? [];
                    bucket.push(edge);
                    grid.set(key, bucket);
                }
        }
    return (p) => {
        const x = Math.floor(p[0] / cell), y = Math.floor(p[1] / cell), seen = new Set();
        for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
                for (const edge of grid.get(`${x + dx},${y + dy}`) ?? []) {
                    if (!seen.has(edge) && segmentDistance(p, edge) <= threshold)
                        return true;
                    seen.add(edge);
                }
        return false;
    };
}
export function deduplicate(lines, threshold, interval) {
    const accepted = [];
    for (const line of lines) {
        const samples = sampleLine(line.coords, interval), near = spatialIndex(accepted, threshold);
        if (samples.length && (!accepted.length || samples.filter(near).length / samples.length < 0.9))
            accepted.push(line);
    }
    return accepted;
}
export function analyzeRoutes(baseInput, compareInput, rawOptions) {
    const options = rawOptions;
    const base = options.dedupe ? deduplicate(baseInput, options.threshold, options.interval) : baseInput;
    const compare = options.dedupe ? deduplicate(compareInput, options.threshold, options.interval) : compareInput;
    if (!base.length || !compare.length)
        return (base.length ? base : compare).map(line => ({ ...line, length: lineLength(line.coords), status: base.length ? "new" : "remove", overlapType: "none" }));
    const output = [];
    let sampleBudget = 0;
    const walk = (lines, other, uncovered, covered) => {
        const near = spatialIndex(other, options.threshold);
        for (const line of lines) {
            const samples = sampleLine(line.coords, options.interval);
            sampleBudget += samples.length;
            if (sampleBudget > 500000)
                throw new Error("จำนวนจุดวิเคราะห์เกินขีดจำกัด กรุณาแบ่งข้อมูลหรือเพิ่มระยะสุ่ม");
            const coverage = samples.map(near), count = coverage.filter(Boolean).length;
            const overlapType = count === 0 ? "none" : count === coverage.length ? "full" : "partial";
            let current = null;
            const close = () => { if (current && current.coords.length > 1)
                output.push({ ...line, ...current, length: lineLength(current.coords), overlapType }); current = null; };
            samples.forEach((p, i) => {
                const status = coverage[i] ? covered : uncovered;
                if (!status) {
                    close();
                    return;
                }
                if (!current)
                    current = { status, coords: [p] };
                else if (current.status === status)
                    current.coords.push(p);
                else {
                    current.coords.push(p);
                    close();
                    current = { status, coords: [p] };
                }
            });
            close();
        }
    };
    walk(base, compare, "new", "same");
    walk(compare, base, "remove", null);
    return output;
}
