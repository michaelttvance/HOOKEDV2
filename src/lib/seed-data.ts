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

const now = Date.now();
const m = (n: number) => now - n * 60_000;

export const seedDrivers: Driver[] = [
  { id: "d1", name: "Mike D.", truck: "T-07", status: "Available", etaMin: 0, lat: 38, lng: 42, distanceMi: 2.1 },
  { id: "d2", name: "Sara P.", truck: "T-12", status: "EnRoute", etaMin: 9, lat: 62, lng: 28, distanceMi: 4.3 },
  { id: "d3", name: "Luis R.", truck: "T-03", status: "OnScene", etaMin: 0, lat: 24, lng: 70, distanceMi: 6.0 },
  { id: "d4", name: "Jess K.", truck: "T-18", status: "Available", etaMin: 0, lat: 70, lng: 60, distanceMi: 3.4 },
];

export const seedJobs: Job[] = [
  {
    id: "j1", caller: "Amanda Reyes", phone: "(415) 555-0132",
    location: "I-280 N, mile 42", vehicle: "2019 Honda Civic",
    type: "Tow", priority: "Urgent", receivedAt: m(7), status: "Unassigned",
    estPrice: 185, estDurationMin: 55, billing: "Pending",
    notes: "Stalled in left lane, hazards on.",
    lat: 30, lng: 35,
  },
  {
    id: "j2", caller: "Devon Park", phone: "(415) 555-0188",
    location: "742 Market St", vehicle: "2021 Tesla Model 3",
    type: "Lockout", priority: "Standard", receivedAt: m(3), status: "Unassigned",
    estPrice: 75, estDurationMin: 25, billing: "Pending",
    lat: 55, lng: 50,
  },
  {
    id: "j3", caller: "Priya Shah", phone: "(415) 555-0166",
    location: "Costco lot, Daly City", vehicle: "2017 Toyota RAV4",
    type: "Jumpstart", priority: "Low", receivedAt: m(2), status: "Unassigned",
    estPrice: 65, estDurationMin: 20, billing: "Pending",
    lat: 68, lng: 22,
  },
  {
    id: "j4", caller: "Marcus Lee", phone: "(415) 555-0119",
    location: "Hwy 101 S, exit 432", vehicle: "2014 Ford F-150",
    type: "Tire", priority: "Standard", receivedAt: m(12), status: "Assigned",
    assignedDriverId: "d2", estPrice: 95, estDurationMin: 30, billing: "Pending",
    lat: 62, lng: 28,
  },
  {
    id: "j5", caller: "Nina Alvarez", phone: "(415) 555-0144",
    location: "Mission Bay Garage L2", vehicle: "2020 BMW X3",
    type: "Tow", priority: "Standard", receivedAt: m(18), status: "EnRoute",
    assignedDriverId: "d2", estPrice: 185, estDurationMin: 55, billing: "Pending",
    lat: 50, lng: 45,
  },
  {
    id: "j6", caller: "Ethan Wu", phone: "(415) 555-0177",
    location: "Off-road, Marin Headlands", vehicle: "2016 Jeep Wrangler",
    type: "Winch", priority: "Standard", receivedAt: m(28), status: "OnScene",
    assignedDriverId: "d3", estPrice: 245, estDurationMin: 70, billing: "Pending",
    lat: 24, lng: 70,
  },
];

// 30-day history with revenue trend
const TYPES: JobType[] = ["Tow", "Lockout", "Jumpstart", "Tire", "Winch"];
const NAMES = ["A. Chen", "R. Brooks", "M. Patel", "K. Sato", "J. Romero", "L. Nguyen", "B. Carter", "S. Okafor", "T. Hayes", "F. Diaz"];
const DRIVER_NAMES = ["Mike D.", "Sara P.", "Luis R.", "Jess K."];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const seedHistory: HistoryJob[] = (() => {
  const r = rng(42);
  const out: HistoryJob[] = [];
  for (let d = 29; d >= 0; d--) {
    const count = 3 + Math.floor(r() * 6); // 3-8 jobs/day
    const day = new Date();
    day.setDate(day.getDate() - d);
    const iso = day.toISOString().slice(0, 10);
    for (let i = 0; i < count; i++) {
      const t = TYPES[Math.floor(r() * TYPES.length)];
      const preset = JOB_PRESETS[t];
      const amount = preset.price + Math.floor((r() - 0.5) * 40);
      const billRoll = r();
      const billing: BillingStatus =
        billRoll < 0.62 ? "Paid" : billRoll < 0.88 ? "Invoiced" : "Pending";
      out.push({
        id: `h-${d}-${i}`,
        date: iso,
        caller: NAMES[Math.floor(r() * NAMES.length)],
        type: t,
        driver: DRIVER_NAMES[Math.floor(r() * DRIVER_NAMES.length)],
        amount,
        billing,
        responseMin: 6 + Math.floor(r() * 18),
      });
    }
  }
  return out.reverse(); // newest first
})();

export const seedChat: ChatMsg[] = [
  { id: "c1", role: "ai", at: m(22), text: "Morning! 6 active jobs. 2 urgent unassigned — want me to suggest drivers?" },
  { id: "c2", role: "user", at: m(21), text: "Yes, who's closest to I-280?" },
  { id: "c3", role: "ai", at: m(21), text: "Mike D. (T-07) is 2.1 mi away and Available. Recommended for J-1 (Honda Civic, urgent)." },
  { id: "c4", role: "user", at: m(15), text: "How's revenue today?" },
  { id: "c5", role: "ai", at: m(15), text: "$1,420 across 9 completed jobs. Avg response 11 min — 18% faster than last week." },
];
