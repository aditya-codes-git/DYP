/**
 * API Service
 * ===========
 * Centralized API calls to the FastAPI backend.
 *
 * Base URL is proxied via Vite dev server:
 *   /api/* → http://localhost:8000/*
 *
 * Owner: Frontend Dev
 * Dependencies: axios
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for long analysis
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Upload a PDF file for analysis.
 * @param {File} file - PDF File object
 * @returns {{ file_id, filename, size_bytes, status }}
 */
export async function uploadPDF(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Trigger full forensic analysis pipeline.
 * @param {string} fileId - UUID from upload
 * @returns {{ file_id, status, report }}
 */
export async function analyzeFile(fileId) {
  const response = await api.post(`/analyze/${fileId}`)
  return response.data
}

/**
 * Fetch a completed forensic report.
 * @param {string} fileId - UUID of analyzed file
 * @returns {ForensicReport}
 */
export async function getReport(fileId) {
  const response = await api.get(`/report/${fileId}`)
  return response.data
}

/**
 * Health check.
 */
export async function healthCheck() {
  const response = await api.get('/health')
  return response.data
}

export default api
