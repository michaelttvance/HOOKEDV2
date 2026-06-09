import { useEffect, useRef } from "react";
import { Navigation } from "lucide-react";
import type { Job } from "../lib/seed-data";
import { useGoogleMaps, toLatLng, MAP_STYLE } from "../lib/maps";

export function DriverMiniMap({ job }: { job: Job }) {
  const { status } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current) return;
    const pos = toLatLng(job);
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: pos,
        zoom: 14,
        styles: MAP_STYLE,
        disableDefaultUI: true,
        backgroundColor: "#0b1220",
        gestureHandling: "none",
        clickableIcons: false,
      });
    } else {
      mapRef.current.setCenter(pos);
    }
    markerRef.current?.setMap(null);
    markerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: pos,
      icon: {
        path: "M 0,-14 C -7,-14 -12,-9 -12,-3 C -12,5 0,14 0,14 C 0,14 12,5 12,-3 C 12,-9 7,-14 0,-14 Z",
        fillColor: "#facc15",
        fillOpacity: 1,
        strokeColor: "#0b1220",
        strokeWeight: 2,
        scale: 1,
        anchor: new google.maps.Point(0, 14),
      },
    });
  }, [status, job.id, job.lat, job.lng]);

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}&travelmode=driving`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative h-40 w-full">
        <div ref={containerRef} className="absolute inset-0" />
        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
            {status === "loading" ? "Loading map…" : "Map unavailable"}
          </div>
        )}
      </div>
      <a
        href={navUrl}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.99]"
      >
        <Navigation className="h-4 w-4" /> Navigate
      </a>
    </div>
  );
}
