import { useEffect, useRef } from "react";
import type { Driver, Job } from "../lib/seed-data";
import { useGoogleMaps, toLatLng, MAP_CENTER, MAP_STYLE } from "../lib/maps";

interface Props {
  jobs: Job[];
  drivers: Driver[];
  selectedJob: Job | null;
}

function driverColor(status: Driver["status"]) {
  if (status === "Available") return "#22c55e"; // green
  if (status === "EnRoute") return "#eab308"; // yellow
  if (status === "OnScene") return "#ef4444"; // red
  return "#64748b";
}

export function DispatchMap({ jobs, drivers, selectedJob }: Props) {
  const { status } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const driverMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const jobMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const pulseCircleRef = useRef<google.maps.Circle | null>(null);

  // Init map
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(containerRef.current, {
      center: MAP_CENTER,
      zoom: 11,
      styles: MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      backgroundColor: "#0b1220",
      gestureHandling: "greedy",
    });
  }, [status]);

  // Sync driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const d of drivers) {
      seen.add(d.id);
      const pos = toLatLng(d);
      const color = driverColor(d.status);
      const existing = driverMarkersRef.current.get(d.id);
      const icon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#0b1220",
        strokeWeight: 2,
      };
      if (existing) {
        existing.setPosition(pos);
        existing.setIcon(icon);
        existing.setTitle(`${d.name} · Truck ${d.truck} · ${d.status}`);
      } else {
        const m = new google.maps.Marker({
          map,
          position: pos,
          icon,
          title: `${d.name} · Truck ${d.truck} · ${d.status}`,
          label: { text: d.truck.replace("T-", ""), color: "#0b1220", fontSize: "10px", fontWeight: "700" },
        });
        driverMarkersRef.current.set(d.id, m);
      }
    }
    for (const [id, m] of driverMarkersRef.current) {
      if (!seen.has(id)) {
        m.setMap(null);
        driverMarkersRef.current.delete(id);
      }
    }
  }, [drivers, status]);

  // Sync job markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const j of jobs) {
      seen.add(j.id);
      const pos = toLatLng(j);
      const color = j.priority === "Urgent" ? "#ef4444" : j.priority === "Standard" ? "#eab308" : "#94a3b8";
      const icon: google.maps.Symbol = {
        path: "M 0,-12 C -6,-12 -10,-8 -10,-3 C -10,4 0,12 0,12 C 0,12 10,4 10,-3 C 10,-8 6,-12 0,-12 Z",
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#0b1220",
        strokeWeight: 2,
        scale: 1,
        anchor: new google.maps.Point(0, 12),
      };
      const existing = jobMarkersRef.current.get(j.id);
      if (existing) {
        existing.setPosition(pos);
        existing.setIcon(icon);
      } else {
        const m = new google.maps.Marker({ map, position: pos, icon, title: `${j.caller} · ${j.type}` });
        jobMarkersRef.current.set(j.id, m);
      }
    }
    for (const [id, m] of jobMarkersRef.current) {
      if (!seen.has(id)) {
        m.setMap(null);
        jobMarkersRef.current.delete(id);
      }
    }
  }, [jobs, status]);

  // Pulsing selected marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pulseCircleRef.current) {
      pulseCircleRef.current.setMap(null);
      pulseCircleRef.current = null;
    }
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }
    if (!selectedJob) return;
    const pos = toLatLng(selectedJob);
    map.panTo(pos);

    const circle = new google.maps.Circle({
      map,
      center: pos,
      radius: 200,
      strokeColor: "#facc15",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#facc15",
      fillOpacity: 0.18,
    });
    pulseCircleRef.current = circle;

    // Animate radius for a "pulse"
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const phase = ((t - start) % 1600) / 1600;
      const r = 180 + phase * 420;
      circle.setRadius(r);
      circle.setOptions({ fillOpacity: 0.25 * (1 - phase), strokeOpacity: 0.9 * (1 - phase) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const marker = new google.maps.Marker({
      map,
      position: pos,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#facc15",
        fillOpacity: 1,
        strokeColor: "#0b1220",
        strokeWeight: 2,
      },
      zIndex: 999,
    });
    selectedMarkerRef.current = marker;

    return () => {
      cancelAnimationFrame(raf);
      circle.setMap(null);
      marker.setMap(null);
    };
  }, [selectedJob]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
      <div ref={containerRef} className="absolute inset-0" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground">
          {status === "loading" && "Loading map…"}
          {status === "no-key" && "Set GOOGLE_MAPS_API_KEY to enable the live map."}
          {status === "error" && "Map failed to load."}
        </div>
      )}
    </div>
  );
}
