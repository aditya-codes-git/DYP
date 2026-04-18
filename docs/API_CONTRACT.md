# ForensIQ API Contract

> This document defines the exact request/response shapes for all API endpoints.
> **Frontend and Backend teams must follow this contract.**

---

## Base URL

| Environment | URL                       |
|-------------|---------------------------|
| Development | `http://localhost:8000`    |
| Frontend    | Proxied via `/api/*`      |

---

## Endpoints

### `POST /upload`

Upload a PDF file for forensic analysis.

**Request:** `multipart/form-data`

| Field  | Type         | Required | Description    |
|--------|--------------|----------|----------------|
| `file` | File (PDF)   | Yes      | PDF to analyze |

**Response:** `200 OK`

```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "paper.pdf",
  "size_bytes": 1024000,
  "status": "uploaded"
}
```

**Errors:**
- `400` — Not a PDF file
- `413` — File exceeds 50MB

---

### `POST /analyze/{file_id}`

Run the full forensic analysis pipeline.

**Path Parameters:**

| Param     | Type   | Description              |
|-----------|--------|--------------------------|
| `file_id` | string | UUID from `/upload`      |

**Response:** `200 OK`

```json
{
  "file_id": "550e8400-...",
  "status": "completed",
  "report": { ... }
}
```

The `report` field contains the full `ForensicReport` schema (see below).

**Errors:**
- `404` — File not found
- `500` — Pipeline failure

---

### `GET /report/{file_id}`

Fetch a completed forensic report.

**Response:** `200 OK` — Returns `ForensicReport` JSON directly.

**Errors:**
- `404` — Report not found (analysis not yet run)

---

### `GET /health`

Health check.

**Response:** `200 OK`

```json
{
  "status": "ok",
  "service": "forensiq-api"
}
```

---

## Data Schemas

### ForensicReport

```json
{
  "overall_risk_score": 84.0,
  "estimated_authors": 3,
  "paragraphs": [ParagraphResult],
  "clusters": [ClusterInfo],
  "citation_anomalies": CitationAnomalies,
  "source_matches": [SourceMatch]
}
```

### ParagraphResult

```json
{
  "id": 0,
  "text_preview": "First 200 characters of paragraph...",
  "cluster": 0,
  "style_stats": StyleStats,
  "flagged": false
}
```

### StyleStats

```json
{
  "avg_sentence_length": 18.5,
  "type_token_ratio": 0.72,
  "avg_word_length": 5.1,
  "punctuation_density": 0.08,
  "passive_voice_ratio": 0.15,
  "noun_verb_ratio": 2.3,
  "sentence_complexity": 4.2
}
```

### CitationAnomalies

```json
{
  "temporal_anomaly": true,
  "topic_mismatch": false,
  "self_citation_anomaly": false,
  "score": 0.35,
  "details": "Temporal gap: 45yr range with 20yr gap"
}
```

### SourceMatch

```json
{
  "paragraph_id": 3,
  "matched_paper": "Attention Is All You Need",
  "arxiv_link": "https://arxiv.org/abs/1706.03762",
  "semantic_scholar_link": null,
  "similarity": 0.87
}
```

### ClusterInfo

```json
{
  "cluster_id": 0,
  "paragraph_count": 5,
  "avg_style": StyleStats
}
```
