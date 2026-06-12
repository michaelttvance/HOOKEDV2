import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { JobPhoto } from "./seed-data";

const BUCKET = "job-media";
const SIGNED_URL_TTL_SECONDS = 60 * 30;

export type MediaReference =
  | string
  | {
      url?: string | null;
      path?: string | null;
      publicUrl?: string | null;
      bucket?: string | null;
    }
  | null
  | undefined;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getReferenceUrl(ref: MediaReference): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref.trim() || null;
  if (typeof ref.url === "string" && ref.url.trim().length > 0) return ref.url.trim();
  if (typeof ref.publicUrl === "string" && ref.publicUrl.trim().length > 0) return ref.publicUrl.trim();
  return null;
}

function getLegacyPublicUrl(ref: MediaReference): string | null {
  const url = getReferenceUrl(ref);
  return url && isPublicMediaUrl(url) ? url : null;
}

function getReferencePath(ref: MediaReference): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return isStoragePath(ref) ? ref.trim() : null;
  if (typeof ref.path === "string" && ref.path.trim().length > 0) return ref.path.trim();
  const url = typeof ref.url === "string" ? ref.url.trim() : "";
  if (isStoragePath(url)) return url;
  return null;
}

function mediaRefKey(ref: MediaReference, bucket = BUCKET): string {
  const url = getReferenceUrl(ref) ?? "";
  const path = getReferencePath(ref) ?? "";
  return `${bucket}:${url}:${path}`;
}

/** True for legacy public URLs already stored in the DB or returned by uploads. */
export function isPublicMediaUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && isHttpUrl(value);
}

/** True for future storage object keys / bucket paths (not direct URLs). */
export function isStoragePath(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0 && !isHttpUrl(value);
}

/**
 * Resolve a media reference to something renderable today.
 *
 * Legacy support: public URLs stay public.
 * Future private-bucket support: this branch is the one we will swap to signed-url lookup.
 */
export function resolveMediaUrl(ref: MediaReference, bucket = BUCKET): string | null {
  if (!ref) return null;

  if (typeof ref === "string") {
    if (isPublicMediaUrl(ref)) return ref;
    if (isStoragePath(ref)) return supabase.storage.from(bucket).getPublicUrl(ref).data.publicUrl;
    return null;
  }

  const url = getReferenceUrl(ref) ?? "";
  if (url) {
    if (isPublicMediaUrl(url)) return url;
    if (isStoragePath(url)) return supabase.storage.from(bucket).getPublicUrl(url).data.publicUrl;
    return url;
  }

  const path = getReferencePath(ref) ?? "";
  if (path) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  return null;
}

/**
 * Resolve a media reference to a temporary signed URL when we have a storage path.
 *
 * Today the bucket is still public, so legacy public URLs continue to work as-is.
 * Once the bucket flips private, this helper becomes the primary render path for new photos.
 */
export async function resolveSignedMediaUrl(
  ref: MediaReference,
  bucket = BUCKET,
  expiresIn = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  const path = getReferencePath(ref);
  if (!path) return resolveMediaUrl(ref, bucket);

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (!error && data?.signedUrl) return data.signedUrl;

  return getLegacyPublicUrl(ref);
}

/**
 * Client hook for authenticated previews.
 * It starts with any legacy public URL for stability, then upgrades to a signed URL
 * whenever a storage path is present.
 */
export function useResolvedMediaUrl(ref: MediaReference, bucket = BUCKET): string | null {
  const initialUrl = getLegacyPublicUrl(ref);
  const path = getReferencePath(ref);
  const key = mediaRefKey(ref, bucket);
  const [resolved, setResolved] = useState<string | null>(initialUrl);

  useEffect(() => {
    let cancelled = false;
    setResolved(initialUrl ?? null);

    if (!path) {
      if (!initialUrl) {
        const legacyFallback = resolveMediaUrl(ref, bucket);
        if (legacyFallback) setResolved(legacyFallback);
      }
      return;
    }

    void resolveSignedMediaUrl(ref, bucket).then((next) => {
      if (!cancelled && next) setResolved(next);
    });

    return () => {
      cancelled = true;
    };
  }, [bucket, initialUrl, key, path]);

  return resolved;
}

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

/** Upload a job photo and append it to jobs.photos. Returns the legacy public-url photo entry. */
export async function addJobPhoto(jobId: string, label: string, file: File): Promise<JobPhoto> {
  const blob = await compressImage(file);
  const ts = Date.now();
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `jobs/${jobId}/${safeLabel}-${ts}.jpg`;
  const url = await uploadToBucket(path, blob, "image/jpeg");

  const photo: JobPhoto = { url, path, label, ts };

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

/** Upload a signature PNG and set jobs.signature_url + jobs.signature_path. Returns the legacy public URL. */
export async function setJobSignature(jobId: string, blob: Blob): Promise<string> {
  const path = `jobs/${jobId}/signature-${Date.now()}.png`;
  const url = await uploadToBucket(path, blob, "image/png");
  const { error } = await supabase
    .from("jobs")
    .update({ signature_url: url, signature_path: path } as never)
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
