import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CHECKLIST_ITEMS, CONTROLLER_PIN } from "../shared/checklist";
import { completeSession, createSession, getActiveSession, getSessionHistory, updateItemStatus } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const itemKeys = CHECKLIST_ITEMS.map((i) => i.key);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  checklist: router({
    /**
     * Verifica il PIN e avvia una nuova sessione di controllo.
     * Se esiste già una sessione attiva, la restituisce.
     */
    startSession: publicProcedure
      .input(z.object({ pin: z.string() }))
      .mutation(async ({ input }) => {
        if (input.pin !== CONTROLLER_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN non corretto" });
        }
        // Controlla se esiste già una sessione attiva
        const existing = await getActiveSession();
        if (existing) return existing;
        // Crea nuova sessione
        const session = await createSession(itemKeys);
        const items = CHECKLIST_ITEMS.map((item) => ({
          id: 0,
          sessionId: session.id,
          itemKey: item.key,
          status: "pending" as const,
          updatedAt: new Date(),
        }));
        return { session, items };
      }),

    /**
     * Recupera la sessione attiva corrente (usato per polling real-time).
     */
    getActive: publicProcedure.query(async () => {
      return await getActiveSession();
    }),

    /**
     * Aggiorna lo stato di una voce della checklist.
     * Richiede il PIN per autorizzare la modifica.
     */
    updateItem: publicProcedure
      .input(
        z.object({
          pin: z.string(),
          sessionId: z.number(),
          itemKey: z.string(),
          status: z.enum(["pending", "present", "missing"]),
        })
      )
      .mutation(async ({ input }) => {
        if (input.pin !== CONTROLLER_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN non corretto" });
        }
        if (!itemKeys.includes(input.itemKey as any)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Voce non valida" });
        }
        await updateItemStatus(input.sessionId, input.itemKey, input.status);
        return { success: true };
      }),

    /**
     * Completa la sessione attiva e la salva nello storico.
     * Richiede il PIN.
     */
    completeSession: publicProcedure
      .input(z.object({ pin: z.string(), sessionId: z.number() }))
      .mutation(async ({ input }) => {
        if (input.pin !== CONTROLLER_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN non corretto" });
        }
        await completeSession(input.sessionId);
        return { success: true };
      }),

    /**
     * Recupera lo storico delle sessioni completate.
     * Accessibile solo al proprietario (utente autenticato).
     */
    getHistory: protectedProcedure.query(async () => {
      return await getSessionHistory(30);
    }),
  }),
});

export type AppRouter = typeof appRouter;
