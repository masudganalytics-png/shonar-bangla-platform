import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  fileBase64: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.string().min(1).max(120).regex(/^[a-zA-Z0-9/_-]+$/),
});

async function sha1Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uploads an image to Cloudinary via signed upload, returns secure HTTPS URL.
 * Auto-optimizes with fetch_format=auto and quality=auto.
 * Never returns or logs API credentials.
 */
export const uploadToCloudinary = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<{ secure_url: string; public_id: string }> => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary কনফিগার করা নেই");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = data.folder;

    // Signed params (alphabetical; exclude file, api_key, cloud_name, resource_type, signature)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = await sha1Hex(paramsToSign + apiSecret);

    // Reconstruct data URI for Cloudinary
    const dataUri = `data:${data.contentType};base64,${data.fileBase64}`;

    const form = new FormData();
    form.append("file", dataUri);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[cloudinary] upload failed", res.status, text);
      throw new Error("ছবি আপলোড ব্যর্থ হয়েছে");
    }
    const json = (await res.json()) as { secure_url?: string; public_id?: string };
    if (!json.secure_url || !json.public_id) {
      throw new Error("Cloudinary থেকে অবৈধ রেসপন্স");
    }

    // Return an auto-optimized delivery URL (f_auto,q_auto).
    // Cloudinary URL: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}.{ext}
    const optimized = json.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
    return { secure_url: optimized, public_id: json.public_id };
  });
