import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileUp, Brain, CheckCircle2, Loader2, Upload,
  FileText, X, AlertCircle, ArrowRight, Sparkles,
  Shield, CloudUpload, ScanSearch, Database
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import * as pdfjsLib from 'pdfjs-dist'

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `You are a forensic linguist and academic integrity expert. You will be given an array of paragraphs from a research paper. Your job is to analyze each paragraph's writing style and detect authorship inconsistency.

For each paragraph analyze:
- Sentence length variance
- Vocabulary richness and complexity
- Tone (formal/informal/technical/casual)
- Linguistic fingerprint (passive voice usage, transition words, punctuation patterns)

Group paragraphs into style clusters (label them A, B, C, D...). Paragraphs with similar writing style belong to the same cluster. Assign each paragraph a consistency_score from 0.0 to 1.0 where 1.0 = perfectly consistent with document style, 0.0 = completely inconsistent.

Return ONLY a valid JSON object, no explanation, no markdown, no backticks:
{
  "paragraphs": [
    {
      "id": 1,
      "cluster": "A",
      "consistency_score": 0.91,
      "tone": "formal",
      "vocabulary_richness": "high",
      "sentence_length": "long",
      "reason": "one sentence explanation of why this paragraph fits or stands out",
      "flagged": false
    }
  ],
  "integrity_score": 0.0-100.0,
  "author_count": number,
  "verdict": "Likely Single Author" | "Possibly Multi-Author ⚠️" | "Highly Likely Stitched Content 🚨",
  "summary": "3-4 sentence plain English forensic summary explaining what was found, which paragraph ranges shifted, what that implies, and why it matters for academic integrity"
}

A paragraph is flagged: true if its cluster differs from the majority cluster OR its consistency_score < 0.6.
integrity_score = (number of non-flagged paragraphs / total paragraphs) * 100, rounded to 1 decimal.
author_count = number of distinct clusters found.`

