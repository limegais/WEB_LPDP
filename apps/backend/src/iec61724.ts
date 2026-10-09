import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "./db/client";
import { dailyPerformance, devices, metricCatalog, plants, sensorReadings, sensors } from "./db/schema";

// Verify numeric limits against the IEC 61724-1:2021 text before claiming formal compliance.
const G_STC = 1000; // W/m2
const T_STC = 25; // degC
const DAYLIGHT_POA_MIN = 50; // W/m2, threshold for counting a bucket as daytime

type CatalogRow = typeof metricCatalog.$inferInsert;

export const METRIC_CATALOG: CatalogRow[] = [
  { code: "poa_irradiance_wm2", label: "Irradiance bidang modul (POA)", unit: "W/m2", category: "meteo", minValue: 0, maxValue: 1800, requiredClassA: true },
  { code: "ghi_wm2", label: "Irradiance horizontal (GHI)", unit: "W/m2", category: "meteo", minValue: 0, maxValue: 1500, requiredClassA: false },
  { code: "t_module_c", label: "Suhu modul (back-of-module)", unit: "C", category: "meteo", minValue: -40, maxValue: 120, requiredClassA: true },
  { code: "t_ambient_c", label: "Suhu ambient", unit: "C", category: "meteo", minValue: -40, maxValue: 60, requiredClassA: true },
  { code: "wind_speed_ms", label: "Kecepatan angin", unit: "m/s", category: "meteo", minValue: 0, maxValue: 80, requiredClassA: true },
  { code: "soiling_ratio_pct", label: "Soiling ratio", unit: "%", category: "meteo", minValue: 0, maxValue: 100, requiredClassA: true },
  { code: "rel_humidity_pct", label: "Kelembapan relatif", unit: "%", category: "meteo", minValue: 0, maxValue: 100, requiredClassA: false },
  { code: "ldr_raw", label: "LDR (indikator kasar, bukan untuk PR)", unit: "raw", category: "meteo", minValue: 0, maxValue: 65535, requiredClassA: false },
  { code: "dc_voltage_v", label: "Tegangan DC", unit: "V", category: "dc", minValue: 0, maxValue: 1600, requiredClassA: true },
  { code: "dc_current_a", label: "Arus DC", unit: "A", category: "dc", minValue: 0, maxValue: 500, requiredClassA: true },
  { code: "dc_power_kw", label: "Daya DC", unit: "kW", category: "dc", minValue: 0, maxValue: 100000, requiredClassA: true },
  { code: "ac_voltage_v", label: "Tegangan AC", unit: "V", category: "ac", minValue: 0, maxValue: 1000, requiredClassA: true },
  { code: "ac_current_a", label: "Arus AC", unit: "A", category: "ac", minValue: 0, maxValue: 5000, requiredClassA: true },
  { code: "ac_power_kw", label: "Daya AC", unit: "kW", category: "ac", minValue: 0, maxValue: 100000, requiredClassA: true },
  { code: "ac_energy_kwh", label: "Energi AC kumulatif (kWh meter)", unit: "kWh", category: "ac", minValue: 0, maxValue: 1e12, requiredClassA: true },
  { code: "inverter_status", label: "Status inverter (1 = produksi)", unit: "flag", category: "status", minValue: 0, maxValue: 1, requiredClassA: true },
];

export async function ensureCatalog() {
  for (const row of METRIC_CATALOG) {
    await db
      .insert(metricCatalog)
      .values(row)
      .onConflictDoUpdate({
        target: metricCatalog.code,
        set: { label: row.label, unit: row.unit, category: row.category, minValue: row.minValue, maxValue: row.maxValue, requiredClassA: row.requiredClassA },
      });
  }
}

export type Quality = "good" | "suspect" | "bad";

export function assessQuality(value: number, min: number, max: number, ts: Date, now = new Date()): Quality {
  if (!Number.isFinite(value)) return "bad";
  if (ts.getTime() > now.getTime() + 5 * 60_000) return "suspect";
  if (value < min || value > max) return "suspect";
  return "good";
}

const COMPUTE_METRICS = ["poa_irradiance_wm2", "t_module_c", "ac_power_kw", "dc_power_kw", "inverter_status"] as const;
type ComputeMetric = (typeof COMPUTE_METRICS)[number];
const SUMMED: ComputeMetric[] = ["ac_power_kw", "dc_power_kw"];

function dayWindow(day: string, offsetMin: number) {
  const startMs = Date.parse(`${day}T00:00:00Z`) - offsetMin * 60_000;
  return { start: new Date(startMs), end: new Date(startMs + 86_400_000) };
}

