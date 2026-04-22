# Checklist App - TODO

## Schema & Database
- [x] Tabella `checklist_sessions` per le sessioni di controllo
- [x] Tabella `checklist_items` per lo stato di ogni voce per sessione
- [x] Tabella `checklist_history` per lo storico delle sessioni completate (campo completedAt in checklist_sessions)
- [x] Migrazione schema DB applicata

## Backend (tRPC)
- [x] Procedura: avvia nuova sessione (controllore con PIN)
- [x] Procedura: aggiorna stato voce (presente/mancante)
- [x] Procedura: completa sessione (salva nello storico)
- [x] Procedura: ottieni sessione corrente (real-time polling)
- [x] Procedura: ottieni storico sessioni
- [x] Validazione PIN 2007 lato server

## Frontend - Controllore
- [x] Schermata inserimento PIN (mobile-first, elegante)
- [x] Schermata checklist con 12 voci fisse
- [x] Toggle Presente/Mancante per ogni voce
- [x] Pulsante "Completa controllo" per salvare nello storico
- [x] Feedback visivo real-time sullo stato

## Frontend - Proprietario
- [x] Login OAuth per il proprietario
- [x] Dashboard sola lettura con stato attuale checklist
- [x] Aggiornamento automatico ogni 3 secondi (polling)
- [x] Sezione storico con data/ora completamento
- [x] Indicatore visivo sessione attiva/inattiva

## Stile & UX
- [x] Design mobile-first con palette elegante (bianco/nero/oro)
- [x] Font raffinato (Playfair Display + Inter)
- [x] Animazioni fluide per i toggle
- [x] Responsive ottimizzato per smartphone
- [x] Tema chiaro con accenti premium
