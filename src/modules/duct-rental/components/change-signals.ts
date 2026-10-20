"use client";
type Status = "connecting" | "connected" | "reconnecting";
const subscribers = new Set<(changed: boolean, status: Status) => void>();
let stream: EventSource | undefined, status: Status = "connecting";
export function subscribeChanges(callback: (changed: boolean, status: Status) => void) {
  subscribers.add(callback);
  if (!stream) {
    stream = new EventSource("/api/duct-rental/events");
    stream.addEventListener("ready", () => { status = "connected"; for (const subscriber of subscribers) subscriber(true, status); });
    stream.addEventListener("invalidate", () => { for (const subscriber of subscribers) subscriber(true, status); });
    stream.addEventListener("error", () => { status = "reconnecting"; for (const subscriber of subscribers) subscriber(false, status); });
  }
  callback(false, status);
  return () => { subscribers.delete(callback); if (!subscribers.size) { stream?.close(); stream = undefined; status = "connecting"; } };
}
