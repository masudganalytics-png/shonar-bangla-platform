import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary.functions";

/** Read a File as base64 (without the data:...;base64, prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to Cloudinary. Returns a secure HTTPS URL with automatic
 * format + quality optimization already applied.
 *
 * `folder` is a logical prefix like "workers", "teachers/submissions", etc.
 */
export async function uploadImageToCloudinary(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("শুধুমাত্র ছবি ফাইল আপলোড করা যাবে");
  }
  // Guard against oversized uploads (Cloudinary free tier ~10MB, base64 inflates ~33%).
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("ছবির সাইজ ১০MB এর বেশি হতে পারবে না");
  }
  const fileBase64 = await fileToBase64(file);
  const { secure_url } = await uploadToCloudinary({
    data: { fileBase64, contentType: file.type || "image/jpeg", folder },
  });
  return secure_url;
}

/**
 * Best-effort deletion of an existing image stored in Supabase Storage.
 * No-ops for Cloudinary (or any external) HTTPS URLs.
 *
 * `pathOrUrl` is what we historically stored — either a bare bucket-prefixed
 * path (e.g. "worker-images/xyz.jpg") or a full URL for newly-uploaded
 * Cloudinary images.
 */
export async function deleteLegacyStorageImage(
  pathOrUrl: string | null | undefined,
  bucket: string,
): Promise<void> {
  if (!pathOrUrl) return;
  if (/^https?:\/\//i.test(pathOrUrl)) return; // Cloudinary / external — nothing to remove here.
  const prefix = `${bucket}/`;
  const path = pathOrUrl.startsWith(prefix) ? pathOrUrl.slice(prefix.length) : pathOrUrl;
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.warn("[cloudinary] legacy storage cleanup failed", err);
  }
}
