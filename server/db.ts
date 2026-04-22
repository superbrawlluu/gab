import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { checklistItems, checklistSessions, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Checklist helpers ────────────────────────────────────────────────────────

/** Crea una nuova sessione attiva e inizializza tutte le voci come "pending" */
export async function createSession(itemKeys: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(checklistSessions).values({ status: "active" });
  // Recupera l'ultimo ID inserito
  const rows = await db
    .select()
    .from(checklistSessions)
    .orderBy(desc(checklistSessions.id))
    .limit(1);
  const session = rows[0];
  if (!session) throw new Error("Failed to create session");

  // Inizializza le voci
  await db.insert(checklistItems).values(
    itemKeys.map((key) => ({ sessionId: session.id, itemKey: key, status: "pending" as const }))
  );

  return session;
}

/** Recupera la sessione attiva più recente con le sue voci */
export async function getActiveSession() {
  const db = await getDb();
  if (!db) return null;

  const sessions = await db
    .select()
    .from(checklistSessions)
    .where(eq(checklistSessions.status, "active"))
    .orderBy(desc(checklistSessions.startedAt))
    .limit(1);

  if (sessions.length === 0) return null;
  const session = sessions[0];

  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.sessionId, session.id));

  return { session, items };
}

/** Aggiorna lo stato di una voce nella sessione corrente */
export async function updateItemStatus(sessionId: number, itemKey: string, status: "pending" | "present" | "missing") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(checklistItems)
    .set({ status })
    .where(and(eq(checklistItems.sessionId, sessionId), eq(checklistItems.itemKey, itemKey)));
}

/** Completa la sessione attiva e la salva nello storico */
export async function completeSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(checklistSessions)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(checklistSessions.id, sessionId));
}

/** Recupera lo storico delle sessioni completate con le voci */
export async function getSessionHistory(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db
    .select()
    .from(checklistSessions)
    .where(eq(checklistSessions.status, "completed"))
    .orderBy(desc(checklistSessions.completedAt))
    .limit(limit);

  const result = await Promise.all(
    sessions.map(async (session) => {
      const items = await db
        .select()
        .from(checklistItems)
        .where(eq(checklistItems.sessionId, session.id));
      return { session, items };
    })
  );

  return result;
}
