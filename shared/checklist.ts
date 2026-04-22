/**
 * Voci fisse della checklist operativa.
 * Queste voci non sono configurabili dall'utente.
 */
export const CHECKLIST_ITEMS = [
  { key: "registro_consegne", label: "Registro consegne" },
  { key: "registro_presenze", label: "Registro presenze" },
  { key: "tovagliette", label: "Tovagliette" },
  { key: "bicchieri", label: "Bicchieri" },
  { key: "posate", label: "Posate" },
  { key: "bottiglie_acqua", label: "Bottiglie d'acqua" },
  { key: "rotolone", label: "Rotolone" },
  { key: "dentifricio", label: "Dentifricio" },
  { key: "sapone", label: "Sapone" },
  { key: "carta_igienica", label: "Carta igienica" },
  { key: "ingredienti", label: "Ingredienti" },
  { key: "materiale_preparazione", label: "Materiale per la preparazione" },
] as const;

export type ItemKey = (typeof CHECKLIST_ITEMS)[number]["key"];
export type ItemStatus = "pending" | "present" | "missing";

export const CONTROLLER_PIN = "2007";
