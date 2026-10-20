import { listenDuctRentalChanges } from "./db";
import { transaction, type DuctContext } from "./transaction";
export async function changeSignals(request: Request, context: DuctContext) {
  await transaction(context, async () => undefined);
  const encoder = new TextEncoder(); let stop = () => {};
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false, listener: Awaited<ReturnType<typeof listenDuctRentalChanges>> | undefined;
      const send = (text: string) => { if (!closed) controller.enqueue(encoder.encode(text)); };
      const heartbeat = setInterval(() => send(": heartbeat\n\n"), 10000);
      // Reauthenticate through Core on each reconnect; the stream contains only empty invalidation hints.
      const expiry = setTimeout(() => stop(), 30000);
      stop = () => { if (closed) return; closed = true; clearInterval(heartbeat); clearTimeout(expiry); request.signal.removeEventListener("abort", stop); void listener?.unlisten().catch(() => {}); try { controller.close(); } catch { /* Consumer may already have cancelled the stream. */ } };
      request.signal.addEventListener("abort", stop, { once: true });
      if (request.signal.aborted) { stop(); return; }
      try { listener = await listenDuctRentalChanges(() => send("event: invalidate\ndata: {}\n\n")); if (closed) await listener.unlisten(); else send("retry: 2000\nevent: ready\ndata: {}\n\n"); }
      catch { send("event: unavailable\ndata: {}\n\n"); stop(); }
    }, cancel() { stop(); },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Accel-Buffering": "no" } });
}
