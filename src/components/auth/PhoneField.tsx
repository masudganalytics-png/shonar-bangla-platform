import { useMemo } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { Input } from "@/components/ui/input";

export const DEFAULT_COUNTRY: CountryCode = "BD";

function flagEmoji(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

type Props = {
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
  value: string;
  onValueChange: (v: string) => void;
  id?: string;
};

/**
 * Country selector + national phone number input.
 * Keeps the existing single-line look of the login field.
 */
export function PhoneField({ country, onCountryChange, value, onValueChange, id }: Props) {
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames(["bn"], { type: "region" });
    } catch {
      return null;
    }
  }, []);

  const countries = useMemo(() => {
    return getCountries()
      .map((c) => ({
        iso: c,
        code: getCountryCallingCode(c),
        name: names?.of(c) ?? c,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "bn"));
  }, [names]);

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <div className="pointer-events-none flex h-10 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm">
          <span className="text-base leading-none">{flagEmoji(country)}</span>
          <span className="tabular-nums">+{getCountryCallingCode(country)}</span>
        </div>
        <select
          aria-label="দেশ নির্বাচন করুন"
          value={country}
          onChange={(e) => onCountryChange(e.target.value as CountryCode)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {flagEmoji(c.iso)} {c.name} (+{c.code})
            </option>
          ))}
        </select>
      </div>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={country === "BD" ? "01XXXXXXXXX" : "ফোন নম্বর"}
        autoComplete="tel"
        required
        className="text-lg"
      />
    </div>
  );
}

export default PhoneField;
