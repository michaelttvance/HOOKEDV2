import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { sendDispatchChat, type DispatchSnapshot } from "./ai.functions";
import { sendSms } from "./sms.functions";
import { updateJobEta } from "./driver.functions";
import { notifyDriverNewJob } from "./push.functions";
import { trackingUrl } from "./media";
import {
  JOB_PRESETS,
  type Driver,
  type Job,
  type JobStatus,
  type JobType,
  type JobPriority,
  type HistoryJob,
  type ChatMsg,
  type BillingStatus,
  type Certification,
} from "./seed-data";
import {
  mapDriver,
  mapJob,
  mapHistory,
  splitVehicle,
  DRIVER_STATUS_DB,
  JOB_STATUS_DB,
  BILLING_DB,
} from "./db-mappers";

export interface SmsTemplates {
  assigned: string;
  on_scene: string;
  complete: string;
}

export interface PricingConfig {
  base: { Tow: number; Lockout: number; Jumpstart: number; Tire: number; Winch: number; Other: number };
  mileage: { perMile: number; freeMiles: number };
  afterHours: { enabled: boolean; amount: number; startHour: number; endHour: number };
  weekend: { enabled: boolean; amount: number };
  holiday: { enabled: boolean; multiplier: number };
  fees: {
    oversized: { enabled: boolean; amount: number };
    hazmat: { enabled: boolean; amount: number };
    longWait: { enabled: boolean; amount: number };
    storage: { enabled: boolean; amount: number };
    secondTruck: { enabled: boolean; amount: number };
    highway: { enabled: boolean; amount: number };
  };
}

export const DEFAULT_PRICING: PricingConfig = {
  base: { Tow: 75, Lockout: 55, Jumpstart: 45, Tire: 50, Winch: 95, Other: 60 },
  mileage: { perMile: 4.5, freeMiles: 5 },
  afterHours: { enabled: true, amount: 25, startHour: 21, endHour: 6 },
  weekend: { enabled: true, amount: 15 },
  holiday: { enabled: true, multiplier: 1.5 },
  fees: {
    oversized: { enabled: true, amount: 45 },
    hazmat: { enabled: true, amount: 65 },
    longWait: { enabled: true, amount: 35 },
    storage: { enabled: true, amount: 35 },
    secondTruck: { enabled: true, amount: 85 },
    highway: { enabled: true, amount: 20 },
  },
};

export interface SmsMessage {
  id: string;
  jobId: string | null;
  kind: string;
  toPhone: string;
  body: string;
  status: string;
  createdAt: number;
  sentAt: number | null;
}

interface DispatchState {
  drivers: Driver[];
  jobs: Job[];
  history: HistoryJob[];
  chat: ChatMsg[];
  backupAlerts: BackupAlert[];
  smsByJob: Record<string, SmsMessage[]>;
  smsTemplates: SmsTemplates;
  pricing: PricingConfig;
  companyName: string;
  googleReviewUrl: string;
  selectedJobId: string | null;
  detailJobId: string | null;
  activeDriverJobId: string | null;
  setSelectedJob: (id: string | null) => void;
  openJobDetail: (id: string | null) => void;
  assignJob: (jobId: string, driverId: string) => Promise<void> | void;
  createJob: (input: NewJobInput) => Promise<Job | null>;
  addDriver: (input: NewDriverInput) => Promise<Driver | null>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void> | void;
  setActiveDriverJob: (jobId: string) => void;
  invoiceHistory: (id: string) => void;
  sendChat: (text: string) => void;
  bestDriverFor: (jobId: string) => Driver | null;
  requestBackup: (jobId: string) => void;
  dismissBackup: (id: string) => void;
  updateSmsTemplates: (next: SmsTemplates) => Promise<void>;
  updatePricing: (next: PricingConfig) => Promise<void>;
  updateGoogleReviewUrl: (url: string) => Promise<void>;
}

export interface BackupAlert {
  id: string;
  driverId: string;
  driverName: string;
  jobId: string;
  location: string;
  at: number;
}

export interface NewDriverInput {
  name: string;
  truck: string;
  phone: string;
  certifications: Certification[];
}

export interface NewJobInput {
  caller: string;
  phone: string;
  location: string;
  vehicle: string;
  type: JobType;
  notes?: string;
  priority?: JobPriority;
}

const Ctx = createContext<DispatchState | null>(null);

