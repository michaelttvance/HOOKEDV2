import type {
  Driver,
  DriverStatus,
  Job,
  JobPhoto,
  JobStatus,
  JobType,
  JobPriority,
  HistoryJob,
  BillingStatus,
  Certification,
} from "./seed-data";

type Row = Record<string, unknown>;

const DRIVER_STATUS_MAP: Record<string, DriverStatus> = {
  available: "Available",
  en_route: "EnRoute",
  on_scene: "OnScene",
  off: "Off",
};

export const DRIVER_STATUS_DB: Record<DriverStatus, string> = {
  Available: "available",
  EnRoute: "en_route",
  OnScene: "on_scene",
  Off: "off",
};

const JOB_STATUS_MAP: Record<string, JobStatus> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  en_route: "EnRoute",
  on_scene: "OnScene",
  complete: "Complete",
};

export const JOB_STATUS_DB: Record<JobStatus, string> = {
  Unassigned: "unassigned",
  Assigned: "assigned",
  EnRoute: "en_route",
  OnScene: "on_scene",
  Complete: "complete",
};

const BILLING_MAP: Record<string, BillingStatus> = {
  paid: "Paid",
  invoiced: "Invoiced",
  pending: "Pending",
};

export const BILLING_DB: Record<BillingStatus, string> = {
  Paid: "paid",
  Invoiced: "invoiced",
  Pending: "pending",
};

export function mapDriver(r: Row): Driver {
  return {
    id: r.id as string,
    name: r.name as string,
    truck: r.truck_number as string,
    phone: (r.phone as string | null) ?? undefined,
    status: DRIVER_STATUS_MAP[r.status as string] ?? "Off",
    etaMin: (r.eta_min as number) ?? 0,
    lat: (r.location_lat as number) ?? 50,
    lng: (r.location_lng as number) ?? 50,
    distanceMi: Number(r.distance_mi ?? 5),
    certifications: ((r.certifications as string[] | null) ?? []) as Certification[],
    userId: (r.user_id as string | null) ?? undefined,
  };
}

export function mapJob(r: Row): Job {
  const year = r.vehicle_year as number | null;
  const make = (r.vehicle_make as string | null) ?? "";
  const model = (r.vehicle_model as string | null) ?? "";
  const vehicle = [year, make, model].filter(Boolean).join(" ").trim() || "—";
  return {
    id: r.id as string,
    caller: r.customer_name as string,
    phone: (r.customer_phone as string | null) ?? "",
    location: r.location as string,
    vehicle,
    type: r.job_type as JobType,
    priority: r.priority as JobPriority,
    notes: (r.notes as string | null) ?? undefined,
    receivedAt: new Date(r.created_at as string).getTime(),
    status: JOB_STATUS_MAP[r.status as string] ?? "Unassigned",
    assignedDriverId: (r.assigned_driver_id as string | null) ?? undefined,
    estPrice: Number(r.estimated_price ?? 0),
    estDurationMin: (r.estimated_duration as number) ?? 30,
    billing: "Pending",
    lat: (r.lat as number) ?? 50,
    lng: (r.lng as number) ?? 50,
    isIncoming: Boolean(r.is_incoming),
    assignedAt: r.assigned_at ? new Date(r.assigned_at as string).getTime() : undefined,
    enRouteAt: r.en_route_at ? new Date(r.en_route_at as string).getTime() : undefined,
    onSceneAt: r.on_scene_at ? new Date(r.on_scene_at as string).getTime() : undefined,
    publicToken: (r.public_token as string) ?? "",
    photos: mapPhotos(r.photos),
    signatureUrl: (r.signature_url as string | null) ?? undefined,
  };
}

function mapPhotos(raw: unknown): JobPhoto[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((p): JobPhoto[] => {
    if (!p || typeof p !== "object") return [];
    const row = p as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label : "";
    if (!label) return [];
    const ts = typeof row.ts === "number" ? row.ts : Date.now();
    // Legacy rows store a public URL here today; future private-media rows can store a path/key
    // in the same slot and still render through the compatibility helper in `src/lib/media.ts`.
    const url = typeof row.url === "string" && row.url.trim().length > 0
      ? row.url.trim()
      : typeof row.path === "string" && row.path.trim().length > 0
        ? row.path.trim()
        : "";
    if (!url) return [];
    return [{ url, label, ts }];
  });
}

export function mapHistory(r: Row): HistoryJob {
  return {
    id: r.id as string,
    date: new Date(r.completed_at as string).toISOString().slice(0, 10),
    caller: r.customer_name as string,
    type: r.job_type as JobType,
    driver: ((r.driver_name as string | null) ?? "—"),
    amount: Number(r.price ?? 0),
    billing: BILLING_MAP[r.payment_status as string] ?? "Pending",
    responseMin: (r.response_minutes as number) ?? 10,
    completedAt: new Date(r.completed_at as string).getTime(),
    photos: mapPhotos(r.photos),
    signatureUrl: (r.signature_url as string | null) ?? undefined,
  };
}

export function splitVehicle(vehicle: string): {
  year: number | null;
  make: string | null;
  model: string | null;
} {
  const parts = vehicle.trim().split(/\s+/);
  const yearMaybe = Number(parts[0]);
  if (Number.isFinite(yearMaybe) && yearMaybe > 1900 && yearMaybe < 2100) {
    return {
      year: yearMaybe,
      make: parts[1] ?? null,
      model: parts.slice(2).join(" ") || null,
    };
  }
  return { year: null, make: parts[0] ?? null, model: parts.slice(1).join(" ") || null };
}
