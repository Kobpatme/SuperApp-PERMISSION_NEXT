import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createLiveRefreshLoop } from "@/lib/live-refresh";
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); });
afterEach(() => vi.useRealTimers());
it.each([[0, 54000], [0.5, 60000], [1, 66000]])("jitters the interval within ten percent (%s)", async (random, interval) => {
  const refresh = vi.fn().mockResolvedValue(undefined), loop = createLiveRefreshLoop({ refresh, ready: () => true, random: () => random });
  await vi.advanceTimersByTimeAsync(interval - 1); expect(refresh).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(refresh).toHaveBeenCalledOnce(); loop.stop();
});
it("skips hidden/offline/modal/draft conditions and reconciles once when eligible", async () => {
  let ready = false; const refresh = vi.fn().mockResolvedValue(undefined);
  const loop = createLiveRefreshLoop({ refresh, ready: () => ready, random: () => .5 });
  await vi.advanceTimersByTimeAsync(180000); expect(refresh).not.toHaveBeenCalled();
  ready = true; loop.resume(); await vi.advanceTimersByTimeAsync(0); expect(refresh).toHaveBeenCalledOnce();
  loop.resume(); expect(refresh).toHaveBeenCalledOnce(); loop.stop();
});
it("never overlaps and coalesces multiple signals received during a request", async () => {
  let done!: () => void;
  const refresh = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { done = resolve; })).mockResolvedValue(undefined);
  const loop = createLiveRefreshLoop({ refresh, ready: () => true, random: () => .5 });
  loop.request(); loop.request(); loop.request(); expect(refresh).toHaveBeenCalledOnce();
  done(); await vi.advanceTimersByTimeAsync(0); expect(refresh).toHaveBeenCalledTimes(2); loop.stop();
});
it("backs off failures up to five minutes then restores the healthy interval", async () => {
  const refresh = vi.fn().mockRejectedValueOnce(new Error()).mockRejectedValueOnce(new Error()).mockRejectedValueOnce(new Error()).mockResolvedValue(undefined);
  const loop = createLiveRefreshLoop({ refresh, ready: () => true, random: () => .5 });
  await vi.advanceTimersByTimeAsync(60000); expect(refresh).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(120000); expect(refresh).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(240000); expect(refresh).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(300000); expect(refresh).toHaveBeenCalledTimes(4);
  await vi.advanceTimersByTimeAsync(60000); expect(refresh).toHaveBeenCalledTimes(5); loop.stop();
});
it("refreshes on visibility only after fifteen seconds and stops all scheduled work", async () => {
  const refresh = vi.fn().mockResolvedValue(undefined), loop = createLiveRefreshLoop({ refresh, ready: () => true, random: () => .5 });
  await vi.advanceTimersByTimeAsync(15000); loop.resume(); expect(refresh).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); loop.resume(); await vi.advanceTimersByTimeAsync(0); expect(refresh).toHaveBeenCalledOnce();
  loop.stop(); await vi.advanceTimersByTimeAsync(300000); loop.request(); expect(refresh).toHaveBeenCalledOnce();
});
