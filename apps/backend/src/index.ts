import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db/client";
import { dailyPerformance, devices, metricCatalog, plants, sensorReadings } from "./db/schema";
import { assessQuality, complianceReport, computeDaily, ensureCatalog } from "./iec61724";

const port = Number(process.env.PORT || 3000);

await ensureCatalog();

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: "/swagger" }))
  .get("/health", () => ({ status: "ok", service: "ress-backend" }))
  .get("/api/devices", async () => {
    const rows = await db.select().from(devices).orderBy(desc(devices.createdAt)).limit(100);
    return { data: rows };
  })
  .get(
    "/api/readings",
    async ({ query }) => {
      const limit = Number(query.limit || 100);
      const rows = await db
        .select()
        .from(sensorReadings)
        .orderBy(desc(sensorReadings.timestamp))
        .limit(Math.min(Math.max(limit, 1), 1000));
      return { data: rows };
    },
    {
      query: t.Optional(
        t.Object({
          limit: t.Optional(t.String()),
        })
      ),
    }
  )
  .get("/api/readings/latest", async () => {
    const rows = await db.select().from(sensorReadings).orderBy(desc(sensorReadings.timestamp)).limit(100);
    return { data: rows };
  })
  .post(
    "/api/ingest",
    async ({ body, headers, set }) => {
      const keyHash = createHash("sha256").update(headers["x-device-key"] ?? "").digest("hex");
      const [device] = await db.select().from(devices).where(eq(devices.keyHash, keyHash)).limit(1);
      if (!device) {
        set.status = 401;
        return { error: "invalid device key" };
      }

      const catalog = new Map((await db.select().from(metricCatalog)).map((m) => [m.code, m]));
      const now = new Date();
      const accepted: (typeof sensorReadings.$inferInsert)[] = [];
      const rejected: { index: number; reason: string }[] = [];

      body.readings.forEach((r, index) => {
        const def = catalog.get(r.metric);
        if (!def) return rejected.push({ index, reason: "unknown metric" });
        const ts = r.timestamp ? new Date(r.timestamp) : now;
        if (Number.isNaN(ts.getTime())) return rejected.push({ index, reason: "invalid timestamp" });
        accepted.push({
          deviceId: device.id,
          metric: r.metric,
          value: r.value,
          timestamp: ts,
          quality: assessQuality(r.value, def.minValue, def.maxValue, ts, now),
        });
      });

      if (accepted.length > 0) {
        await db.insert(sensorReadings).values(accepted).onConflictDoNothing();
        await db.update(devices).set({ lastSeenAt: now, isOnline: true }).where(eq(devices.id, device.id));
      }
      if (rejected.length > 0) set.status = accepted.length > 0 ? 207 : 422;
      return { success: accepted.length > 0, accepted: accepted.length, rejected };
    },
    {
      body: t.Object({
        readings: t.Array(
          t.Object({
            metric: t.String({ minLength: 1, maxLength: 50 }),
            value: t.Number(),
            timestamp: t.Optional(t.String()),
          }),
          { minItems: 1, maxItems: 200 }
        ),
      }),
    }
  )
  .get("/api/plants", async () => {
    const rows = await db.select().from(plants).orderBy(desc(plants.createdAt)).limit(100);
    return { data: rows };
  })
  .get(
    "/api/plants/:plantId/performance",
    async ({ params, query }) => {
      const days = Math.min(Math.max(Number(query.days || 30), 1), 366);
      const rows = await db
        .select()
        .from(dailyPerformance)
        .where(sql`${dailyPerformance.plantId} = ${params.plantId} and ${dailyPerformance.day} >= (current_date - ${days}::int)`)
        .orderBy(dailyPerformance.day);
      return { data: rows };
    },
    { query: t.Optional(t.Object({ days: t.Optional(t.String()) })) }
  )
  .post(
    "/api/plants/:plantId/performance/compute",
    async ({ params, body, set }) => {
      try {
        return { data: await computeDaily(params.plantId, body.day) };
      } catch (e) {
        const code = (e as Error).message;
        set.status = code === "PLANT_NOT_FOUND" ? 404 : 422;
        return { error: code };
      }
    },
    { body: t.Object({ day: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }) }) }
  )
  .get("/api/plants/:plantId/compliance", async ({ params, set }) => {
    try {
      return await complianceReport(params.plantId);
    } catch {
      set.status = 404;
      return { error: "PLANT_NOT_FOUND" };
    }
  })
  .listen(port);

console.log(`Backend running at http://localhost:${port}`);
