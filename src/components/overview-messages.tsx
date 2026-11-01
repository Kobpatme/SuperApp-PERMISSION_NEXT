import styles from "./overview.module.css";

/** Presentation only: callers must pass the existing server-filtered home messages. */
export function OverviewMessages({ announcements, links }: {
  announcements: { id: string; message: string }[];
  links: { id: string; name: string; url: string; description: string; status: string }[];
}) {
  if (!announcements.length && !links.length) return null;
  return <div className={styles.messages}>
    {announcements.map(row => <aside key={row.id} className={styles.announcement} role="note">{row.message}</aside>)}
    {links.length > 0 && <details className={styles.systemLinks} open>
      <summary>ลิงก์ระบบ <span>· {links.length}</span></summary>
      <ul>{links.map(row => <li key={row.id}><strong>{row.status === "Active" ? <a href={row.url} rel="noopener noreferrer">{row.name}</a> : <span>{row.name} · {row.status === "Maintenance" ? "กำลังปรับปรุง" : "เร็ว ๆ นี้"}</span>}</strong><p>{row.description}</p></li>)}</ul>
    </details>}
  </div>;
}