export async function computeDaily(plantId: string, day: string) {
  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1);
  if (!plant) throw new Error("PLANT_NOT_FOUND");
  if (!plant.pnomKwp || plant.pnomKwp <= 0) throw new Error("PNOM_REQUIRED");

  const interval = plant.recordingIntervalSec;
  const { start, end } = dayWindow(day, plant.utcOffsetMin);
  const expectedBuckets = Math.floor(86_400 / interval);
  const dtH = interval / 3600;

  const rows = await db
    .select({ metric: sensorReadings.metric, value: sensorReadings.value, ts: sensorReadings.timestamp, deviceId: sensorReadings.deviceId })
    .from(sensorReadings)
    .innerJoin(devices, eq(sensorReadings.deviceId, devices.id))
    .where(
      and(
        eq(devices.plantId, plantId),
        inArray(sensorReadings.metric, [...COMPUTE_METRICS]),
        eq(sensorReadings.quality, "good"),
        gte(sensorReadings.timestamp, start),
        lt(sensorReadings.timestamp, end)
      )
    );

  // bucket -> metric -> device -> [sum, count]
  const buckets = new Map<number, Map<string, Map<string, [number, number]>>>();
  for (const r of rows) {
    const b = Math.floor((r.ts.getTime() - start.getTime()) / (interval * 1000));
    const byMetric = buckets.get(b) ?? new Map();
    const byDevice = byMetric.get(r.metric) ?? new Map();
    const acc = byDevice.get(r.deviceId) ?? [0, 0];
    acc[0] += r.value;
    acc[1] += 1;
    byDevice.set(r.deviceId, acc);
    byMetric.set(r.metric, byDevice);
    buckets.set(b, byMetric);
  }

  const value = (b: Map<string, Map<string, [number, number]>>, m: ComputeMetric): number | undefined => {
    const byDevice = b.get(m);
    if (!byDevice || byDevice.size === 0) return undefined;
    const means = [...byDevice.values()].map(([s, c]) => s / c);
    const total = means.reduce((a, x) => a + x, 0);
    return SUMMED.includes(m) ? total : total / means.length;
  };

  const gamma = plant.tempCoeffPctPerC / 100;
  const pnom = plant.pnomKwp;
  let hPoa = 0, eAc = 0, eDc = 0, hPoaM = 0, eAcM = 0, eAcT = 0, eExpT = 0;
  let validRequired = 0, dayBuckets = 0, producingBuckets = 0;

  for (const b of buckets.values()) {
    const poa = value(b, "poa_irradiance_wm2");
    const tmod = value(b, "t_module_c");
    const ac = value(b, "ac_power_kw");
    const dc = value(b, "dc_power_kw");
    const status = value(b, "inverter_status");

    if (poa !== undefined) hPoa += (poa * dtH) / 1000;
    if (ac !== undefined) eAc += ac * dtH;
    if (dc !== undefined) eDc += dc * dtH;
    if (poa !== undefined && ac !== undefined) {
      hPoaM += (poa * dtH) / 1000;
      eAcM += ac * dtH;
    }
    if (poa !== undefined && tmod !== undefined && ac !== undefined) {
      eAcT += ac * dtH;
      eExpT += pnom * (poa / G_STC) * (1 + gamma * (tmod - T_STC)) * dtH;
      validRequired += 1;
    }
    if (poa !== undefined && poa >= DAYLIGHT_POA_MIN && (ac !== undefined || status !== undefined)) {
      dayBuckets += 1;
      const up = status !== undefined ? status >= 1 : (ac as number) > 0;
      if (up) producingBuckets += 1;
    }
  }

  const has = (n: number, count: number) => (count > 0 ? n : null);
  const nPoa = [...buckets.values()].filter((b) => value(b, "poa_irradiance_wm2") !== undefined).length;
  const nAc = [...buckets.values()].filter((b) => value(b, "ac_power_kw") !== undefined).length;
  const nDc = [...buckets.values()].filter((b) => value(b, "dc_power_kw") !== undefined).length;

  const yr = has(hPoa, nPoa);
  const yf = has(eAc / pnom, nAc);
  const ya = has(eDc / pnom, nDc);
  const pr = hPoaM > 0 ? eAcM / pnom / hPoaM : null;
  const prTempCorr = eExpT > 0 ? eAcT / eExpT : null;

  const result = {
    plantId,
    day,
    hPoaKwhM2: yr,
    eAcKwh: has(eAc, nAc),
    eDcKwh: has(eDc, nDc),
    eExpectedKwh: eExpT > 0 ? eExpT : null,
    yr,
    ya,
    yf,
    lc: yr !== null && ya !== null ? yr - ya : null,
    ls: ya !== null && yf !== null ? ya - yf : null,
    pr,
    prTempCorr,
    capacityFactor: nAc > 0 ? eAc / (pnom * 24) : null,
    systemAvailability: dayBuckets > 0 ? producingBuckets / dayBuckets : null,
    dataAvailability: validRequired / expectedBuckets,
    computedAt: new Date(),
  };

  await db
    .insert(dailyPerformance)
    .values(result)
    .onConflictDoUpdate({ target: [dailyPerformance.plantId, dailyPerformance.day], set: result });

  return result;
}

