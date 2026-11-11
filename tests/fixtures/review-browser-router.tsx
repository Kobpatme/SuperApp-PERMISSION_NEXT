import type { ReactNode } from "react";
export default function Link({ children, href, ...props }: { children?: ReactNode; href: string }) { return <a href={href} {...props}>{children}</a>; }
export const useRouter = () => ({ push: (href: string) => { window.location.href = href; } });
export const usePathname = () => window.location.pathname;
export const useSearchParams = () => new URLSearchParams(window.location.search);
