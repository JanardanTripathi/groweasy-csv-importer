# AI-Powered CSV Importer (GrowEasy Assignment)

An intelligent, AI-powered CSV Importer that parses arbitrary CSV leads (from Facebook Ads, Google Ads, custom spreadsheets, real estate CRMs, etc.) and maps them into GrowEasy's standard CRM lead format. Built with **Next.js (Frontend)**, **Node.js/Express (Backend)**, and **Gemini / OpenAI API (AI mapping engine)**.

---

## Technical Features

### Frontend (Next.js)
* **Theme Customization**: Responsive theme toggle supports light and dark modes with persistent local storage caching.
* **Modern Interface**: Premium styling using glassmorphism, glowing micro-animations, and Inter/Outfit display typography.
* **Responsive Layout**: Seamless presentation on desktop, tablet, and mobile browsers.
* **Interactive Table**: High-performance scrolling preview and result tables with sticky headers.
* **Upload Wizard**: Four-step import process (Upload -> Preview -> AI Extraction -> Results).
* **Drag-and-Drop**: Easily drop files or select using the native picker.

### Backend (Node/Express)
* **Flexible Parsing**: Accepts any CSV layout and parses columns dynamically.
* **AI Schema Mapping**: Formulates prompt structures to translate arbitrary headers into correct CRM keys.
* **Batch Processing**: Chunks large CSV inputs into manageable batches to respect token bounds and rate limits.
* **Retry Strategy**: Implements automatic exponential backoff retry logic (up to 3 attempts) for failed AI batches.
* **BOM & Trim Cleanups**: Strips byte-order marks and trims whitespace automatically during parsing.
* **Dockerized**: Includes standard `Dockerfile` files for frontend/backend and a root `docker-compose.yml`.
* **Unit Testing**: Contains server-side test script verifying file inputs.

---

## GrowEasy CRM Schema mapping

The AI model targets the following fields:
* `created_at`: Formatted to `YYYY-MM-DD HH:mm:ss` (convertible via `new Date()`).
* `name`: Lead name (combines split columns).
* `email`: Primary email (first parsed address, extra emails go to notes).
* `country_code`: Standard phone prefix (+91, +1, etc.).
* `mobile_without_country_code`: Raw phone number without prefixes.
* `company`: Business name.
* `city`, `state`, `country`
* `lead_owner`: Assigned user.
* `crm_status`: Categorized into: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`.
* `data_source`: Categorized into: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, or `sarjapur_plots`.
* `possession_time`
* `crm_note`: Extracted remarks, follow-up comments, extra emails, or alternative numbers.
* `description`: Raw row summary.

*Note: Records lacking both email and mobile numbers are automatically skipped.*

---

## Directory Layout

```
groweasy-csv-importer/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Controller and business logic
│   │   ├── services/       # AI service integrations (Gemini & OpenAI)
│   │   ├── utils/          # Parse cleaners
│   │   └── tests/          # Parser assertions
│   ├── server.js           # Server runner
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (Layouts & Pages)
│   │   └── components/     # UI elements (CSVImporter, ThemeToggle, Table)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Prerequisite
* Node.js v20.x
* npm v10.x

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your env configuration file:
   ```bash
   cp .env.example .env
   ```
3. Fill in your API Key and choose your AI Provider:
   ```env
   PORT=5000
   AI_PROVIDER=gemini # or 'openai'
   GEMINI_API_KEY=your_gemini_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development build:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Compose Setup

Run both the client and server applications in an isolated container environment:

1. In the root directory, create a `.env` file containing your keys:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   OPENAI_API_KEY=your_actual_key_here
   ```
2. Compile and boot the containers:
   ```bash
   docker-compose up --build
   ```
3. The frontend is accessible at `http://localhost:3000` and backend is listening on `http://localhost:5000`.

---

## Running Tests

Verify the backend parser and whitespace trimming:
```bash
cd backend
npm test
```
---

## Author
``` Janardan Tripathi ```