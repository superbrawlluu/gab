import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sessione di controllo checklist.
 * Una sessione è aperta dal controllore tramite PIN e può essere completata.
 */
export const checklistSessions = mysqlTable("checklist_sessions", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["active", "completed"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
});

export type ChecklistSession = typeof checklistSessions.$inferSelect;
export type InsertChecklistSession = typeof checklistSessions.$inferInsert;

/**
 * Stato di ogni voce della checklist per una data sessione.
 * Le voci sono identificate da una chiave fissa (itemKey).
 */
export const checklistItems = mysqlTable("checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  itemKey: varchar("itemKey", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "present", "missing"]).default("pending").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = typeof checklistItems.$inferInsert;
