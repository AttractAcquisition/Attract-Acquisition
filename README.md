# attract-acquisition — OS Repository

> Internal operating system for Attract Acquisition (Pty) Ltd  
> Principal: Alexander Anderson | Cape Town → Rome | Oct 2026 – Mar 2028

---

## Repository Structure

```
attract-acquisition/
│
├── README.md                          ← this file
├── .env.example                       ← environment variable template
│
├── ai/                                ← AI layer — all prompts and configs
│   ├── master-system-prompt.md        ← PRIMARY: load into all AI integrations
│   ├── mjr-prompt.md                  ← Missed Jobs Report generation prompt
│   ├── outreach-copy-prompt.md        ← WhatsApp outreach personalisation prompt
│   ├── explainer-call-prompt.md       ← Sales call coaching prompt
│   ├── sop-writer-prompt.md           ← SOP generation assistant prompt
│   └── objection-handling-prompt.md   ← 4 objection scripts (budget/busy/someone/NI)
│
├── supabase/                          ← Database layer
│   ├── schema.sql                     ← Full Supabase schema (all tables)
│   ├── rls-policies.sql               ← Row-level security policies
│   └── seed-data/
│       └── cape-town-businesses.json  ← 369 prospects (converted from HTML)
│
├── n8n/                               ← Automation workflows (exported JSON)
│   ├── apify-to-supabase.json         ← Scraper → database pipeline
│   ├── lead-whatsapp-trigger.json     ← New ★★★ lead → WhatsApp sequence
│   ├── mjr-generation.json            ← MJR request → Claude → PDF → delivery
│   ├── crm-hygiene-weekly.json        ← Dead lead archiving + pipeline updates
│   └── financial-tracker.json        ← Monthly MRR → Schedule D variance
│
├── lovable/                           ← Frontend applications (Lovable/Next.js)
│   ├── aa-portal/                     ← Client-facing pipeline tracker
│   ├── aa-crm/                        ← Internal prospect + client CRM
│   ├── aa-studio/                     ← MJR builder + content tools
│   └── landing-page/                  ← attractacq.com public site
│
├── docs/                              ← Business documents (source files)
│   ├── business-plan.html
│   ├── aa-client-roadmap.html
│   ├── landing-page.html
│   ├── 24-month-master.pdf
│   └── prospect-data/
│       └── cape-town-businesses.html  ← Raw prospect HTML (source)
│
├── assets/                            ← Brand assets
│   ├── brand/
│   │   ├── logo/                      ← .svg, .png variants
│   │   ├── colours.md                 ← Hex codes, usage rules
│   │   └── fonts/                     ← Playfair Display, DM Mono, DM Sans
│   └── templates/
│       ├── email-signature/
│       ├── whatsapp-messages/
│       └── report-headers/
│
├── sops/                              ← Standard Operating Procedures
│   ├── 01-cold-outreach-whatsapp.md
│   ├── 02-cold-outreach-inperson.md
│   ├── 03-cold-outreach-meta-ads.md
│   ├── 04-pipeline-gate.md
│   ├── 05-report-delivery-sequence.md
│   ├── 06-explainer-call.md
│   ├── 07-proof-sprint-setup.md
│   ├── 08-proof-sprint-execution.md
│   ├── 09-results-meeting.md
│   ├── 10-proof-brand-monthly.md
│   ├── 11-client-onboarding-week1.md
│   └── 12-authority-brand-upsell.md
│
└── templates/                         ← Client-facing and internal templates
    ├── whatsapp/
    │   ├── message-01-cold-intro.md
    │   ├── message-02-followup-48h.md
    │   ├── message-03-followup-96h.md
    │   └── mjr-delivery-flow.md
    ├── contracts/
    │   ├── service-agreement-tier1.md
    │   ├── service-agreement-tier2.md
    │   └── proof-sprint-terms.md
    ├── call-scripts/
    │   ├── explainer-call-script.md
    │   └── results-meeting-script.md
    └── reports/
        ├── mjr-template.html
        └── sprint-results-deck.md
```

---

## Setup Order (Exact Sequence)

### Step 1 — GitHub
```bash
git clone https://github.com/[your-handle]/attract-acquisition.git
cd attract-acquisition
cp .env.example .env
# Fill in all env vars before proceeding
```

### Step 2 — Supabase
1. Create new Supabase project: `attract-acquisition-prod`
2. Run `supabase/schema.sql` in SQL editor
3. Run `supabase/rls-policies.sql`
4. Import `supabase/seed-data/cape-town-businesses.json` → prospects table
5. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`

### Step 3 — N8N
1. Self-host N8N (Railway or Render — cheapest option)
2. Import all JSON workflows from `/n8n/`
3. Set credentials: Supabase, Apify, WhatsApp Business API, Anthropic, OpenAI
4. Activate workflows in this order: `apify-to-supabase` → `lead-whatsapp-trigger` → `mjr-generation`

### Step 4 — Lovable
1. Create new Lovable project
2. Connect to GitHub repo
3. Connect to Supabase (use same project)
4. Build in this order: AA Portal → AA CRM → AA Studio → Landing Page

### Step 5 — AI Layer
1. Load `ai/master-system-prompt.md` as system prompt in all Claude and GPT integrations
2. Test MJR generation pipeline end-to-end with 3 sample businesses
3. Confirm output format, delivery time < 24h

---

## Environment Variables (.env)

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Apify
APIFY_API_TOKEN=

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Meta Ads
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=

# Google
GOOGLE_PLACES_API_KEY=
GOOGLE_ANALYTICS_ID=

# N8N
N8N_WEBHOOK_URL=
N8N_API_KEY=
```

---

## Key Dates

| Date | Event |
|---|---|
| Mar 2026 | Repo created. Infrastructure build begins. |
| Apr–Jun 2026 | SOPs, templates, and N8N workflows built |
| Jul–Aug 2026 | Brand assets, systems testing, full end-to-end simulation |
| Sep 30, 2026 | All systems locked and tested. R158k seed capital confirmed. |
| Oct 1, 2026 | AA launches. First 25 outreach messages sent within 48h of landing. |
| Dec 1, 2026 | Target: 5 active clients. Cash flow positive. |
| Mar 1, 2027 | Target: R50k MRR. 10 clients. |
| Oct 1, 2027 | Relocation to Rome. Remote operations begin. |
| Mar 31, 2028 | 24-month milestone: R200k MRR. R453k trust balance. LLC valued R1.8M. |

---

*Private & Confidential — Attract Acquisition (Pty) Ltd*
