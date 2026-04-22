import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PinLogin from "./PinLogin";
import ChecklistController from "./ChecklistController";
import OwnerDashboard from "./OwnerDashboard";
import { Loader2, ClipboardCheck, ShieldCheck } from "lucide-react";

type AppMode = "select" | "controller-pin" | "controller-active";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AppMode>("select");
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Loading iniziale autenticazione
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Proprietario autenticato → Dashboard sola lettura
  if (isAuthenticated && user) {
    return <OwnerDashboard />;
  }

  // Controllore: inserimento PIN
  if (mode === "controller-pin") {
    return (
      <PinLogin
        onSuccess={(id) => {
          setSessionId(id);
          setMode("controller-active");
        }}
        onBack={() => setMode("select")}
      />
    );
  }

  // Controllore: checklist attiva
  if (mode === "controller-active" && sessionId !== null) {
    return (
      <ChecklistController
        sessionId={sessionId}
        onLogout={() => {
          setSessionId(null);
          setMode("select");
        }}
      />
    );
  }

  // Schermata di selezione ruolo
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
            <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-serif text-foreground tracking-wide">Checklist</h1>
        <p className="text-sm text-muted-foreground mt-1.5 font-light tracking-widest uppercase">Controllo operativo</p>
      </div>

      {/* Selezione ruolo */}
      <div className="w-full max-w-sm space-y-3">
        {/* Controllore */}
        <button
          onClick={() => setMode("controller-pin")}
          className="w-full flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98] transition-all duration-200 shadow-sm text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sono il controllore</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accedi con il PIN per avviare il controllo</p>
          </div>
        </button>

        {/* Proprietario */}
        <a
          href={getLoginUrl()}
          className="w-full flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98] transition-all duration-200 shadow-sm text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sono il proprietario</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accedi per visualizzare la dashboard</p>
          </div>
        </a>
      </div>

      {/* Decorazione sottile */}
      <div className="mt-12 flex items-center gap-2">
        <div className="w-8 h-px bg-border" />
        <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">Condiviso in tempo reale</p>
        <div className="w-8 h-px bg-border" />
      </div>
    </div>
  );
}
