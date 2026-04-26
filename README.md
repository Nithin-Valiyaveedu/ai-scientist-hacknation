# LabProcure
### From Hypothesis to Runnable Experiment by Voice and Chat

> Built for Hack-Nation 2026

---

## What It Does

Paste a scientific hypothesis. In under 60 seconds, LabProcure returns a complete, operationally grounded lab experiment plan — with real catalog numbers, USD cost estimates, and a phased timeline. You can also **talk to it** via voice call to ask questions about the literature or the generated protocol in real time.

**Three stages:**

1. **Literature QC** — Semantic Scholar paper search + OpenAI novelty classification. Returns a novelty signal (`not found` / `similar work exists` / `exact match found`), up to 8 papers with abstracts, and reference URLs.

2. **Experiment Plan** — OpenAI with structured output generates:
   - Step-by-step protocol (8–15 steps)
   - Materials list with realistic catalog numbers (Sigma-Aldrich, ThermoFisher, etc.)
   - Itemised budget with USD cost estimates (live Tavily price lookups)
   - Phased timeline
   - Validation criteria with quantitative success/failure thresholds

3. **Feedback Loop** — Every plan section is inline-editable. Corrections are embedded and stored in Supabase. The next similar experiment plan automatically reflects those expert corrections via few-shot prompt injection — no retraining required.

4. **Voice Assistant(LabAgent)** — A floating mic button on the Literature QC and Plan pages opens a live voice call powered by ElevenLabs Conversational AI. The agent knows your current papers and protocol, and can call `search_literature` (a client-side tool) to look up new papers mid-conversation.

5. **Material Comparison & Email** — Compare reagent alternatives via Tavily + GPT, and send supplier RFQ emails via Resend — all inside the Plan dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.13 |
| LLM | GPT-4o / GPT-4o-mini via LangChain + OpenAI |
| Literature Search | Semantic Scholar API + Tavily fallback |
| Price Lookups | Tavily web search + GPT extraction |
| Embeddings | OpenAI `text-embedding-3-small` |
| Feedback Store | Supabase (PostgreSQL + pgvector) |
| Voice AI | ElevenLabs Conversational AI (WebSocket, client tools) |
| Email | Resend API |
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |

---
## Project Structure

```
ai-scientist-hacknation/
├── backend/
│   ├── main.py                    # FastAPI app + CORS + router registration
│   ├── routers/
│   │   ├── literature_qc.py       # POST /literature-qc
│   │   ├── generate_plan.py       # POST /generate-plan  +  /generate-plan/stream (SSE)
│   │   ├── chat.py                # POST /chat  — streaming text chat
│   │   ├── voice.py               # POST /voice-session  — ElevenLabs signed URL
│   │   ├── feedback.py            # POST /feedback
│   │   ├── compare.py             # POST /compare-material
│   │   └── email_quote.py         # POST /email-quote
│   ├── services/
│   │   ├── search.py              # Semantic Scholar + Tavily search + novelty classifier
│   │   ├── planner.py             # Staged plan generation + correction injection
│   │   ├── feedback.py            # Supabase store + vector similarity retrieval
│   │   ├── prices.py              # Material price cache + Tavily live lookup
│   │   ├── compare.py             # find_alternatives + get_substance_details
│   │   └── email_agent.py         # OpenAI tool-call RFQ composer + Resend sender
│   ├── models/
│   │   └── schemas.py             # All Pydantic models
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InputPage.jsx      # Hypothesis entry screen
│   │   │   ├── QCPage.jsx         # Literature QC results + chat + voice
│   │   │   └── PlanPage.jsx       # Plan dashboard — protocol, budget, materials, chat, voice
│   │   └── components/
│   │       ├── VoiceCall.jsx      # Floating voice call button (ElevenLabs SDK)
│   │       ├── PlanChat.jsx       # Floating text chat panel for the plan
│   │       ├── InlineEdit.jsx     # Hover-to-edit with feedback POST
│   │       ├── ProductComparison.jsx  # Material alternatives UI
│   │       ├── GuideTooltip.jsx   # Onboarding tooltips
│   │       └── Toast.jsx          # Save confirmation notification
│   ├── vite.config.js             # Dev proxy → backend :8000
│   └── package.json
├── supabase_setup.sql             # Run once in Supabase SQL Editor
├── Justfile                       # Dev runner (just dev / backend / frontend)
└── README.md
```

---

