import { z } from "zod";

/**
 * Lenient URL check for a resource link. Accepts links with or without a
 * scheme (e.g. "drive.google.com/…") so pasting a share URL isn't rejected on
 * a technicality, while still catching plain text or obvious junk.
 */
export function isLikelyUrl(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`);
    return Boolean(u.hostname) && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export const materialSchema = z
  .object({
    title: z.string().min(3, "Title is required"),
    type: z.string().min(1, "Type is required"),
    subject: z.string().min(1, "Subject is required"),
    klass: z.string().min(1, "Class is required"),
    uploader: z.string().min(2, "Uploader is required"),
    uploaded: z.string().min(4, "Upload date is required"),
    // Captured automatically from the uploaded file (never typed by the user);
    // 0 for link-only material.
    sizeMb: z.coerce.number<number>().min(0, "Cannot be negative"),
    sizeLabel: z.string(),
    downloads: z.coerce.number<number>().min(0, "Cannot be negative"),
    visibility: z.string().min(1, "Visibility is required"),
    description: z.string().max(300, "Keep the description under 300 characters"),
    tags: z.array(z.string()),
    url: z.string().trim().max(500, "Link is too long"),
    // Uploaded file, stored inline as a base64 data URL (EITHER this or `url`).
    fileDataUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
  })
  // A resource needs at least one source: an uploaded file or a link.
  .refine((v) => Boolean(v.fileDataUrl) || Boolean(v.url?.trim()), {
    path: ["url"],
    message: "Add a file or a resource link.",
  })
  // If a link is given, it must look like a URL.
  .refine((v) => !v.url?.trim() || isLikelyUrl(v.url), {
    path: ["url"],
    message: "Enter a valid URL, e.g. https://drive.google.com/…",
  });

export type MaterialSchema = z.infer<typeof materialSchema>;
