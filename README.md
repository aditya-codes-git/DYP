# ForensIQ – Academic Integrity Analyzer

> AI-powered forensic tool that detects multi-author stitching, citation anomalies, and potential plagiarism in academic papers.

![ForensIQ Banner](https://img.shields.io/badge/ForensIQ-Academic%20Integrity-blueviolet?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)

---

## 🧠 What It Does

ForensIQ analyzes academic PDF papers and detects:

1. **Multi-Author Stitching** — Identifies if a paper was written by multiple authors with different writing styles via stylometric clustering (KMeans).
2. **Citation Anomalies** — Detects temporal mismatches, topic inconsistencies, and suspicious self-citation patterns in references.
3. **Source Tracing** — Matches flagged paragraphs against arXiv and Semantic Scholar papers using sentence embeddings.
4. **Forensic Heatmap** — Visualizes paragraph-level authorship clusters with an interactive D3.js heatmap.

---

## 🏗️ Architecture

```
┌─────────────┐     POST /upload      ┌──────────────────┐
│   React UI  │ ──────────────────────►│   FastAPI Server  │
│  (Frontend) │     GET /report/{id}   │    (Backend)      │
│             │ ◄──────────────────────│                   │
└─────────────┘                        └────────┬─────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                        PDF Parser       Stylometry         Source Tracer
                        (PyMuPDF)       (spaCy/NLTK)      (arXiv/S2 API)
                              │                 │                 │
                              ▼                 ▼                 ▼
                         Segmenter         Clustering       Citation Check
                                          (KMeans)
                              │                 │                 │
                              └─────────────────┼─────────────────┘
                                                ▼
                                         Report Builder
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:8000`.

---

## 📁 Project Structure

```
forensiq/
├── backend/
│   ├── main.py                   # FastAPI entry point
│   ├── requirements.txt
│   ├── api/
│   │   └── routes/
│   │       ├── upload.py         # PDF upload endpoint
│   │       ├── analyze.py        # Trigger full analysis
│   │       └── report.py         # Return final report JSON
│   ├── core/
│   │   ├── pdf_parser.py         # PyMuPDF text + citation extraction
│   │   ├── segmenter.py          # Split into paragraph chunks
│   │   ├── stylometry.py         # Feature extraction per paragraph
│   │   ├── citation_forensics.py # Temporal + thematic citation check
│   │   ├── clustering.py         # KMeans on style vectors
│   │   ├── source_tracer.py      # arXiv + Semantic Scholar API
│   │   └── report_builder.py     # Assemble final forensic report
│   └── models/
│       └── schemas.py            # Pydantic models for API
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── UploadPage.jsx
│   │   │   ├── AnalysisPage.jsx
│   │   │   └── ReportPage.jsx
│   │   ├── components/
│   │   │   ├── HeatmapView.jsx
│   │   │   ├── AuthorClusters.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   ├── RiskScore.jsx
│   │   │   └── CitationGraph.jsx
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── tailwind.config.js
├── samples/
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔌 API Contract

| Method | Endpoint           | Description                    | Owner    |
|--------|--------------------|--------------------------------|----------|
| POST   | `/upload`          | Upload PDF, returns `file_id`  | Backend  |
| POST   | `/analyze/{id}`    | Run full pipeline              | Backend  |
| GET    | `/report/{id}`     | Fetch completed forensic report| Backend  |
| GET    | `/health`          | Health check                   | Backend  |

See `docs/API_CONTRACT.md` for full request/response schemas.

---

## 👥 Team Workflow

| Role           | Works On                | Branch Pattern        |
|----------------|-------------------------|-----------------------|
| Backend Dev 1  | `core/` modules         | `feat/core-*`         |
| Backend Dev 2  | `api/routes/` + schemas | `feat/api-*`          |
| Frontend Dev 1 | `pages/` + `services/`  | `feat/pages-*`        |
| Frontend Dev 2 | `components/` (D3.js)   | `feat/components-*`   |

### Branch Rules
- `main` — protected, requires PR review
- `develop` — integration branch
- Feature branches merge into `develop`
- Only tested `develop` merges into `main`

---

## 🧪 Demo Flow

1. Upload sample stitched PDF
2. Show progress bar while pipeline runs
3. Reveal heatmap — 3 different colors = 3 style clusters
4. Show "Estimated authors: 3"
5. Click flagged paragraph → shows matched arXiv paper
6. Show citation anomaly panel
7. Show overall risk score: 84/100

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