## Setup

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- [`just`](https://github.com/casey/just) command runner (`brew install just`)
- API keys: OpenAI, Semantic Scholar, Tavily, ElevenLabs
- A free [Supabase](https://supabase.com) project *(for the feedback loop)*
- A [Resend](https://resend.com) account *(for supplier email)*

### 2. Clone and install

```bash
git clone <repo-url>
cd mvp
just install     # creates backend/.venv + pip install + npm install
```

### 3. Configure environment

```bash
just setup       # creates backend/.env from .env.example
```

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-...
SEMANTIC_SCHOLAR_API_KEY=...
TAVILY_API_KEY=tvly-...

# ElevenLabs — voice assistant
ELEVENLABS_API_KEY=sk_...

# Supabase — feedback loop + price cache
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Resend — supplier RFQ emails
RESEND_API_KEY=re_...
FROM_EMAIL=onboarding@resend.dev
SUPPLIER_EMAIL=you@example.com
```

### 4. Set up Supabase *(feedback loop only)*

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of `supabase_setup.sql` → **Run**
3. Copy the `service_role` key into `SUPABASE_SERVICE_KEY` in your `.env`
4. Disable RLS on the feedback table:
   ```sql
   ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
   ```

### 5. Run

```bash
just dev         # starts both backend (port 8000) and frontend (port 3000)
```

Or separately:

```bash
just backend     # FastAPI on http://localhost:8000
just frontend    # Vite on http://localhost:3000
```

API docs: `http://localhost:8000/docs`

---

## API Endpoints

### `POST /literature-qc`
```json
{ "question": "Does CRISPR-Cas9 efficiently edit plant cell genomes?" }
```
Returns `novelty_signal`, `papers`, `references`, `context_summary`.

### `POST /generate-plan/stream`
SSE stream — emits staged progress events then a final `plan` JSON object.
```json
{ "question": "...", "literature_context": "...", "references": ["..."] }
```

### `POST /chat`
Streaming plain-text chat grounded in the current plan or literature context.
```json
{ "messages": [...], "context": { "question": "...", "papers": [...] } }
```

### `POST /voice-session`
Returns a signed ElevenLabs WebSocket URL for a live voice call session.
```json
{}
```
Response: `{ "signed_url": "wss://...", "agent_id": "..." }`

### `POST /feedback`
```json
{
  "experiment_question": "...",
  "category": "protocol",
  "item_label": "Step 3",
  "original_text": "Use 0.5% LAP photoinitiator",
  "corrected_text": "Use 0.1% LAP photoinitiator",
  "comment": "0.5% causes cell death in GelMA bioinks"
}
```

### `POST /compare-material`
```json
{ "material_name": "GelMA", "context": "bioprinting scaffold" }
```
Returns alternative suppliers and substance detail.

### `POST /email-quote`
Composes and sends a supplier RFQ email via Resend.

---

## Voice Assistant — How It Works

```
User clicks mic button
    └─ Frontend calls POST /voice-session
    └─ Backend creates ElevenLabs agent (cached) + returns signed WebSocket URL
    └─ Frontend connects via @elevenlabs/react SDK
    └─ onConnect fires → sendContextualUpdate injects current research context
    └─ Agent speaks, researcher replies

When agent needs more papers:
    └─ Agent emits client tool call: search_literature({ query })
    └─ Browser executes the tool → calls POST /literature-qc
    └─ Result returned to ElevenLabs → agent incorporates into answer
```

No server-side webhook needed — tool execution happens entirely in the browser via ElevenLabs' client-tool protocol.

---

## Feedback Loop — How It Works

```
CORRECTION SAVED
Researcher edits Step 3: "0.5% LAP" → "0.1% LAP"
    └─ OpenAI embeds the experiment question → 1536-dim vector
    └─ Stored in Supabase: original, corrected, comment, embedding

NEXT SIMILAR EXPERIMENT
New question arrives → /generate-plan/stream
    └─ Embed new question → cosine similarity search (threshold: 0.70)
    └─ Match found → inject into GPT-4o system prompt:
       "Expert correction: use 0.1% LAP, not 0.5% (causes cell death)"
    └─ GPT-4o generates plan with correction already applied
```

No fine-tuning. No retraining. Expert knowledge compounds automatically.

---

## Sample Hypotheses to Test

```
A paper-based electrochemical biosensor functionalized with anti-CRP antibodies
will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L
within 10 minutes, matching laboratory ELISA sensitivity.

Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will
reduce intestinal permeability by at least 30% compared to controls, measured
by FITC-dextran assay.

Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw
viability of HeLa cells by at least 15 percentage points compared to the
standard DMSO protocol.
```

---

## License

MIT © 2026 Made with Love ❤️ and lot of Redbull by Nithin Valiyaveedu, Hoi Tung Ma, Gaurav Arora — see [LICENSE](./LICENSE)
