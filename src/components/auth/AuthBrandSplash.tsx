import logoAsset from "@/assets/khijirion-logo.png.asset.json";

/**
 * KHIJIRION-branded full-screen authentication splash.
 * Used for auth loading / redirect / error states so no third-party
 * branding is ever shown to users during authentication.
 */
export function AuthBrandSplash({
  message,
  hint,
  loading = true,
  children,
}: {
  message: string;
  hint?: string;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <img
        src={logoAsset.url}
        alt="KHIJIRION"
        className="h-24 w-24 object-contain sm:h-28 sm:w-28"
        width={112}
        height={112}
      />
      <p className="mt-6 text-base font-semibold text-foreground">{message}</p>
      {hint ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{hint}</p> : null}
      {loading ? (
        <div
          className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
          role="status"
          aria-label="লোড হচ্ছে"
        />
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
