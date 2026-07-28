import { supabase } from "@/integrations/supabase/client";

export const SITE_URL = "https://khijirion.com";
export const SITE_BRAND = "উখিয়া সেবা";

const FALLBACK_OG = `${SITE_URL}/favicon.png`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID_RE.test(s);

/** Create a long-lived signed URL suitable for use as an og:image. */
export async function signMediaForOg(
  bucket: string,
  pathOrUrl: string | null | undefined,
): Promise<string> {
  if (!pathOrUrl) return FALLBACK_OG;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const prefix = `${bucket}/`;
  const path = pathOrUrl.startsWith(prefix) ? pathOrUrl.slice(prefix.length) : pathOrUrl;
  // 7 days — refreshed on each SSR render, ample for social crawler caching.
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? FALLBACK_OG;
}

export type ProfileHeadInput = {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: "profile" | "article" | "website" | "product";
  siteName?: string;
  imageAlt?: string;
};

/** Build a full set of head meta + links for a public profile page. */
export function buildProfileHead(input: ProfileHeadInput) {
  const {
    title,
    description,
    url,
    image,
    type = "profile",
    siteName = SITE_BRAND,
    imageAlt,
  } = input;
  const meta = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index,follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: siteName },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    ...(imageAlt ? [{ property: "og:image:alt", content: imageAlt }] : []),
    { property: "og:locale", content: "bn_BD" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
  const links = [{ rel: "canonical", href: url }];
  return { meta, links };
}

/** Truncate a description string for meta tags (max ~160 chars). */
export function metaDescription(s: string | null | undefined, max = 160): string {
  const clean = (s ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}
