import type { ConnectionOptions } from "node:tls";
export function databaseSslOptions(env?: Record<string, string | undefined>): { ssl?: boolean | ConnectionOptions };