export function DispatchProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const notifyNewJob = useServerFn(notifyDriverNewJob);
  const { user, profile } = useAuth();
  const companyId = profile.companyId;
  const enabled = !!user && !!companyId;

  // ───────────── live queries ─────────────
  const driversQ = useQuery({
    queryKey: ["drivers", companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapDriver);
    },
  });

  const jobsQ = useQuery({
    queryKey: ["jobs", companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapJob);
    },
  });

  const historyQ = useQuery({
    queryKey: ["completed_jobs", companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("completed_jobs")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(mapHistory);
    },
  });

  const smsQ = useQuery({
    queryKey: ["sms_messages", companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("sms_messages" as any) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const companyQ = useQuery({
    queryKey: ["company", companyId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,sms_templates,pricing,google_review_url" as any)
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const drivers = driversQ.data ?? [];
  const jobs = jobsQ.data ?? [];
  const history = historyQ.data ?? [];

  const defaultTemplates: SmsTemplates = {
    assigned: "Hi {name}, your driver {driver} is on the way in Truck {truck}. ETA {eta} min. Questions? Call {phone}.",
    on_scene: "Hi {name}, your driver has arrived at your location.",
    complete: "Hi {name}, your service is complete. Invoice $ {amount} is ready. Thank you! — {company}",
  };
  const smsTemplates: SmsTemplates = (companyQ.data?.sms_templates as SmsTemplates) ?? defaultTemplates;
  const pricing: PricingConfig = (companyQ.data?.pricing as PricingConfig) ?? DEFAULT_PRICING;
  const companyName: string = companyQ.data?.name ?? profile.companyName ?? "Hooked";
  const googleReviewUrl: string = (companyQ.data?.google_review_url as string) ?? "";

  const smsByJob: Record<string, SmsMessage[]> = {};
  for (const r of (smsQ.data ?? [])) {
    const m: SmsMessage = {
      id: r.id,
      jobId: r.job_id,
      kind: r.kind,
      toPhone: r.to_phone,
      body: r.body,
      status: r.status,
      createdAt: new Date(r.created_at).getTime(),
      sentAt: r.sent_at ? new Date(r.sent_at).getTime() : null,
    };
    if (m.jobId) (smsByJob[m.jobId] ||= []).push(m);
  }

  // ───────────── realtime ─────────────
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`co-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["jobs", companyId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["drivers", companyId] }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "completed_jobs",
          filter: `company_id=eq.${companyId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["completed_jobs", companyId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sms_messages", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["sms_messages", companyId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, companyId, qc]);

  // ───────────── local UI state ─────────────
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [activeDriverJobId, setActiveDriverJobId] = useState<string | null>(null);
  const [backupAlerts, setBackupAlerts] = useState<BackupAlert[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      id: "c0",
      role: "ai",
      at: Date.now(),
      text: "Hi! I'm watching the board. Ask me anything about jobs, drivers, or today's numbers.",
    },
  ]);

  // Auto-select first job once loaded
  useEffect(() => {
    if (!selectedJobId && jobs.length) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);
  useEffect(() => {
    if (!activeDriverJobId) {
      const mine = jobs.find((j) => j.assignedDriverId);
      if (mine) setActiveDriverJobId(mine.id);
    }
  }, [jobs, activeDriverJobId]);

  // ───────────── derived helpers ─────────────
  const bestDriverFor = useCallback(
    (jobId: string) => {
      const j = jobs.find((x) => x.id === jobId);
      if (!j) return null;
      const avail = drivers.filter((d) => d.status === "Available");
      if (!avail.length) return null;
      return [...avail].sort((a, b) => a.distanceMi - b.distanceMi)[0];
    },
    [jobs, drivers],
  );

  // ───────────── SMS helpers ─────────────
  const renderTemplate = useCallback(
    (tpl: string, vars: Record<string, string | number | undefined | null>) =>
      tpl.replace(/\{(\w+)\}/g, (_, k) => {
        const v = vars[k];
        return v === undefined || v === null ? "" : String(v);
      }),
    [],
  );

  const enqueueSms = useCallback(
    async (jobId: string, kind: "assigned" | "on_scene" | "complete", body: string, toPhone: string) => {
      if (!companyId || !toPhone) return;
      const { data: row } = await (supabase.from("sms_messages" as any) as any)
        .insert({
          company_id: companyId,
          job_id: jobId,
          kind,
          to_phone: toPhone,
          body,
          status: "queued",
        })
        .select("id")
        .single();
      qc.invalidateQueries({ queryKey: ["sms_messages", companyId] });

      try {
        await sendSms({ data: { to: toPhone, body } });
        if (row?.id) {
          await (supabase.from("sms_messages" as any) as any)
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", row.id);
        }
      } catch (err) {
        console.error("SMS send failed", err);
        if (row?.id) {
          await (supabase.from("sms_messages" as any) as any)
            .update({ status: "failed", error: err instanceof Error ? err.message : String(err) })
            .eq("id", row.id);
        }
      }
      qc.invalidateQueries({ queryKey: ["sms_messages", companyId] });
    },
    [companyId, qc],
  );

  // ───────────── mutations ─────────────
  const assignJob = useCallback(
    async (jobId: string, driverId: string) => {
      const driver = drivers.find((d) => d.id === driverId);
      const job = jobs.find((j) => j.id === jobId);
      const etaMin = driver ? Math.max(5, Math.round(driver.distanceMi * 3)) : 10;
      await Promise.all([
        supabase
          .from("jobs")
          .update({ assigned_driver_id: driverId, status: "assigned", assigned_at: new Date().toISOString() } as any)
          .eq("id", jobId),
        supabase
          .from("drivers")
          .update({ status: "en_route", eta_min: etaMin, current_job_id: jobId })
          .eq("id", driverId),
      ]);
      // Queue assigned SMS (with live tracking link)
      if (job && driver && job.phone) {
        let body = renderTemplate(smsTemplates.assigned, {
          name: job.caller.split(" ")[0],
          driver: driver.name,
          truck: driver.truck,
          eta: etaMin,
          phone: driver.phone ?? "",
          company: companyName,
        });
        if (job.publicToken) {
          body += ` Track your driver live: ${trackingUrl(jobId, job.publicToken)}`;
        }
        await enqueueSms(jobId, "assigned", body, job.phone);
      }
      notifyNewJob({ data: { jobId } }).catch((err) => console.error("push notify failed", err));
      qc.invalidateQueries({ queryKey: ["jobs", companyId] });
      qc.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    [drivers, jobs, qc, companyId, smsTemplates, companyName, renderTemplate, enqueueSms, notifyNewJob],
  );

  const createJob = useCallback(
    async (input: NewJobInput): Promise<Job | null> => {
      if (!companyId) return null;
      const preset = JOB_PRESETS[input.type];
      const v = splitVehicle(input.vehicle);
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          company_id: companyId,
          customer_name: input.caller,
          customer_phone: input.phone,
          location: input.location,
          vehicle_year: v.year,
          vehicle_make: v.make,
          vehicle_model: v.model,
          job_type: input.type,
          priority: input.priority ?? "Standard",
          status: "unassigned",
          notes: input.notes,
          estimated_price: preset.price,
          estimated_duration: preset.durationMin,
          lat: 30 + Math.random() * 40,
          lng: 25 + Math.random() * 50,
        })
        .select("*")
        .single();
      if (error || !data) return null;
      qc.invalidateQueries({ queryKey: ["jobs", companyId] });
      return mapJob(data);
    },
    [companyId, qc],
  );

  const addDriver = useCallback(
    async (input: NewDriverInput): Promise<Driver | null> => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("drivers")
        .insert({
          company_id: companyId,
          name: input.name,
          truck_number: input.truck,
          phone: input.phone,
          certifications: input.certifications,
          status: "available",
          location_lat: 30 + Math.random() * 40,
          location_lng: 25 + Math.random() * 50,
          distance_mi: Math.round(Math.random() * 80) / 10 + 1,
        })
        .select("*")
        .single();
      if (error || !data) return null;
      qc.invalidateQueries({ queryKey: ["drivers", companyId] });
      return mapDriver(data);
    },
    [companyId, qc],
  );

  const updateJobStatus = useCallback(
    async (jobId: string, status: JobStatus) => {
      const j = jobs.find((x) => x.id === jobId);
      if (status === "Complete") {
        // Queue complete SMS BEFORE deleting the job row (uses current job data).
        // The review ask rides along in the same text — reliable even if this tab closes.
        if (j && j.phone) {
          let body = renderTemplate(smsTemplates.complete, {
            name: j.caller.split(" ")[0],
            amount: j.estPrice,
            company: companyName,
          });
          if (googleReviewUrl && j.priority !== "Urgent") {
            body += ` Loved the service? A quick review means the world to us: ${googleReviewUrl}`;
          }
          await enqueueSms(jobId, "complete", body, j.phone);
        }
        const { error } = await supabase.rpc("complete_job", { _job_id: jobId });
        if (error) console.error("complete_job error", error);
        qc.invalidateQueries({ queryKey: ["jobs", companyId] });
        qc.invalidateQueries({ queryKey: ["drivers", companyId] });
        qc.invalidateQueries({ queryKey: ["completed_jobs", companyId] });
        return;
      }
      const patch: Record<string, unknown> = {
        status: JOB_STATUS_DB[status] as "unassigned" | "assigned" | "en_route" | "on_scene" | "complete",
      };
      if (status === "Assigned") patch.assigned_at = new Date().toISOString();
      if (status === "EnRoute") patch.en_route_at = new Date().toISOString();
      if (status === "OnScene") patch.on_scene_at = new Date().toISOString();
      await supabase.from("jobs").update(patch as any).eq("id", jobId);
      if (j?.assignedDriverId) {
        const dStatus = status === "OnScene" ? ("on_scene" as const) : ("en_route" as const);
        await supabase.from("drivers").update({ status: dStatus }).eq("id", j.assignedDriverId);
      }
      // Queue on_scene SMS
      if (status === "OnScene" && j && j.phone) {
        const body = renderTemplate(smsTemplates.on_scene, { name: j.caller.split(" ")[0] });
        await enqueueSms(jobId, "on_scene", body, j.phone);
      }
      // Recalculate live ETA from driver's current GPS when going En Route
      if (status === "EnRoute") {
        updateJobEta({ data: { jobId } })
          .then(() => {
            qc.invalidateQueries({ queryKey: ["jobs", companyId] });
            qc.invalidateQueries({ queryKey: ["drivers", companyId] });
          })
          .catch((err) => console.error("updateJobEta failed", err));
      }
      qc.invalidateQueries({ queryKey: ["jobs", companyId] });
      qc.invalidateQueries({ queryKey: ["drivers", companyId] });
    },
    [jobs, qc, companyId, smsTemplates, companyName, renderTemplate, enqueueSms, googleReviewUrl],
  );

  const updateSmsTemplates = useCallback(
    async (next: SmsTemplates) => {
      if (!companyId) return;
      await supabase.from("companies").update({ sms_templates: next as any } as any).eq("id", companyId);
      qc.invalidateQueries({ queryKey: ["company", companyId] });
    },
    [companyId, qc],
  );

  const updatePricing = useCallback(
    async (next: PricingConfig) => {
      if (!companyId) return;
      await supabase.from("companies").update({ pricing: next as any } as any).eq("id", companyId);
      qc.invalidateQueries({ queryKey: ["company", companyId] });
    },
    [companyId, qc],
  );

  const updateGoogleReviewUrl = useCallback(
    async (url: string) => {
      if (!companyId) return;
      await supabase
        .from("companies")
        .update({ google_review_url: url || null } as any)
        .eq("id", companyId);
      qc.invalidateQueries({ queryKey: ["company", companyId] });
    },
    [companyId, qc],
  );

  const invoiceHistory = useCallback(
    async (id: string) => {
      const h = history.find((x) => x.id === id);
      if (!h) return;
      const next: BillingStatus = h.billing === "Pending" ? "Invoiced" : "Paid";
      await supabase
        .from("completed_jobs")
        .update({ payment_status: BILLING_DB[next] as "paid" | "invoiced" | "pending" })
        .eq("id", id);
      qc.invalidateQueries({ queryKey: ["completed_jobs", companyId] });
    },
    [history, qc, companyId],
  );

  // ───────────── backup alerts (local) ─────────────
  const requestBackup = useCallback(
    (jobId: string) => {
      const j = jobs.find((x) => x.id === jobId);
      if (!j || !j.assignedDriverId) return;
      const d = drivers.find((x) => x.id === j.assignedDriverId);
      if (!d) return;
      setBackupAlerts((prev) =>
        prev.some((a) => a.jobId === jobId)
          ? prev
          : [
              ...prev,
              {
                id: `b${Date.now()}`,
                driverId: d.id,
                driverName: d.name,
                jobId: j.id,
                location: j.location,
                at: Date.now(),
              },
            ],
      );
    },
    [jobs, drivers],
  );
  const dismissBackup = useCallback(
    (id: string) => setBackupAlerts((p) => p.filter((a) => a.id !== id)),
    [],
  );

  // ───────────── AI chat ─────────────
  const jobsRef = useRef(jobs);
  const driversRef = useRef(drivers);
  const historyRef = useRef(history);
  const chatRef = useRef(chat);
  jobsRef.current = jobs;
  driversRef.current = drivers;
  historyRef.current = history;
  chatRef.current = chat;

  const sendChat = useCallback((text: string) => {
    const userMsg: ChatMsg = { id: `c${Date.now()}`, role: "user", text, at: Date.now() };
    setChat((c) => [...c, userMsg]);
    const snapshot = buildSnapshot(jobsRef.current, driversRef.current, historyRef.current);
    const history10 = chatRef.current.slice(-10).map((m) => ({
      role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
      text: m.text,
    }));
    sendDispatchChat({ data: { message: text, history: history10, snapshot } })
      .then((res) => {
        setChat((c) => [
          ...c,
          {
            id: `c${Date.now() + 1}`,
            role: "ai",
            at: Date.now(),
            text: res.ok ? res.text : `⚠️ ${res.error}`,
          },
        ]);
      })
      .catch((err: unknown) => {
        const m = err instanceof Error ? err.message : String(err);
        setChat((c) => [
          ...c,
          { id: `c${Date.now() + 1}`, role: "ai", at: Date.now(), text: `⚠️ ${m}` },
        ]);
      });
  }, []);

  const setActiveDriverJob = useCallback((jobId: string) => setActiveDriverJobId(jobId), []);

  const value = useMemo<DispatchState>(
    () => ({
      drivers,
      jobs,
      history,
      chat,
      backupAlerts,
      smsByJob,
      smsTemplates,
      pricing,
      companyName,
      googleReviewUrl,
      selectedJobId,
      detailJobId,
      activeDriverJobId,
      setSelectedJob: setSelectedJobId,
      openJobDetail: setDetailJobId,
      assignJob,
      createJob,
      addDriver,
      updateJobStatus,
      setActiveDriverJob,
      invoiceHistory,
      sendChat,
      bestDriverFor,
      requestBackup,
      dismissBackup,
      updateSmsTemplates,
      updatePricing,
      updateGoogleReviewUrl,
    }),
    [
      drivers,
      jobs,
      history,
      chat,
      backupAlerts,
      smsByJob,
      smsTemplates,
      pricing,
      companyName,
      googleReviewUrl,
      selectedJobId,
      detailJobId,
      activeDriverJobId,
      assignJob,
      createJob,
      addDriver,
      updateJobStatus,
      setActiveDriverJob,
      invoiceHistory,
      sendChat,
      bestDriverFor,
      requestBackup,
      dismissBackup,
      updateSmsTemplates,
      updatePricing,
      updateGoogleReviewUrl,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function buildSnapshot(jobs: Job[], drivers: Driver[], history: HistoryJob[]): DispatchSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  const todays = history.filter((h) => h.date === today);
  const todayHistory = {
    date: today,
    jobs: todays.length,
    revenue: todays.reduce((s, h) => s + h.amount, 0),
    avgResponseMin: todays.length
      ? Math.round(todays.reduce((s, h) => s + h.responseMin, 0) / todays.length)
      : 0,
  };
  const byDate = new Map<string, { jobs: number; revenue: number; respSum: number }>();
  history.forEach((h) => {
    const cur = byDate.get(h.date) ?? { jobs: 0, revenue: 0, respSum: 0 };
    cur.jobs += 1;
    cur.revenue += h.amount;
    cur.respSum += h.responseMin;
    byDate.set(h.date, cur);
  });
  const recentHistory = [...byDate.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([date, v]) => ({
      date,
      jobs: v.jobs,
      revenue: v.revenue,
      avgResponseMin: Math.round(v.respSum / v.jobs),
    }));
  return {
    jobs: jobs.map((j) => ({
      id: j.id,
      caller: j.caller,
      location: j.location,
      vehicle: j.vehicle,
      type: j.type,
      priority: j.priority,
      status: j.status,
      receivedAgoMin: Math.max(0, Math.round((Date.now() - j.receivedAt) / 60000)),
      assignedDriver: j.assignedDriverId
        ? drivers.find((d) => d.id === j.assignedDriverId)?.name ?? null
        : null,
      estPrice: j.estPrice,
      estDurationMin: j.estDurationMin,
    })),
    drivers: drivers.map((d) => ({
      id: d.id,
      name: d.name,
      truck: d.truck,
      status: d.status,
      distanceMi: d.distanceMi,
      etaMin: d.etaMin,
      certifications: d.certifications,
    })),
    todayHistory,
    recentHistory,
  };
}

export function useDispatch() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDispatch must be used inside DispatchProvider");
  return ctx;
}
