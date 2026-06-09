import { useEffect, useState } from "react";

// Seed data uses 0..100 % offsets. Map them onto the SF Bay Area so the
// pins land on a real map.
const ORIGIN_LAT = 37.82;
const ORIGIN_LNG = -122.52;
const SPAN_LAT = 0.28;
const SPAN_LNG = 0.36;

export function toLatLng(p: { lat: number; lng: number }): google.maps.LatLngLiteral {
  return {
    lat: ORIGIN_LAT - (p.lng / 100) * SPAN_LAT,
    lng: ORIGIN_LNG + (p.lat / 100) * SPAN_LNG,
  };
}

export const MAP_CENTER: google.maps.LatLngLiteral = {
  lat: ORIGIN_LAT - SPAN_LAT / 2,
  lng: ORIGIN_LNG + SPAN_LNG / 2,
};

export const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b95a7" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1a2336" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a2336" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0b1220" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a3550" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#070d18" }] },
];

let scriptPromise: Promise<typeof google> | null = null;

function loadScript(key: string, channel: string | undefined): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const cbName = "__hookai_gmaps_cb__";
    (window as any)[cbName] = () => resolve((window as any).google);
    const s = document.createElement("script");
    const channelParam = channel ? `&channel=${encodeURIComponent(channel)}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${cbName}${channelParam}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function useGoogleMaps() {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error" | "no-key";
    error?: string;
  }>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
        if (!key) {
          setState({ status: "no-key" });
          return;
        }
        await loadScript(key, undefined);
        if (!cancelled) setState({ status: "ready" });
      } catch (e: any) {
        if (!cancelled) setState({ status: "error", error: e?.message ?? "unknown" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
