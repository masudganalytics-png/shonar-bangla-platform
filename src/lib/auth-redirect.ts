// Canonical production origin used for authentication redirects so users never
// land on a preview/development URL after signing in or following an email link.
export const PRODUCTION_ORIGIN = "https://khijirion.com";

const PREVIEW_HOST_PATTERNS = [
  /lovableproject\.com$/i,
  /lovableproject-dev\.com$/i,
  /^id-preview--/i,
  /-dev\.lovable\.app$/i,
  /localhost$/i,
  /^127\.0\.0\.1$/,
];

/** Origin to use for auth redirect URLs. Keeps local/preview flows working. */
export function authRedirectOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const host = window.location.hostname;
  if (PREVIEW_HOST_PATTERNS.some((re) => re.test(host))) {
    return window.location.origin;
  }
  return PRODUCTION_ORIGIN;
}

/** Full absolute auth redirect URL for a same-origin path (e.g. "/auth/callback"). */
export function authRedirectUrl(path = "/auth/callback"): string {
  return `${authRedirectOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
