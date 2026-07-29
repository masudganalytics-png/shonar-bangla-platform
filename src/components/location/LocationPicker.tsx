import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, LocateFixed, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Free OpenStreetMap + Leaflet + Nominatim location picker.
 * Emits selection ONLY after the user confirms.
 */

export type PickedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  place_id: string | null;
  plus_code: string | null;
};

type Props = {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string | null;
  onConfirm: (loc: PickedLocation) => void;
};

// Ukhiya, Cox's Bazar fallback
const DEFAULT_CENTER: [number, number] = [21.25, 92.1167];

const NOMINATIM = "https://nominatim.openstreetmap.org";

async function reverseGeocodeApi(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=bn`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new Error("nominatim");
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

type SearchResult = { display_name: string; lat: string; lon: string; place_id: number };

export function LocationPicker({ initialLat, initialLng, initialAddress, onConfirm }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PickedLocation | null>(
    initialLat != null && initialLng != null
      ? {
          latitude: initialLat,
          longitude: initialLng,
          address: initialAddress ?? "",
          place_id: null,
          plus_code: null,
        }
      : null,
  );

  const updateFromLatLng = useCallback(async (lat: number, lng: number) => {
    setBusy(true);
    const address = await reverseGeocodeApi(lat, lng);
    setSelected({ latitude: lat, longitude: lng, address, place_id: null, plus_code: null });
    setBusy(false);
  }, []);

  const setPin = useCallback(
    (lat: number, lng: number, pan = true) => {
      const L = LRef.current;
      if (!mapRef.current || !markerRef.current || !L) return;
      markerRef.current.setLatLng([lat, lng]);
      if (pan) mapRef.current.panTo([lat, lng]);
      void updateFromLatLng(lat, lng);
    },
    [updateFromLatLng],
  );

  // Init leaflet lazily (browser only)
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapDivRef.current) return;
      LRef.current = L;

      // Fix default marker icons (bundler paths)
      const iconRetinaUrl = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
      const iconUrl = (await import("leaflet/dist/images/marker-icon.png")).default;
      const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png")).default;
      // @ts-expect-error internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      const start: [number, number] =
        initialLat != null && initialLng != null
          ? [initialLat, initialLng]
          : DEFAULT_CENTER;

      const map = L.map(mapDivRef.current, {
        center: start,
        zoom: initialLat != null && initialLng != null ? 16 : 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(start, { draggable: true }).addTo(map);

      map.on("click", (e: any) => setPin(e.latlng.lat, e.latlng.lng, false));
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        void updateFromLatLng(p.lat, p.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setLoading(false);

      // Ask GPS on load if no initial coords
      if (initialLat == null || initialLng == null) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (cancelled) return;
              map.setView([pos.coords.latitude, pos.coords.longitude], 17);
              marker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
              void updateFromLatLng(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              void updateFromLatLng(start[0], start[1]);
            },
            { enableHighAccuracy: true, timeout: 10000 },
          );
        } else {
          void updateFromLatLng(start[0], start[1]);
        }
      }

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    })().catch((err) => {
      console.error(err);
      toast.error("ম্যাপ লোড করা যায়নি");
      setLoading(false);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("এই ডিভাইসে GPS নেই");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        if (mapRef.current) mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 17);
        setPin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBusy(false);
        toast.error("লোকেশন অ্যাক্সেসের অনুমতি দিন");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Debounced Nominatim search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&accept-language=bn&countrycodes=bd`,
        );
        const data: SearchResult[] = await res.json();
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const chooseResult = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (mapRef.current) mapRef.current.setView([lat, lng], 17);
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    setSelected({
      latitude: lat,
      longitude: lng,
      address: r.display_name,
      place_id: String(r.place_id),
      plus_code: null,
    });
    setResults([]);
    setQuery("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ঠিকানা খুঁজুন"
            className="pl-9"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
              {searching && (
                <div className="px-3 py-2 text-sm text-muted-foreground">খোঁজা হচ্ছে...</div>
              )}
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => chooseResult(r)}
                  className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={useMyLocation} disabled={busy}>
          <LocateFixed className="mr-1 h-4 w-4" /> আমার অবস্থান
        </Button>
      </div>

      <div className="relative h-72 w-full overflow-hidden rounded-md border bg-muted sm:h-96">
        <div ref={mapDivRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">নির্বাচিত ঠিকানা</p>
            <p className="mt-0.5 break-words text-muted-foreground">
              {busy ? "লোড হচ্ছে..." : selected?.address || "ম্যাপে ট্যাপ করুন বা মার্কার সরান"}
            </p>
            {selected && (
              <p className="mt-1 text-xs text-muted-foreground">
                অক্ষাংশ: {selected.latitude.toFixed(6)} · দ্রাঘিমাংশ: {selected.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full"
        disabled={!selected || busy}
        onClick={() => selected && onConfirm(selected)}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" /> লোকেশন নিশ্চিত করুন
      </Button>
    </div>
  );
}
