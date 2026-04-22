import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CHECKLIST_ITEMS } from "../../../shared/checklist";
import type { ItemStatus } from "../../../shared/checklist";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle2, XCircle, Clock, RefreshCw, History, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "live" | "history";

export default function OwnerDashboard() {
  const [tab, setTab] = useState<Tab>("live");
  const { logout } = useAuth();

  // Polling ogni 3 secondi per aggiornamento real-time
  const { data: activeSession, dataUpdatedAt, isFetching } = trpc.checklist.getActive.useQuery(
    undefined,
    { refetchInterval: 3000 }
  );

  const { data: history } = trpc.checklist.getHistory.useQuery(undefined, {
    enabled: tab === "history",
  });

  const statusConfig = {
    pending: {
      icon: <Clock size={16} className="text-muted-foreground" />,
      label: "Da verificare",
      bg: "bg-muted/40",
      border: "border-border",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
    },
    present: {
      icon: <CheckCircle2 size={16} className="text-emerald-600" />,
      label: "Presente",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    missing: {
      icon: <XCircle size={16} className="text-red-500" />,
      label: "Mancante",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      dot: "bg-red-500",
    },
  };

  const getItemStatus = (itemKey: string, items: Array<{ itemKey: string; status: string }>): ItemStatus => {
    const found = items.find((i) => i.itemKey === itemKey);
    return (found?.status as ItemStatus) ?? "pending";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Vista proprietario · sola lettura</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 rounded-xl text-muted-foreground hover:bg-accent transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Tab */}
        <div className="flex gap-1 mt-3 bg-muted/50 rounded-xl p-1">
          <button
            onClick={() => setTab("live")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === "live"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={13} />
            In diretta
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History size={13} />
            Storico
          </button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="px-4 py-4">
        {tab === "live" && (
          <>
            {/* Indicatore aggiornamento */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${activeSession ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">
                  {activeSession ? "Sessione attiva" : "Nessuna sessione attiva"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />
                {lastUpdate}
              </div>
            </div>

            {activeSession ? (
              <>
                {/* Riepilogo */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(["present", "missing", "pending"] as ItemStatus[]).map((s) => {
                    const count = activeSession.items.filter((i) => i.status === s).length;
                    const labels = { present: "Presenti", missing: "Mancanti", pending: "In attesa" };
                    const colors = {
                      present: "text-emerald-600 bg-emerald-50 border-emerald-200",
                      missing: "text-red-600 bg-red-50 border-red-200",
                      pending: "text-muted-foreground bg-muted/40 border-border",
                    };
                    return (
                      <div key={s} className={`rounded-xl border p-2.5 text-center ${colors[s]}`}>
                        <div className="text-xl font-serif font-semibold">{count}</div>
                        <div className="text-xs font-light mt-0.5">{labels[s]}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Lista voci */}
                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    const status = getItemStatus(item.key, activeSession.items);
                    const cfg = statusConfig[status];
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                      >
                        <span className="flex-shrink-0">{cfg.icon}</span>
                        <span className={`flex-1 text-sm font-medium ${cfg.text}`}>{item.label}</span>
                        <span className={`text-xs font-light ${cfg.text} opacity-70`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Inizio sessione */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Iniziata il {formatDate(activeSession.session.startedAt)}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Clock size={28} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">Nessun controllo in corso</p>
                <p className="text-sm text-muted-foreground">Il controllore non ha ancora avviato una sessione</p>
              </div>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {history?.length ?? 0} controlli completati
            </p>

            {!history || history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <History size={28} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">Nessuno storico</p>
                <p className="text-sm text-muted-foreground">I controlli completati appariranno qui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(({ session, items }) => {
                  const presentCount = items.filter((i) => i.status === "present").length;
                  const missingCount = items.filter((i) => i.status === "missing").length;
                  return (
                    <details key={session.id} className="group">
                      <summary className="flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-2xl cursor-pointer list-none hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(session.completedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {presentCount} presenti · {missingCount} mancanti
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {presentCount}✓
                          </span>
                          {missingCount > 0 && (
                            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                              {missingCount}✗
                            </span>
                          )}
                        </div>
                        <svg
                          className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>

                      <div className="mt-2 space-y-1.5 pl-1">
                        {CHECKLIST_ITEMS.map((item) => {
                          const status = getItemStatus(item.key, items);
                          const cfg = statusConfig[status];
                          return (
                            <div
                              key={item.key}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}
                            >
                              <span className="flex-shrink-0">{cfg.icon}</span>
                              <span className={`flex-1 text-xs font-medium ${cfg.text}`}>{item.label}</span>
                              <span className={`text-xs font-light ${cfg.text} opacity-70`}>{cfg.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