const STEPS = [
  { id: 'upload', label: 'Uploading to secure storage...', icon: CloudUpload },
  { id: 'extract', label: 'Extracting document text...', icon: ScanSearch },
  { id: 'analyze', label: 'Running forensic analysis...', icon: Brain },
  { id: 'save', label: 'Saving report...', icon: Database },
]

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | analyzing | done | error
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      if (droppedFile.size <= 10 * 1024 * 1024) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('File size exceeds 10MB limit.')
      }
    } else {
      setError('Only PDF files are accepted.')
    }
  }, [])

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size <= 10 * 1024 * 1024) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('File size exceeds 10MB limit.')
      }
    } else if (selectedFile) {
      setError('Only PDF files are accepted.')
    }
  }, [])

  const markStepComplete = (stepIdx) => {
    setCompletedSteps(prev => [...prev, stepIdx])
    setCurrentStep(stepIdx + 1)
  }

  const runPipeline = async () => {
    if (!file) return
    setPhase('analyzing')
    setCurrentStep(0)
    setCompletedSteps([])
    setError(null)

    try {
      // ── Step 1: Upload PDF to Supabase Storage ──
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { contentType: 'application/pdf' })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      markStepComplete(0)

      // ── Step 2: Extract text from PDF ──
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + '\n\n'
      }

      markStepComplete(1)

      // ── Step 3: Split into paragraphs & call Groq ──
      let paragraphs = fullText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length >= 100)
        .slice(0, 40)

      if (paragraphs.length === 0) {
        throw new Error('Could not extract enough text from the PDF. Please ensure the file contains selectable text.')
      }

      const userMessage = JSON.stringify(paragraphs.map((text, i) => ({ id: i + 1, text })))

      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      })

      if (!groqResponse.ok) {
        const errBody = await groqResponse.text()
        throw new Error(`Groq API error: ${groqResponse.status} - ${errBody}`)
      }

      const groqData = await groqResponse.json()
      const rawContent = groqData.choices[0].message.content

      // Parse JSON — handle potential markdown backticks
      let analysisResult
      try {
        const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        analysisResult = JSON.parse(cleaned)
      } catch {
        throw new Error('Failed to parse AI analysis response. The model returned invalid JSON.')
      }

      markStepComplete(2)

      // ── Step 4: Save to Supabase ──
      const { data: insertData, error: insertError } = await supabase
        .from('analyses')
        .insert({
          file_name: file.name,
          file_url: publicUrl,
          raw_text: fullText,
          paragraphs: paragraphs.map((text, i) => ({ id: i + 1, text })),
          result: analysisResult,
          integrity_score: analysisResult.integrity_score,
          author_count: analysisResult.author_count,
          verdict: analysisResult.verdict,
          summary: analysisResult.summary,
        })
        .select()
        .single()

      if (insertError) throw new Error(`Database error: ${insertError.message}`)

      markStepComplete(3)
      setResult({ id: insertData.id, verdict: analysisResult.verdict, integrity_score: analysisResult.integrity_score })
      setPhase('done')

    } catch (err) {
      console.error('Pipeline error:', err)
      setError(err.message)
      setPhase('error')
    }
  }

  const getVerdictColor = (verdict) => {
    if (!verdict) return 'bg-slate-100 text-slate-600'
    if (verdict.includes('🚨')) return 'bg-red-50 text-red-700 border-red-200'
    if (verdict.includes('⚠️')) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6"
      style={{ textAlign: 'left' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-5">
            <Shield className="w-3.5 h-3.5" />
            Forensic Analysis Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Upload & Analyze
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
            Upload a research paper to detect authorship inconsistencies and style shifts.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ════════════ IDLE STATE ════════════ */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-16 
                  flex flex-col items-center justify-center text-center transition-all duration-300
                  bg-white
                  ${dragOver
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300
                  ${dragOver ? 'bg-indigo-100 scale-110' : 'bg-slate-100'}
                `}>
                  <FileUp className={`w-9 h-9 transition-colors ${dragOver ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-lg font-bold text-slate-800 mb-1">
                  {dragOver ? 'Drop it here!' : 'Drop your research paper here'}
                </p>
                <p className="text-sm text-slate-400 mb-6">PDF up to 10MB</p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  Browse Files
                </button>
              </div>

              {/* Selected File */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-5 bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Analyze Button */}
              <motion.button
                onClick={runPipeline}
                disabled={!file}
                className={`
                  mt-8 w-full py-4 rounded-full text-base font-bold flex items-center justify-center gap-3
                  transition-all duration-300
                  ${file
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }
                `}
                whileHover={file ? { scale: 1.01 } : undefined}
                whileTap={file ? { scale: 0.99 } : undefined}
              >
                <Brain className="w-5 h-5" />
                Analyze Document
              </motion.button>
            </motion.div>
          )}

          {/* ════════════ ANALYZING STATE ════════════ */}
          {(phase === 'analyzing' || phase === 'error') && (
            <motion.div
              key="analyzing"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm"
            >
              {/* Progress Bar */}
              <div className="h-1.5 rounded-full bg-slate-100 mb-10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: '0%' }}
                  animate={{
                    width: phase === 'error' ? `${(completedSteps.length / 4) * 100}%` : `${((completedSteps.length + 0.5) / 4) * 100}%`
                  }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              </div>

              <div className="space-y-6">
                {STEPS.map((step, idx) => {
                  const isComplete = completedSteps.includes(idx)
                  const isActive = currentStep === idx && phase !== 'error'
                  const isPending = idx > currentStep
                  const isFailed = phase === 'error' && currentStep === idx
                  const StepIcon = step.icon

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                        isComplete ? 'bg-emerald-50/50' :
                        isActive ? 'bg-indigo-50/50' :
                        isFailed ? 'bg-red-50/50' :
                        'bg-transparent'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isComplete ? 'bg-emerald-100' :
                        isActive ? 'bg-indigo-100' :
                        isFailed ? 'bg-red-100' :
                        'bg-slate-100'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        ) : isFailed ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <StepIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold transition-colors ${
                          isComplete ? 'text-emerald-700' :
                          isActive ? 'text-indigo-700' :
                          isFailed ? 'text-red-600' :
                          'text-slate-400'
                        }`}>
                          {step.label}
                        </p>
                        {isComplete && (
                          <p className="text-xs text-emerald-500 mt-0.5">Completed</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Error display during analyzing */}
              {phase === 'error' && error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-100"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-1">Analysis Failed</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPhase('idle'); setError(null); setCompletedSteps([]) }}
                    className="mt-4 w-full py-3 rounded-xl bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ════════════ DONE STATE ════════════ */}
          {phase === 'done' && result && (
            <motion.div
              key="done"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">Analysis Complete</h2>
              <p className="text-slate-500 mb-6">Your forensic report is ready.</p>

              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold mb-8 ${getVerdictColor(result.verdict)}`}>
                <Sparkles className="w-4 h-4" />
                {result.verdict}
              </div>

              <div className="text-5xl font-black text-slate-900 mb-2">{result.integrity_score?.toFixed(1)}%</div>
              <p className="text-sm text-slate-400 mb-10">Integrity Score</p>

              <button
                onClick={() => navigate(`/report/${result.id}`)}
                className="w-full py-4 rounded-full bg-indigo-600 text-white text-base font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
              >
                View Full Report
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