export type CheckStatus = "pass" | "warn" | "fail";
export interface ComplianceCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export async function complianceReport(plantId: string) {
  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId)).limit(1);
  if (!plant) throw new Error("PLANT_NOT_FOUND");

  const catalog = await db.select().from(metricCatalog).where(eq(metricCatalog.requiredClassA, true));
  const plantSensors = await db.select().from(sensors).where(eq(sensors.plantId, plantId));

  const seen = await db
    .select({
      metric: sensorReadings.metric,
      last: sql<Date>`max(${sensorReadings.timestamp})`,
      n: sql<number>`count(*)::int`,
      good: sql<number>`count(*) filter (where ${sensorReadings.quality} = 'good')::int`,
    })
    .from(sensorReadings)
    .innerJoin(devices, eq(sensorReadings.deviceId, devices.id))
    .where(and(eq(devices.plantId, plantId), gte(sensorReadings.timestamp, sql`now() - interval '24 hours'`)))
    .groupBy(sensorReadings.metric);
  const seenMap = new Map(seen.map((s) => [s.metric, s]));

  const checks: ComplianceCheck[] = [];
  const staleMs = plant.recordingIntervalSec * 5 * 1000;
  const today = new Date().toISOString().slice(0, 10);

  checks.push({
    id: "class",
    label: "Kelas monitoring ditetapkan",
    status: plant.monitoringClass === "A" ? "pass" : "warn",
    detail: `Plant dikonfigurasi Class ${plant.monitoringClass}`,
  });

  const missingParams = [
    ["pnom_kwp", plant.pnomKwp],
    ["tilt_deg", plant.tiltDeg],
    ["azimuth_deg", plant.azimuthDeg],
    ["latitude", plant.latitude],
    ["longitude", plant.longitude],
  ].filter(([, v]) => v === null || v === undefined).map(([k]) => k);
  checks.push({
    id: "plant-params",
    label: "Parameter plant lengkap (Pnom, tilt, azimuth, koordinat)",
    status: missingParams.length === 0 ? "pass" : "fail",
    detail: missingParams.length === 0 ? "Lengkap" : `Belum diisi: ${missingParams.join(", ")}`,
  });

  checks.push({
    id: "interval",
    label: "Interval perekaman terdefinisi",
    status: plant.recordingIntervalSec <= 60 ? "pass" : "warn",
    detail: `${plant.recordingIntervalSec} detik per rekaman`,
  });

  for (const m of catalog) {
    const s = seenMap.get(m.code);
    const sensorRows = plantSensors.filter((x) => x.metricCode === m.code);
    let status: CheckStatus = "pass";
    const notes: string[] = [];

    if (!s) {
      status = "fail";
      notes.push("belum ada data 24 jam terakhir");
    } else {
      const ageMs = Date.now() - new Date(s.last).getTime();
      if (ageMs > staleMs) {
        status = "fail";
        notes.push(`data terakhir ${Math.round(ageMs / 60000)} menit lalu`);
      }
      const goodRatio = s.n > 0 ? s.good / s.n : 0;
      if (goodRatio < 0.95) {
        if (status === "pass") status = "warn";
        notes.push(`kualitas good ${(goodRatio * 100).toFixed(0)}%`);
      }
    }

    if (sensorRows.length === 0) {
      if (status === "pass") status = "warn";
      notes.push("sensor belum terdaftar");
    } else if (sensorRows.some((x) => !x.calibrationDueAt || x.calibrationDueAt < today)) {
      status = "fail";
      notes.push("kalibrasi kedaluwarsa atau belum tercatat");
    }

    checks.push({
      id: m.code,
      label: `${m.label} (${m.unit})`,
      status,
      detail: notes.length ? notes.join("; ") : "Data segar, sensor terkalibrasi",
    });
  }

  const passed = checks.filter((c) => c.status === "pass").length;
  return {
    plantId,
    monitoringClass: plant.monitoringClass,
    summary: { pass: passed, warn: checks.filter((c) => c.status === "warn").length, fail: checks.filter((c) => c.status === "fail").length, total: checks.length },
    checks,
  };
}
