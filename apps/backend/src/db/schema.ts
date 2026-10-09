import {
  bigserial,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("viewer").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plants = pgTable("plants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  location: text("location"),
  capacityKw: real("capacity_kw"),
  // IEC 61724-1 plant parameters
  monitoringClass: varchar("monitoring_class", { length: 1 }).default("A").notNull(),
  pnomKwp: doublePrecision("pnom_kwp"),
  tempCoeffPctPerC: doublePrecision("temp_coeff_pct_per_c").default(-0.35).notNull(),
  tiltDeg: real("tilt_deg"),
  azimuthDeg: real("azimuth_deg"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  recordingIntervalSec: integer("recording_interval_sec").default(60).notNull(),
  utcOffsetMin: integer("utc_offset_min").default(420).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  plantId: uuid("plant_id").references(() => plants.id).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).unique(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Ingestion only accepts metric codes listed here.
export const metricCatalog = pgTable("metric_catalog", {
  code: varchar("code", { length: 50 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  minValue: doublePrecision("min_value").notNull(),
  maxValue: doublePrecision("max_value").notNull(),
  requiredClassA: boolean("required_class_a").default(false).notNull(),
});

export const sensors = pgTable("sensors", {
  id: uuid("id").defaultRandom().primaryKey(),
  plantId: uuid("plant_id").references(() => plants.id).notNull(),
  deviceId: uuid("device_id").references(() => devices.id),
  metricCode: varchar("metric_code", { length: 50 }).references(() => metricCatalog.code).notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  serialNumber: varchar("serial_number", { length: 80 }),
  uncertaintyPct: real("uncertainty_pct"),
  calibratedAt: date("calibrated_at"),
  calibrationDueAt: date("calibration_due_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sensorReadings = pgTable(
  "sensor_readings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    deviceId: uuid("device_id").references(() => devices.id).notNull(),
    metric: varchar("metric", { length: 50 }).notNull(),
    value: doublePrecision("value").notNull(),
    quality: varchar("quality", { length: 10 }).default("good").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  },
  (t) => [
    unique("uq_reading").on(t.deviceId, t.metric, t.timestamp),
    index("idx_reading_device_time").on(t.deviceId, t.timestamp),
    index("idx_reading_metric_time").on(t.metric, t.timestamp),
  ]
);

export const dailyPerformance = pgTable(
  "daily_performance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    plantId: uuid("plant_id").references(() => plants.id).notNull(),
    day: date("day").notNull(),
    hPoaKwhM2: doublePrecision("h_poa_kwh_m2"),
    eAcKwh: doublePrecision("e_ac_kwh"),
    eDcKwh: doublePrecision("e_dc_kwh"),
    eExpectedKwh: doublePrecision("e_expected_kwh"),
    yr: doublePrecision("yr"),
    ya: doublePrecision("ya"),
    yf: doublePrecision("yf"),
    lc: doublePrecision("lc"),
    ls: doublePrecision("ls"),
    pr: doublePrecision("pr"),
    prTempCorr: doublePrecision("pr_temp_corr"),
    capacityFactor: doublePrecision("capacity_factor"),
    systemAvailability: doublePrecision("system_availability"),
    dataAvailability: doublePrecision("data_availability"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("uq_daily_plant_day").on(t.plantId, t.day)]
);
