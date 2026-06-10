import { supabase } from "@/integrations/supabase/client";
import type { JobPhoto } from "./seed-data";

const BUCKET = "job-media";

/** Downscale + JPEG-compress an image client-side so uploads stay small on cell data. */
export async function compressImage(file: File, maxDim = 1400, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // unsupported format — upload as-is

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  return blob ?? file;
}

async function uploadToBucket(path: string, blob: Blob, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a job photo and append it to jobs.photos. Returns the new photo entry. */
export async function addJobPhoto(jobId: string, label: string, file: File): Promise<JobPhoto> {
  const blob = await compressImage(file);
  const ts = Date.now();
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const url = await uploadToBucket(`jobs/${jobId}/${safeLabel}-${ts}.jpg`, blob, "image/jpeg");

  const photo: JobPhoto = { url, label, ts };

  // Append to the job's photos array (read-modify-write; jobs are company-scoped via RLS)
  const { data: row, error: readErr } = await supabase
    .from("jobs")
    .select("photos" as never)
    .eq("id", jobId)
    .single();
  if (readErr) throw readErr;
  const raw = (row as unknown as { photos?: unknown } | null)?.photos;
  const current: JobPhoto[] = Array.isArray(raw) ? (raw as JobPhoto[]) : [];
  const { error: writeErr } = await supabase
    .from("jobs")
    .update({ photos: [...current, photo] } as never)
    .eq("id", jobId);
  if (writeErr) throw writeErr;

  return photo;
}

/** Upload a signature PNG and set jobs.signature_url. Returns the public URL. */
export async function setJobSignature(jobId: string, blob: Blob): Promise<string> {
  const url = await uploadToBucket(`jobs/${jobId}/signature-${Date.now()}.png`, blob, "image/png");
  const { error } = await supabase
    .from("jobs")
    .update({ signature_url: url } as never)
    .eq("id", jobId);
  if (error) throw error;
  return url;
}

/** Build the public customer-tracking URL for a job. */
export function trackingUrl(jobId: string, publicToken: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "https://hookaidashboard.com");
  return `${base}/track/${jobId}?t=${publicToken}`;
}
