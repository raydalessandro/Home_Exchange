# 🏦 Casa Exchange v0.6

**Borsa Domestica Educativa** - Piattaforma pedagogica per insegnare economia ai bambini attraverso un sistema di token di lavoro e asset trading.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Demo](#-demo)
- [Installazione](#-installazione)
- [Deploy su Vercel](#-deploy-su-vercel)
- [Architettura](#-architettura)
- [Utilizzo](#-utilizzo)
- [Testing](#-testing)
- [Licenza](#-licenza)

---

## ✨ Caratteristiche

### 🌱 Livelli di Crescita
L'interfaccia dei bambini cresce con loro. L'admin imposta il livello di ogni figlio dal pannello **Giocatori**:

| Livello | Età indicativa | Cosa vede |
|---------|---------------|-----------|
| 🌱 **Germoglio** | ~4-5 anni | Schermata unica semplificata: salvadanaio, gettoni con bottone gigante "Metti!", negozio a un tocco |
| 🌿 **Esploratore** | ~6-7 anni | + Calendario attività e vendita alla banca |
| 🌳 **Mercante** | ~8-10 anni | + Scambi P2P, collaboratori nelle prenotazioni, notizie di mercato |
| 🚀 **Esperto** | 10+ anni | Esperienza completa: statistiche, supply, spread, tutto il mercato |

I giocatori esistenti partono come **Esperto** (comportamento invariato): abbassa il livello quando serve.

### 🧩 Catalogo Modulare
Attività e premi cambiano negli anni senza toccare il codice:

- **Attività (lavori)**: dal pannello **Gettoni → Controllo Prezzi** puoi aggiungere nuove attività, archiviarle (occhio 👁️) o eliminarle, e impostare da quale livello sono visibili (`🌱 Lv1+`)
- **Premi (asset)**: dal pannello **Asset** puoi archiviare/riattivare ogni premio e legarlo a un livello minimo
- Le voci archiviate spariscono da negozio e calendario dei bambini ma restano nello storico

### 🎫 Sistema Work Tokens
- **Emissione gettoni** per attività domestiche (apparecchiare, cucinare, studiare, etc.)
- **Qualità del lavoro** con moltiplicatori (Basic, Good, Excellent, Perfect)
- **Riscossione token** con tracking automatico
- **Calendario prenotazioni** per organizzare le attività settimanali
- **Lavoro collaborativo** con pagamenti P2P tracciati
- **Penalità inattività** per incentivare la partecipazione

### 📈 Sistema Economico Avanzato
- **Supply finito** per ogni asset (totalSupply, circulatingSupply, bankReserve)
- **Prezzi banca differenziati**: bankBuyPrice e bankSellPrice con spread configurabile
- **Buyback opzionale**: la banca può scegliere se riacquistare asset
- **Mercato P2P**: scambi liberi tra giocatori con tracking prezzo mercato
- **Inflazione realistica**: basata su valore nominale asset + produzione lavoro
- **Market Premium**: tracking della speculazione (differenza prezzo P2P vs banca)

### 📊 Dashboard Economica
- **M1 & M2**: massa monetaria con tracking unredeemed tokens
- **GDP & Produttività**: metriche di output economico
- **Supply Ratio**: percentuale asset in circolazione vs totale
- **Bank Reserve Value**: valore degli asset in riserva banca
- **Inflazione trend**: visualizzazione grafica con indicatori colorati
- **Redemption Rate**: percentuale di token riscossi

### 🎮 Modalità Admin
- **Gestione supply asset**: modifica totalSupply, bankReserve, prezzi
- **Eventi mercato**: BOOM (+20%), CRASH (-20%) sui prezzi lavoro
- **Controllo prezzi lavoro**: modifica individuale template e moltiplicatori categoria
- **Gestione giocatori**: aggiunta/rimozione moneta, visualizzazione holdings
- **Calendario admin**: conferma lavori e emissione automatica token
- **Report inattività**: applicazione penalità -5 per giocatori inattivi

### 🧑‍💼 Modalità Trader
- **UI a livelli**: tab e funzioni compaiono in base al livello di crescita del bambino
- **Wallet**: visualizzazione balance e holdings con valore portfolio
- **Trading Grid**: acquisto/vendita asset dalla banca
- **P2P Modal**: scambi diretti tra giocatori
- **Token Redemption**: riscossione singola o bulk di work tokens
- **Stats personali**: net worth, portfolio value, trade history
- **Calendario attività**: prenotazione task con collaboratori

### 🧪 Testing & Debug
- **E2E Tests**: Playwright test suite completa
- **Simulazione storica**: genera 60-180 giorni di attività economica
- **Debug tools**: `seedHistory()`, `clearHistory()`, `store.getState()`
- **Console logging**: tracking dettagliato di tutte le operazioni

---

## 🎥 Demo

L'applicazione è disponibile su: **[https://github.com/raydalessandro/Home_Exchange](https://github.com/raydalessandro/Home_Exchange)**

### Screenshot

**Dashboard Economica**
- Visualizza M1, M2, inflazione, GDP, supply metrics
- Grafici interattivi per trend economici

**Trading View**
- Carte asset con disponibilità banca
- Prezzi buy/sell differenziati
- Indicatore "Esaurito" per asset senza riserva

**Calendario Prenotazioni**
- Vista settimanale con slot giornalieri
- Prenotazione task con collaboratori
- Conferma admin e pagamento automatico

---

## 🚀 Installazione

### Prerequisiti

- Node.js >= 18.17.0
- npm >= 9.0.0

### Setup Locale

```bash
# 1. Clone repository
git clone https://github.com/raydalessandro/Home_Exchange.git
cd Home_Exchange

# 2. Installa dipendenze
npm install

# 3. Avvia development server
npm run dev

# 4. Apri browser
# http://localhost:3000
```

### Comandi Disponibili

```bash
npm run dev          # Development server (hot reload)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

---

## ☁️ Deploy su Vercel

### Deploy Automatico (Raccomandato)

1. **Vai su [Vercel](https://vercel.com)**
2. **Importa repository GitHub**:
   - Click su "New Project"
   - Seleziona `raydalessandro/Home_Exchange`
   - Vercel rileva automaticamente Next.js
3. **Deploy**:
   - Click su "Deploy"
   - Attendi 2-3 minuti per il build
   - URL live pronto! 🎉

### Deploy da CLI

```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Production deploy
vercel --prod
```

### Configurazione Vercel (opzionale)

Se vuoi customizzare il deploy, crea `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Note sul Deploy

- ✅ **No environment variables** necessarie (tutto in localStorage)
- ✅ **No database** richiesto (stato client-side)
- ✅ **Static Generation** dove possibile
- ✅ **Edge Functions** per performance ottimali
- ⚠️ **localStorage** viene cancellato se l'utente cancella i dati del browser

---

## 🏗️ Architettura

### Stack Tecnologico

```
Frontend:
├── Next.js 14.2         # React framework con App Router
├── TypeScript 5.7       # Type safety
├── Tailwind CSS 3.4     # Utility-first CSS
└── Lucide React         # Icon library

State Management:
├── Zustand 5.0          # Lightweight state
├── Immer 10.1           # Immutable updates
└── localStorage         # Persistence layer

Validation & Utils:
├── Zod 3.24             # Schema validation
├── uuid 11.0            # Unique IDs
└── clsx + tw-merge      # Conditional classes

Testing:
└── Playwright 1.49      # E2E testing
```

### Struttura Progetto

```
Home_Exchange/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/
│   │   ├── admin/              # Admin UI
│   │   │   ├── AdminView.tsx
│   │   │   ├── AssetSupplyControls.tsx
│   │   │   ├── EconomicDashboard.tsx
│   │   │   ├── TokenEmission.tsx
│   │   │   └── ...
│   │   │
│   │   ├── trader/             # Trader UI
│   │   │   ├── TraderView.tsx
│   │   │   ├── TradingCard.tsx
│   │   │   ├── Wallet.tsx
│   │   │   └── ...
│   │   │
│   │   ├── calendar/           # Calendar module
│   │   │   ├── CalendarView.tsx
│   │   │   ├── BookingModal.tsx
│   │   │   └── ...
│   │   │
│   │   └── shared/             # Shared components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── ...
│   │
│   ├── store/
│   │   ├── index.ts            # Zustand store + actions
│   │   └── calendarSlice.ts    # Calendar state slice
│   │
│   ├── lib/
│   │   ├── economy.ts          # Economic calculations
│   │   └── validation.ts       # Zod schemas
│   │
│   └── types/
│       ├── index.ts            # Core types
│       ├── state.ts            # State types
│       └── calendar.ts         # Calendar types
│
├── e2e/                        # Playwright tests
│   ├── auth.spec.ts
│   ├── trading.spec.ts
│   ├── calendar.spec.ts
│   └── ...
│
└── public/                     # Static assets
```

---

## 📖 Utilizzo

### Login

1. Apri l'applicazione
2. Seleziona un profilo:
   - **👨 Papà Admin** / **👩 Mamma Admin**: accesso completo
   - **👦 Figlio 1** / **👧 Figlio 2** / **🧒 Figlio 3**: modalità trader

### Come Admin

#### Emettere Token di Lavoro

1. **Admin Dashboard** → **Gettoni**
2. Seleziona giocatore, categoria, template
3. Scegli qualità (Basic → Perfect)
4. Click **Emetti Gettone**

#### Gestire Supply Asset

1. **Admin Dashboard** → **Asset**
2. Modifica:
   - **Total Supply**: quantità massima emettibile
   - **Bank Buy Price**: prezzo vendita banca → player
   - **Bank Sell Price**: prezzo riacquisto banca ← player
   - **Buyback Enabled**: abilita/disabilita riacquisto
3. Click **Salva**

#### Eventi Mercato Lavoro

1. **Admin Dashboard** → **Gettoni** → **Controllo Prezzi**
2. Click **BOOM** (+20%) o **CRASH** (-20%)
3. Tutti i prezzi dei template vengono aggiornati

#### Confermare Lavori dal Calendario

1. **Admin Dashboard** → **Calendario**
2. Trova prenotazione con status "PENDING_CONFIRMATION"
3. Click **Conferma** → Token emesso automaticamente

### Come Trader

#### Comprare/Vendere Asset

1. **Market** tab
2. Visualizza carte asset con:
   - Prezzo Buy/Sell
   - Disponibilità banca (es. "5/100 disponibili")
   - Indicatore "Esaurito" se reserve = 0
3. Click **Compra** o **Vendi**

#### Riscattare Token di Lavoro

1. **Gettoni** tab
2. Visualizza token non riscossi
3. Click **Riscatta** su singolo token o **Riscatta Tutti**

#### Prenotare Attività

1. **Calendario** tab
2. Click su giorno vuoto
3. Seleziona template, orario, collaboratori
4. Click **Prenota**

#### Pagare Collaboratori

1. Dopo conferma admin, appare **Paga Collaboratori**
2. Inserisci importi per ogni collaboratore
3. Click **Paga** → Trasferimenti P2P tracciati

---

## 🧪 Testing

### E2E Tests con Playwright

```bash
# Run all tests
npm run test:e2e

# UI mode (visual)
npm run test:e2e:ui

# Single test file
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug
```

### Test Coverage

- ✅ **Authentication**: Login flow per tutti i profili
- ✅ **Trading**: Buy/sell dalla banca
- ✅ **P2P**: Trasferimenti peer-to-peer
- ✅ **Persistence**: Reload mantenimento stato
- ✅ **Admin**: Emissione token, gestione asset
- ✅ **Calendar**: Prenotazioni, conferma, pagamenti

### Debug Tools (Browser Console)

```javascript
// Genera storico di 60 giorni
seedHistory(60)

// Genera 180 giorni
seedHistory(180)

// Cancella tutto lo storico
clearHistory()

// Visualizza stato completo
store.getState()
```

---

## 🎓 Obiettivi Pedagogici

Casa Exchange insegna ai bambini:

- **💰 Gestione del denaro**: Budget, risparmio, investimenti
- **📊 Concetti economici**: Inflazione, supply/demand, market dynamics
- **🤝 Collaborazione**: Lavoro di squadra con divisione equa
- **⏰ Pianificazione**: Calendario settimanale delle attività
- **📈 Investimenti**: Comprare/vendere asset al momento giusto
- **💼 Imprenditorialità**: Trading P2P, negoziazione prezzi

---

## 🛠️ Sviluppo Futuro

### v0.7 (Prossimo)
- [ ] Grafici storici per inflazione e GDP
- [ ] Export dati in CSV/Excel
- [ ] Sistema di achievement e badges
- [ ] Notifiche push per conferme lavori

### v1.0 (Long-term)
- [ ] Multi-famiglia su Supabase
- [ ] Real-time sync tra dispositivi
- [ ] Mobile app (React Native)
- [ ] Analytics avanzate per genitori

---

## 📄 Licenza

MIT License - Copyright (c) 2025 Alessandro Ray

Vedi [LICENSE](LICENSE) per dettagli completi.

---

## 🤝 Contributing

Contributi benvenuti! Per favore:

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📧 Contatti

**Alessandro Ray** - [@raydalessandro](https://github.com/raydalessandro)

**Repository**: [https://github.com/raydalessandro/Home_Exchange](https://github.com/raydalessandro/Home_Exchange)

---

## 🙏 Ringraziamenti

- Framework EAR per l'ispirazione teorica
- Next.js team per l'ottimo framework
- Vercel per l'hosting gratuito
- Comunità open source

---

<div align="center">
  <strong>Fatto con ❤️ per insegnare economia ai bambini</strong>
  <br>
  <sub>Non giochiamo coi numeri, facciamo magie ✨</sub>
</div>

