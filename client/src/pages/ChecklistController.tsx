import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { CHECKLIST_ITEMS } from "../../../shared/checklist";
import type { ItemStatus } from "../../../shared/checklist";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, LogOut, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChecklistControllerProps {
  sessionId: number;
  onLogout: () => void;
}

type ItemMap = Record<string, ItemStatus>;

export default function ChecklistController({ sessionId, onLogout }: ChecklistControllerProps) {
  const [items, setItems] = useState<ItemMap>(() =>
    Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, "pending" as ItemStatus]))
  );
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Carica lo stato attuale della sessione al mount
  const { data: activeSession } = trpc.checklist.getActive.useQuery(undefined, {
    refetchInterval: false,
  });

  useEffect(() => {
    if (activeSession?.items) {
      const map: ItemMap = {};
      activeSession.items.forEach((item) => {
        map[item.itemKey] = item.status as ItemStatus;
      });
      setItems(map);
    }
  }, [activeSession]);

  const updateItem = trpc.checklist.updateItem.useMutation({
    onError: () => toast.error("Errore nell'aggiornamento"),
  });

  const completeSession = trpc.checklist.completeSession.useMutation({
    onSuccess: () => {
      setCompleted(true);
      toast.success("Controllo completato e salvato nello storico");
    },
    onError: () => toast.error("Errore nel completamento"),
  });

  const handleSetStatus = (key: string, newStatus: "present" | "missing") => {
    if (completed) return;
    const current = items[key] ?? "pending";
    // Se si clicca lo stesso stato già selezionato, torna a "pending"
    const next: ItemStatus = current === newStatus ? "pending" : newStatus;

    // Aggiornamento ottimistico
    setItems((prev) => ({ ...prev, [key]: next }));

    updateItem.mutate({
      pin: "2007",
      sessionId,
      itemKey: key,
      status: next,
    });
  };

  const handleComplete = () => {
    setCompleting(true);
    completeSession.mutate({ pin: "2007", sessionId });
  };

  const presentCount = Object.values(items).filter((s) => s === "present").length;
  const missingCount = Object.values(items).filter((s) => s === "missing").length;
  const pendingCount = Object.values(items).filter((s) => s === "pending").length;
  const total = CHECKLIST_ITEMS.length;
  const progress = Math.round(((presentCount + missingCount) / total) * 100);

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCheck size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-serif text-foreground mb-2">Controllo completato</h2>
        <p className="text-muted-foreground text-sm mb-1">
          {presentCount} presenti · {missingCount} mancanti
        </p>
        <p className="text-muted-foreground text-xs mb-8">Salvato nello storico</p>
        <Button variant="outline" onClick={onLogout} className="border-border text-foreground">
          Nuovo controllo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-serif text-foreground">Controllo</h1>
            <p className="text-xs text-muted-foreground">
              {presentCount + missingCount} / {total} verificati
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-muted-foreground hover:bg-accent transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Barra progresso */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Statistiche */}
        <div className="flex gap-3 mt-2">
          <span className="text-xs text-emerald-600 font-medium">{presentCount} presenti</span>
          <span className="text-xs text-red-500 font-medium">{missingCount} mancanti</span>
          <span className="text-xs text-muted-foreground">{pendingCount} da verificare</span>
        </div>
      </div>

      {/* Lista voci */}
      <div className="px-4 py-4 space-y-3 pb-32">
        {CHECKLIST_ITEMS.map((item, idx) => {
          const status = items[item.key] ?? "pending";
          return (
            <div
              key={item.key}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
              style={{ animationDelay: `${idx * 25}ms` }}
            >
              {/* Nome voce */}
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                {status === "pending" && <Clock size={14} className="text-muted-foreground flex-shrink-0" />}
                {status === "present" && <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />}
                {status === "missing" && <XCircle size={14} className="text-red-500 flex-shrink-0" />}
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>

              {/* Pulsanti selezione */}
              <div className="flex gap-2 px-3 pb-3">
                <button
                  onClick={() => handleSetStatus(item.key, "present")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 ${
                    status === "present"
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                      : "bg-muted/60 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent"
                  }`}
                >
                  <CheckCircle2 size={13} />
                  Presente
                </button>
                <button
                  onClick={() => handleSetStatus(item.key, "missing")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 ${
                    status === "missing"
                      ? "bg-red-500 text-white shadow-sm shadow-red-200"
                      : "bg-muted/60 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent"
                  }`}
                >
                  <XCircle size={13} />
                  Mancante
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pulsante Completa fisso in basso */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button
          onClick={handleComplete}
          disabled={pendingCount > 0 || completing}
          className="w-full h-12 rounded-2xl text-sm font-medium tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {completing ? (
            <span className="animate-pulse">Salvataggio…</span>
          ) : pendingCount > 0 ? (
            `Verifica ancora ${pendingCount} ${pendingCount === 1 ? "voce" : "voci"}`
          ) : (
            "Completa il controllo"
          )}
        </Button>
      </div>
    </div>
  );
}
