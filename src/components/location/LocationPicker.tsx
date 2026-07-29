import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, LocateFixed, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Non-breaking Google Maps location picker for profile.
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

// Ukhiya, Cox's Bazar
const DEFAULT_CENTER = { lat: 21.2500, lng: 92.1167 };

let mapsLoader: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (mapsLoader) return mapsLoader;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Google Maps key missing"));
  mapsLoader = new Promise((resolve, reject) => {
    (window as any).__lovableInitMap = () => resolve((window as any).google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=__lovableInitMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

export function LocationPicker({ initialLat, initialLng, initialAddress, onConfirm }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<PickedLocation | null>(
    initialLat && initialLng
      ? {
          latitude: initialLat,
          longitude: initialLng,
          address: initialAddress ?? "",
          place_id: null,
          plus_code: null,
        }
      : null,
  );

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    setBusy(true);
    try {
      const res = await geocoderRef.current.geocode({ location: { lat, lng } });
      const top = res.results?.[0];
      setSelected({
        latitude: lat,
        longitude: lng,
        address: top?.formatted_address ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        place_id: top?.place_id ?? null,
        plus_code: (res as any).plus_code?.global_code ?? null,
      });
    } catch {
      setSelected({
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        place_id: null,
        plus_code: null,
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const setPin = useCallback((lat: number, lng: number, pan = true) => {
    if (!mapRef.current || !markerRef.current) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    if (pan) mapRef.current.panTo(pos);
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapDivRef.current) return;
        const start =
          initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER;
        const map = new google.maps.Map(mapDivRef.current, {
          center: start,
          zoom: initialLat && initialLng ? 16 : 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        const marker = new google.maps.Marker({
          map,
          position: start,
          draggable: true,
        });
        mapRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new google.maps.Geocoder();

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setPin(e.latLng.lat(), e.latLng.lng(), false);
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (p) reverseGeocode(p.lat(), p.lng());
        });

        // Places Autocomplete on the search field (legacy JS Autocomplete kept minimal)
        if (searchInputRef.current && google.maps.places?.Autocomplete) {
          const ac = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["geometry", "formatted_address", "place_id", "plus_code"],
          });
          ac.bindTo("bounds", map);
          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.panTo({ lat, lng });
            map.setZoom(17);
            marker.setPosition({ lat, lng });
            setSelected({
              latitude: lat,
              longitude: lng,
              address: place.formatted_address ?? "",
              place_id: place.place_id ?? null,
              plus_code: (place as any).plus_code?.global_code ?? null,
            });
          });
        }

        if (!initialLat || !initialLng) {
          // Show initial address for default center
          reverseGeocode(start.lat, start.lng);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("গুগল ম্যাপ লোড করা যায়নি");
        setLoading(false);
      });
    return () => {
      cancelled = true;
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
        if (mapRef.current) mapRef.current.setZoom(17);
        setPin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setBusy(false);
        toast.error("লোকেশন অ্যাক্সেসের অনুমতি দিন");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="ঠিকানা খুঁজুন"
            className="pl-9"
          />
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
                {selected.plus_code ? ` · ${selected.plus_code}` : ""}
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
