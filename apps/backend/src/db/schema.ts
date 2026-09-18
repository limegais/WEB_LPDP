import { boolean, pgTable, real, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  plantId: uuid("plant_id").references(() => plants.id).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  deviceId: uuid("device_id").references(() => devices.id).notNull(),
  metric: varchar("metric", { length: 50 }).notNull(),
  value: real("value").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});
