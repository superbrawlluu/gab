import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock del modulo db per isolare i test
vi.mock("./db", () => ({
  createSession: vi.fn().mockResolvedValue({ id: 1, status: "active", startedAt: new Date(), completedAt: null, notes: null }),
  getActiveSession: vi.fn().mockResolvedValue({
    session: { id: 1, status: "active", startedAt: new Date(), completedAt: null, notes: null },
    items: [
      { id: 1, sessionId: 1, itemKey: "registro_consegne", status: "pending", updatedAt: new Date() },
      { id: 2, sessionId: 1, itemKey: "tovagliette", status: "present", updatedAt: new Date() },
    ],
  }),
  updateItemStatus: vi.fn().mockResolvedValue(undefined),
  completeSession: vi.fn().mockResolvedValue(undefined),
  getSessionHistory: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createOwnerContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner-open-id",
      email: "owner@example.com",
      name: "Proprietario",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("checklist.startSession", () => {
  it("rifiuta un PIN errato", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.checklist.startSession({ pin: "0000" })).rejects.toThrow("PIN non corretto");
  });

  it("accetta il PIN corretto e restituisce la sessione", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.checklist.startSession({ pin: "2007" });
    expect(result).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.items).toBeDefined();
  });
});

describe("checklist.getActive", () => {
  it("restituisce la sessione attiva", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.checklist.getActive();
    expect(result).not.toBeNull();
    expect(result?.session.status).toBe("active");
    expect(result?.items.length).toBeGreaterThan(0);
  });
});

describe("checklist.updateItem", () => {
  it("rifiuta aggiornamento con PIN errato", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.checklist.updateItem({ pin: "9999", sessionId: 1, itemKey: "tovagliette", status: "present" })
    ).rejects.toThrow("PIN non corretto");
  });

  it("rifiuta una voce non valida", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.checklist.updateItem({ pin: "2007", sessionId: 1, itemKey: "voce_inesistente", status: "present" })
    ).rejects.toThrow("Voce non valida");
  });

  it("aggiorna correttamente una voce valida", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.checklist.updateItem({
      pin: "2007",
      sessionId: 1,
      itemKey: "tovagliette",
      status: "present",
    });
    expect(result.success).toBe(true);
  });
});

describe("checklist.completeSession", () => {
  it("rifiuta completamento con PIN errato", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.checklist.completeSession({ pin: "1234", sessionId: 1 })
    ).rejects.toThrow("PIN non corretto");
  });

  it("completa la sessione con PIN corretto", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.checklist.completeSession({ pin: "2007", sessionId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("checklist.getHistory", () => {
  it("richiede autenticazione", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.checklist.getHistory()).rejects.toThrow();
  });

  it("restituisce lo storico per il proprietario autenticato", async () => {
    const caller = appRouter.createCaller(createOwnerContext());
    const result = await caller.checklist.getHistory();
    expect(Array.isArray(result)).toBe(true);
  });
});
