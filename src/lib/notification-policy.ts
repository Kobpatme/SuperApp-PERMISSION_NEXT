/** Notification destinations must stay inside the application; route guards reauthorize. */
export function safeNotificationHref(value: string | null | undefined) {
  return value && /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value) ? value : null;
}
