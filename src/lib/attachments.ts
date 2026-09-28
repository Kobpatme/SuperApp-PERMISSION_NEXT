import { z } from "zod";

export const attachmentProviders = ["nas", "sharepoint", "local"] as const;
const permittedMediaTypes = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] as const;

export const attachmentMetadataSchema = z.object({
  moduleId: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  entityType: z.string().regex(/^[a-z][a-z0-9_]{1,63}$/),
  entityId: z.string().uuid(),
  provider: z.enum(attachmentProviders),
  storageKey: z.string().min(1).max(512).refine((key) => !key.includes("..") && !key.startsWith("/") && !key.startsWith("\\"), "Unsafe storage key"),
  fileName: z.string().trim().min(1).max(255).refine((name) => !/[\\/]/.test(name), "File name must not contain a path"),
  mediaType: z.enum(permittedMediaTypes),
  sizeBytes: z.number().int().nonnegative().max(25 * 1024 * 1024),
  checksumSha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export type AttachmentMetadataInput = z.infer<typeof attachmentMetadataSchema>;

export type AttachmentReadResult = {
  body: ReadableStream<Uint8Array>;
  mediaType: string;
  sizeBytes: number;
};

export interface AttachmentProvider {
  readonly kind: (typeof attachmentProviders)[number];
  put(key: string, content: ReadableStream<Uint8Array>, expectedChecksum: string): Promise<void>;
  read(key: string): Promise<AttachmentReadResult>;
  remove(key: string): Promise<void>;
}

export function validateAttachmentMetadata(input: unknown) {
  return attachmentMetadataSchema.parse(input);
}
