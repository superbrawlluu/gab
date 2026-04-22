import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Delete } from "lucide-react";

interface PinLoginProps {
  onSuccess: (sessionId: number) => void;
  onBack?: () => void;
}

export default function PinLogin({ onSuccess, onBack }: PinLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const startSession = trpc.checklist.startSession.useMutation({
    onSuccess: (data) => {
      onSuccess(data.session.id);
    },
    onError: (err) => {
      setError("PIN non corretto. Riprova.");
      setShaking(true);
      setPin("");
      setTimeout(() => setShaking(false), 500);
    },
  });

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");
    if (newPin.length === 4) {
      setTimeout(() => {
        startSession.mutate({ pin: newPin });
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Logo / Titolo */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
            <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-serif text-foreground tracking-wide">Checklist</h1>
        <p className="text-sm text-muted-foreground mt-1 font-light tracking-wider uppercase">Controllo operativo</p>
      </div>

      {/* Indicatori PIN */}
      <div
        className={`flex gap-4 mb-8 transition-all ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
        style={shaking ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? "bg-primary border-primary scale-110"
                : "bg-transparent border-border"
            }`}
          />
        ))}
      </div>

      {/* Messaggio errore */}
      {error && (
        <p className="text-destructive text-sm mb-4 font-light animate-fade-in">{error}</p>
      )}

      {/* Tastierino numerico */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {digits.map((d, idx) => {
          if (d === "") return <div key={idx} />;
          if (d === "del") {
            return (
              <button
                key={idx}
                onClick={handleDelete}
                disabled={pin.length === 0 || startSession.isPending}
                className="h-16 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-accent active:scale-95 transition-all duration-150 disabled:opacity-30"
              >
                <Delete size={20} />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => handleDigit(d)}
              disabled={startSession.isPending}
              className="h-16 rounded-2xl bg-card border border-border text-foreground text-xl font-light hover:bg-accent hover:border-primary/30 active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-50"
            >
              {d}
            </button>
          );
        })}
      </div>

      {startSession.isPending && (
        <p className="mt-6 text-sm text-muted-foreground animate-pulse">Accesso in corso…</p>
      )}

      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Torna indietro
        </button>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
