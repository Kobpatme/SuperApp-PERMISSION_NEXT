/** Timing is centralized. No task data travels between browser tabs. */
export const liveRefreshTiming = { interval: 60_000, jitter: 0.1, visibleAfter: 15_000, maxBackoff: 300_000, requestTimeout: 30_000 } as const;
export function createLiveRefreshLoop(options: {
  refresh: () => Promise<void>; ready: () => boolean; now?: () => number; random?: () => number;
}) {
  const now = options.now ?? Date.now, random = options.random ?? Math.random;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false, busy = false, lastSuccess = now(), interval: number = liveRefreshTiming.interval, requested = false;
  function schedule(delay = interval * (1 + (random() * 2 - 1) * liveRefreshTiming.jitter)) {
    clearTimeout(timer);
    if (!stopped) timer = setTimeout(() => void run(), Math.min(delay, liveRefreshTiming.maxBackoff));
  }
  async function run() {
    if (stopped) return;
    if (busy) { requested = true; return; }
    if (!options.ready()) { requested = true; schedule(); return; }
    busy = true; requested = false;
    try { await options.refresh(); lastSuccess = now(); interval = liveRefreshTiming.interval; }
    catch { interval = Math.min(interval * 2, liveRefreshTiming.maxBackoff); }
    finally { busy = false; schedule(requested ? 0 : undefined); }
  }
  schedule();
  return {
    request: () => { requested = true; void run(); },
    resume: () => { if (requested || now() - lastSuccess > liveRefreshTiming.visibleAfter) void run(); },
    stop: () => { stopped = true; clearTimeout(timer); },
  };
}
