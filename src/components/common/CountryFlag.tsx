import { useEffect, useState } from "react";

type Props = {
  /** Full SVG url, e.g. https://flagcdn.com/sa.svg */
  src?: string | null;
  /** ISO 3166-1 alpha-2 code, e.g. "SA" — used for fallback badge and url derivation */
  iso: string;
  /** Country name used in alt text, e.g. "Saudi Arabia" */
  countryName: string;
  className?: string;
};

/**
 * Renders a country flag as an SVG image (FlagCDN) with a single automatic retry
 * and an ISO-code badge fallback. Fixed 32x24 box so card layouts never shift.
 */
export function CountryFlag({ src, iso, countryName, className }: Props) {
  const code = iso.toLowerCase();
  const url = src || `https://flagcdn.com/${code}.svg`;
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [url]);

  const box = `inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[4px] ${className ?? ""}`;

  if (failed) {
    return (
      <span
        className={`${box} border border-border bg-muted text-[9px] font-bold uppercase tracking-wide text-muted-foreground`}
        role="img"
        aria-label={`Flag of ${countryName}`}
        title={countryName}
      >
        {iso.toUpperCase()}
      </span>
    );
  }

  return (
    <span className={`${box} bg-muted/40 ring-1 ring-black/5 dark:ring-white/10`}>
      <img
        key={attempt}
        src={attempt === 0 ? url : `${url}?retry=1`}
        alt={`Flag of ${countryName}`}
        width={32}
        height={24}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover"
        onError={() => (attempt === 0 ? setAttempt(1) : setFailed(true))}
      />
    </span>
  );
}

export default CountryFlag;
