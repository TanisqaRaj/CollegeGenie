# CollegeGenie

> **10 Smart AI Tools for Students**

A full-stack web application that provides AI-powered tools to help college students study smarter, build professional resumes, generate presentations, and visualize topics as mind maps.

---

## Features (Phase 1 — 4 Tools)

| Tool | Description |
|------|-------------|
| **AI Resume Builder** | Fill in your details; AI improves grammar and returns a professional LaTeX-style resume with PDF and .tex export |
| **AI Notes Generator** | Paste any study material; get short, detailed, or exam-focused structured Markdown notes |
| **AI PPT Generator** | Enter a topic; get a full slide deck with slide-by-slide navigation and PPTX download |
| **AI Mind Map Generator** | Paste a syllabus; get a visual collapsible tree with click-to-explain nodes |

---

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (SPA with hash routing)
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT or Google Gemini (configured via `.env`)
- **Libraries**: jsPDF, marked.js, DOMPurify, PptxGenJS (all loaded via CDN)

---

## Folder Structure

```
AI-Student-Toolkit/
├── package.json
├── README.md
├── .gitignore
├── .env.example
├── server/
│   ├── server.js          # Express server
│   ├── aiService.js       # AI provider logic + demo data
│   └── routes/
│       └── ai.js          # POST /api/ai endpoint
└── public/
    ├── index.html         # SPA shell
    ├── css/
    │   ├── style.css      # Global styles, variables, layout
    │   ├── dashboard.css  # Tool-specific styles
    │   └── responsive.css # Mobile/tablet breakpoints
    └── js/
        ├── app.js         # SPA router, sidebar, navigation
        ├── api.js         # Shared API client
        ├── utils.js       # Shared utilities (toast, download, PDF...)
        └── modules/
            ├── resume.js  # Resume Builder module
            ├── notes.js   # Notes Generator module
            ├── ppt.js     # PPT Generator module
            └── mindmap.js # Mind Map Generator module
```

---

## Installation

```bash
cd AI-Student-Toolkit
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env`:

```env
PORT=3000
DEMO_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-3.5-turbo
```

---

## How to Run

```bash
npm start
```

Open your browser at: **http://localhost:3000**

For development with auto-reload:
```bash
npm run dev
```
(requires `nodemon` — already in devDependencies)

---

## Demo Mode

When `DEMO_MODE=true` (or no API key is set), the app returns **realistic sample data** for all 4 tools so you can demonstrate the full UI without needing an API key.

A **Demo Mode** badge is shown in the sidebar and navbar.

---

## AI API Configuration

### OpenAI
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo
```

### Google Gemini
```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_key
AI_MODEL=gemini-pro
```

---

## Tool Usage

### Resume Builder
1. Fill in personal info, education, skills, experience, projects, certifications, achievements
2. Click **Generate Resume**
3. Preview the LaTeX-style resume on the right
4. Switch to **LaTeX Source** tab to view/copy/download `.tex`
5. Use **Download PDF** or **Print**

### Notes Generator
1. Paste textbook content or topic text
2. Choose **Short / Detailed / Exam** style
3. Click **Generate Notes**
4. Copy, download as TXT, or download as PDF

### PPT Generator
1. Enter topic, number of slides, audience, level
2. Click **Generate Slides**
3. Navigate slides with Prev/Next or click the slide list
4. Click **Download PPTX** for a real `.pptx` file

### Mind Map Generator
1. Paste your syllabus or topic list
2. Click **Generate Mind Map**
3. Click any node to **Explain Topic**
4. Use zoom controls (+/-/reset)
5. Click **Download JSON** to save the structure

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm install` fails | Make sure Node.js ≥ 16 is installed |
| Server won't start | Check that port 3000 is free; change `PORT` in `.env` |
| "Cannot connect to server" | Make sure `npm start` is running before opening the browser |
| AI returns error 401 | Invalid API key — check `.env` |
| AI returns error 429 | Rate limit hit — wait 1 minute |
| PDF download blank | Try the **Print** button instead |
| PPTX download fails | Refresh page; CDN library may not have loaded |

---

## Future Expansion (Tools 5–10)

The architecture is modular. To add a new tool:

1. Create `public/js/modules/yourtool.js` exporting `window.YourModule = { init(containerId) {} }`
2. Add a `<main id="page-yourtool" class="page">` in `index.html`
3. Register it in `app.js` `pageModules` and `pageLabels`
4. Add a nav item in the sidebar
5. Add backend prompt logic in `aiService.js`

No existing modules need to be changed.

---

## Security Notes

- API keys are **never** sent to the frontend
- All AI HTML output is sanitized with DOMPurify before rendering
- Rate limiting (60 req/min) is applied on the `/api/` route
- `.env` is in `.gitignore` — never commit it
