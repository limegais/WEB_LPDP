import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { desc } from "drizzle-orm";
import { db } from "./db/client";
import { devices, sensorReadings } from "./db/schema";

const port = Number(process.env.PORT || 3000);

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
    async ({ body }) => {
      const [inserted] = await db
        .insert(sensorReadings)
        .values({
          deviceId: body.deviceId,
          metric: body.metric,
          value: body.value,
          timestamp: new Date(body.timestamp),
        })
        .returning();

      return { success: true, data: inserted };
    },
    {
      body: t.Object({
        deviceId: t.String({ format: "uuid" }),
        metric: t.String({ minLength: 1, maxLength: 50 }),
        value: t.Number(),
        timestamp: t.String(),
      }),
    }
  )
  .listen(port);

console.log(`Backend running at http://localhost:${port}`);
