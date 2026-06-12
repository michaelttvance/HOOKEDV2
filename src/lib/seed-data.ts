export type JobType = "Tow" | "Lockout" | "Jumpstart" | "Tire" | "Winch";
export type JobPriority = "Urgent" | "Standard" | "Low";
export type JobStatus =
  | "Unassigned"
  | "Assigned"
  | "EnRoute"
  | "OnScene"
  | "Complete";
export type DriverStatus = "Available" | "EnRoute" | "OnScene" | "Off";
export type BillingStatus = "Paid" | "Invoiced" | "Pending";

export type Certification =
  | "Light Duty"
  | "Medium Duty"
  | "Heavy Duty"
  | "Motorcycle"
  | "Flatbed"
  | "Lockout";

export const ALL_CERTIFICATIONS: Certification[] = [
  "Light Duty",
  "Medium Duty",
  "Heavy Duty",
  "Motorcycle",
  "Flatbed",
  "Lockout",
];

export interface Driver {
  id: string;
  name: string;
  truck: string;
  phone?: string;
  status: DriverStatus;
  etaMin: number;
  lat: number; // 0..100 (map %)
  lng: number;
  distanceMi: number;
  certifications?: Certification[];
  userId?: string; // auth user linked to this driver (driver login)
}

export interface JobPhoto {
  url: string;
  /**
   * Legacy records only stored public URLs.
   * Future private-media rows can keep the renderable URL and also carry the storage path.
   */
  path?: string;
  label: string; // e.g. "Before tow", "After drop-off", "Scene"
  ts: number;
}

export interface Job {
  id: string;
  caller: string;
  phone: string;
  location: string;
  vehicle: string;
  type: JobType;
  priority: JobPriority;
  notes?: string;
  receivedAt: number; // ms epoch
  status: JobStatus;
  assignedDriverId?: string;
  estPrice: number;
  estDurationMin: number;
  billing: BillingStatus;
  lat: number;
  lng: number;
  isIncoming?: boolean;
  assignedAt?: number;
  enRouteAt?: number;
  onSceneAt?: number;
  publicToken?: string;
  photos?: JobPhoto[];
  signatureUrl?: string;
}

export interface HistoryJob {
  id: string;
  date: string; // ISO date
  caller: string;
  type: JobType;
  driver: string;
  amount: number;
  billing: BillingStatus;
  responseMin: number;
  completedAt?: number; // ms epoch
  photos?: JobPhoto[];
  signatureUrl?: string;
}

export interface ChatMsg {
  id: string;
  role: "user" | "ai";
  text: string;
  at: number;
}

export const JOB_PRESETS: Record<
  JobType,
  { price: number; durationMin: number }
> = {
  Tow: { price: 185, durationMin: 55 },
  Lockout: { price: 75, durationMin: 25 },
  Jumpstart: { price: 65, durationMin: 20 },
  Tire: { price: 95, durationMin: 30 },
  Winch: { price: 245, durationMin: 70 },
};
