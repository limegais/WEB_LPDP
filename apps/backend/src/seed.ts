import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { devices, plants, sensorReadings, sensors } from "./db/schema";
import { computeDaily, ensureCatalog, METRIC_CATALOG } from "./iec61724";

const withDemoData = process.argv.includes("--demo-data");
const PLANT_NAME = "DEMO PLTS 100 kWp (data simulasi)";

await ensureCatalog();

let [plant] = await db.select().from(plants).where(eq(plants.name, PLANT_NAME)).limit(1);
let deviceKey: string | null = null;

if (!plant) {
  [plant] = await db
    .insert(plants)
    .values({
      name: PLANT_NAME,
      location: "Jakarta",
      capacityKw: 100,
      pnomKwp: 100,
      tempCoeffPctPerC: -0.35,
      tiltDeg: 10,
      azimuthDeg: 0,
      latitude: -6.2,
      longitude: 106.8,
      monitoringClass: "A",
      recordingIntervalSec: 60,
      utcOffsetMin: 420,
    })
    .returning();

  deviceKey = randomBytes(16).toString("hex");
  const [device] = await db
    .insert(devices)
    .values({ plantId: plant.id, name: "RESS Controller 01", type: "controller", keyHash: createHash("sha256").update(deviceKey).digest("hex") })
    .returning();

  const due = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const kindFor = (code: string) =>
    code.includes("irradiance") || code === "ghi_wm2" ? "Pyranometer / reference cell" : code.startsWith("t_") ? "Sensor suhu" : code.startsWith("ac_") || code.startsWith("dc_") ? "Inverter / kWh meter" : "Sensor";
  await db.insert(sensors).values(
    METRIC_CATALOG.filter((m) => m.requiredClassA).map((m) => ({
      plantId: plant.id,
      deviceId: device.id,
      metricCode: m.code,
      kind: kindFor(m.code),
      uncertaintyPct: 2,
      calibratedAt: today,
      calibrationDueAt: due,
    }))
  );
  console.log("Plant dibuat:", plant.id);
  console.log("Device key (simpan, tidak ditampilkan lagi):", deviceKey);
} else {
  console.log("Plant sudah ada:", plant.id);
}

if (withDemoData) {
  const [device] = await db.select().from(devices).where(eq(devices.plantId, plant.id)).limit(1);
  const offsetMin = plant.utcOffsetMin;
  const localMidnightUtc = Date.parse(new Date(Date.now() + offsetMin * 60_000).toISOString().slice(0, 10) + "T00:00:00Z") - offsetMin * 60_000;
  const startMs = localMidnightUtc - 86_400_000; // yesterday, local
  const day = new Date(startMs + offsetMin * 60_000).toISOString().slice(0, 10);
  const gamma = plant.tempCoeffPctPerC / 100;
  const rows: (typeof sensorReadings.$inferInsert)[] = [];

  for (let i = 0; i < 1440; i++) {
    const timestamp = new Date(startMs + i * 60_000);
    const hour = i / 60;
    const sun = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
    const poa = 950 * Math.pow(sun, 1.15);
    const tamb = 27 + 5 * sun;
    const tmod = tamb + poa * 0.03;
    const ac = Math.max(0, plant.pnomKwp! * (poa / 1000) * 0.82 * (1 + gamma * (tmod - 25)));
    const push = (metric: string, value: number) => rows.push({ deviceId: device.id, metric, value, timestamp, quality: "good" });
    push("poa_irradiance_wm2", poa);
    push("t_module_c", tmod);
    push("t_ambient_c", tamb);
    push("ac_power_kw", ac);
    push("dc_power_kw", ac / 0.97);
    push("inverter_status", ac > 0.5 ? 1 : 0);
  }

  for (let i = 0; i < rows.length; i += 2000) {
    await db.insert(sensorReadings).values(rows.slice(i, i + 2000)).onConflictDoNothing();
  }
  const result = await computeDaily(plant.id, day);
  console.log(`Data simulasi ${day} dimasukkan.`, { yr: result.yr, yf: result.yf, ya: result.ya, pr: result.pr, prTempCorr: result.prTempCorr });
}

process.exit(0);
