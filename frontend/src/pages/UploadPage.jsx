import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileUp, Brain, CheckCircle2, Loader2, Upload,
  FileText, X, AlertCircle, ArrowRight, Sparkles,
  Shield, CloudUpload, ScanSearch, Database, Bot,
  Globe, Scissors, SearchCheck
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import * as pdfjsLib from 'pdfjs-dist';
import PDFWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorker;
import { runStylometryAnalysis, runAIDetection, runSourceTracing } from '../lib/analysisClient'

const STEPS = [
  { id: 'upload', label: 'Uploading to secure storage...', icon: CloudUpload },
  { id: 'extract', label: 'Extracting document text...', icon: ScanSearch },
  { id: 'preprocess', label: 'Preprocessing paragraphs...', icon: Scissors },
  { id: 'stylometry', label: 'Running stylometric analysis...', icon: Brain },
  { id: 'aidetect', label: 'Running AI content detection...', icon: Bot },
  { id: 'sources', label: 'Tracing academic sources...', icon: Globe },
  { id: 'save', label: 'Saving forensic report...', icon: Database },
]

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length
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
  const [activeSteps, setActiveSteps] = useState([]) // Multiple steps can be active in parallel
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [pipelineStatus, setPipelineStatus] = useState({
    stylometry: 'pending',  // pending | running | done | failed
    aiDetection: 'pending',
    sourceTracing: 'pending',
  })

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
    setActiveSteps(prev => prev.filter(s => s !== stepIdx))
  }

  const markStepActive = (stepIdx) => {
    setActiveSteps(prev => [...prev, stepIdx])
    setCurrentStep(prev => Math.max(prev, stepIdx))
  }

  const runPipeline = async () => {
    if (!file) return
    setPhase('analyzing')
    setCurrentStep(0)
    setCompletedSteps([])
    setActiveSteps([])
    setError(null)
    setPipelineStatus({ stylometry: 'pending', aiDetection: 'pending', sourceTracing: 'pending' })

    try {
      // ── Step 1: Upload PDF to Supabase Storage ──
      markStepActive(0)
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
      markStepActive(1)
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

      // ── Step 3: Preprocess paragraphs ──
      markStepActive(2)

      // Split by double newline
      const rawParagraphs = fullText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

      // Detect and strip references section
      const referencesPatterns = [
        /^references$/i,
        /^bibliography$/i,
        /^works cited$/i,
        /^cited works$/i,
        /^literature cited$/i,
      ]

      let referencesStartIdx = -1
      for (let i = 0; i < rawParagraphs.length; i++) {
        const firstLine = rawParagraphs[i].split('\n')[0].trim()
        if (referencesPatterns.some(pat => pat.test(firstLine))) {
          referencesStartIdx = i
          break
        }
      }

      const bodyParagraphs = referencesStartIdx >= 0
        ? rawParagraphs.slice(0, referencesStartIdx)
        : rawParagraphs

      const referencesText = referencesStartIdx >= 0
        ? rawParagraphs.slice(referencesStartIdx).join('\n\n')
        : ''

      // Filter out paragraphs under 30 words and limit to 40
      const cleanParagraphs = bodyParagraphs
        .filter(p => countWords(p) >= 30)
        .slice(0, 40)

      if (cleanParagraphs.length === 0) {
        throw new Error('Could not extract enough text from the PDF. Please ensure the file contains selectable text with at least 30 words per paragraph.')
      }

      // Number sequentially
      const numberedParagraphs = cleanParagraphs.map((text, i) => ({
        id: i + 1,
        text,
      }))

      const charCount = cleanParagraphs.join('').length

      console.log(`[Preprocessing] ${cleanParagraphs.length} paragraphs extracted, ${referencesStartIdx >= 0 ? 'references found' : 'no references section'}, ${charCount} total chars`)

      markStepComplete(2)

      // ── Steps 3-5: Run unified backend analysis ──
      // Mark all pipeline steps as active
      markStepActive(3)
      markStepActive(4)
      markStepActive(5)

      setPipelineStatus(prev => ({ ...prev, stylometry: 'running', aiDetection: 'running', sourceTracing: 'running' }));
      let analysisData;

      try {
        const { data, error } = await supabase.functions.invoke('analyze', {
          body: { action: 'analyze', paragraphs: cleanParagraphs },
        });

        if (error) {
          throw new Error(error.message);
        }
        if (!data || !data.success) {
          throw new Error(data?.error || 'Empty response from Edge Function');
        }

        analysisData = data;
        
        setPipelineStatus(prev => ({ 
          ...prev, 
          stylometry: analysisData.stylometry ? 'done' : 'failed', 
          aiDetection: analysisData.aiDetection ? 'done' : 'failed', 
          sourceTracing: analysisData.sourceTracing ? 'done' : 'failed' 
        }));

        if (analysisData.stylometry) markStepComplete(3);
        if (analysisData.aiDetection) markStepComplete(4);
        if (analysisData.sourceTracing) markStepComplete(5);

      } catch (err) {
        setPipelineStatus(prev => ({ ...prev, stylometry: 'failed', aiDetection: 'failed', sourceTracing: 'failed' }));
        throw new Error('Pipeline analysis crashed: ' + err.message);
      }

      // Log pipeline results
      console.log('[Pipeline Results] Unified Edge Function Response:', analysisData);

      const stylometryResult = analysisData.stylometry;
      const aiDetectionResult = analysisData.aiDetection;
      const sourceTracingResult = analysisData.sourceTracing;

      const warnings = analysisData.warnings || [];
      if (!stylometryResult) warnings.push("Stylometric analysis unavailable or incomplete");
      if (!aiDetectionResult) warnings.push("AI detection unavailable");
      if (!sourceTracingResult || !sourceTracingResult.paragraph_traces || sourceTracingResult.paragraph_traces.length === 0) warnings.push("Source tracing returned no hits or unavailable");

      // ── Compute Combined Verdict ──
      const stylometryScore = stylometryResult?.integrity_score ?? 100;
      const aiScore = aiDetectionResult?.overall_ai_score ?? 0;
      const stitchingDetected = sourceTracingResult?.stitching_analysis?.stitching_detected ?? false;
      const stitchingConfidence = sourceTracingResult?.stitching_analysis?.confidence ?? 'low';
      const sourceMatchCount = sourceTracingResult?.paragraph_traces?.length ?? 0;

      let combinedVerdict, combinedRisk;
      if (aiScore > 65 || stitchingDetected || stylometryScore < 50) {
        combinedVerdict = '🚨 HIGH RISK — Suspicious Content Detected';
        combinedRisk = 'high';
      } else if (aiScore > 45 || stylometryScore < 75 || (sourceMatchCount > 0 && stitchingConfidence === 'low')) {
        combinedVerdict = '⚠️ MODERATE RISK — Flagged Inconsistencies';
        combinedRisk = 'moderate';
      } else {
        combinedVerdict = '✅ LOW RISK — Document Appears Original';
        combinedRisk = 'low';
      }

      // ── Step 6: Save to Supabase ──
      markStepActive(6)

      const combinedResult = {
        stylometry: stylometryResult || { integrity_score: 100, cluster_count: 1, paragraphs: [] },
        aiDetection: aiDetectionResult || { overall_ai_score: 0, paragraphs: [] },
        sourceTracing: sourceTracingResult || { fallback: true, paragraph_traces: [] },
        warnings: warnings,
        combinedVerdict,
        combinedRisk,
        // Legacy fields for backward compat
        paragraphs: stylometryResult?.paragraphs || [],
      };

      const { data: insertData, error: insertError } = await supabase
        .from('analyses')
        .insert({
          file_name: file.name,
          file_url: publicUrl,
          raw_text: fullText,
          paragraphs: numberedParagraphs,
          result: combinedResult,
          integrity_score: stylometryScore,
          author_count: stylometryResult?.cluster_count || 1,
          verdict: combinedVerdict,
          summary: stylometryResult?.summary || '',
        })
        .select()
        .single()

      if (insertError) throw new Error(`Database error: ${insertError.message}`)

      markStepComplete(6)
      setResult({
        id: insertData.id,
        verdict: combinedVerdict,
        combinedRisk,
        integrity_score: stylometryScore,
        ai_score: aiScore,
        warnings,
      })
      setPhase('done')

    } catch (err) {
      console.error('Pipeline error:', err)
      setError(err.message || "We're having trouble analyzing your file. Please try again.")
      setPhase('error')
    }
  }

  const getRiskColor = (risk) => {
    if (!risk) return 'bg-slate-100 text-slate-600'
    if (risk === 'high') return 'bg-red-50 text-red-700 border-red-200'
    if (risk === 'moderate') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  const getVerdictColor = (verdict) => {
    if (!verdict) return 'bg-slate-100 text-slate-600'
    if (verdict.includes('🚨') || verdict.includes('HIGH RISK')) return 'bg-red-50 text-red-700 border-red-200'
    if (verdict.includes('⚠️') || verdict.includes('MODERATE')) return 'bg-amber-50 text-amber-700 border-amber-200'
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
            Upload a research paper to detect authorship inconsistencies, AI-generated content, and sourcing patterns.
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

              {/* Pipeline Info */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: Brain, label: 'Stylometry', desc: 'Writing style analysis', color: 'indigo' },
                  { icon: Bot, label: 'AI Detection', desc: 'AI content scanner', color: 'purple' },
                  { icon: Globe, label: 'Source Tracing', desc: 'Academic sourcing', color: 'orange' },
                ].map((p, i) => {
                  const Icon = p.icon
                  const colorMap = {
                    indigo: 'bg-indigo-50 text-indigo-600',
                    purple: 'bg-purple-50 text-purple-600',
                    orange: 'bg-orange-50 text-orange-600',
                  }
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                      <div className={`w-10 h-10 rounded-xl ${colorMap[p.color]} flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">{p.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                    </div>
                  )
                })}
              </div>

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
                <SearchCheck className="w-5 h-5" />
                Run Full Forensic Analysis
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
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500"
                  initial={{ width: '0%' }}
                  animate={{
                    width: phase === 'error' ? `${(completedSteps.length / STEPS.length) * 100}%` : `${((completedSteps.length + 0.3) / STEPS.length) * 100}%`
                  }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              </div>

              <div className="space-y-4">
                {STEPS.map((step, idx) => {
                  const isComplete = completedSteps.includes(idx)
                  const isActive = activeSteps.includes(idx) && !isComplete
                  const isPending = !isComplete && !isActive
                  const isFailed = phase === 'error' && isActive
                  const StepIcon = step.icon

                  // Color coding for pipeline steps
                  const pipelineColors = {
                    stylometry: { active: 'bg-indigo-50', icon: 'bg-indigo-100', text: 'text-indigo-700', spin: 'text-indigo-600' },
                    aidetect: { active: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-700', spin: 'text-purple-600' },
                    sources: { active: 'bg-orange-50', icon: 'bg-orange-100', text: 'text-orange-700', spin: 'text-orange-600' },
                  }
                  const pColor = pipelineColors[step.id]

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                        isComplete ? 'bg-emerald-50/50' :
                        isActive && pColor ? pColor.active :
                        isActive ? 'bg-indigo-50/50' :
                        isFailed ? 'bg-red-50/50' :
                        'bg-transparent'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isComplete ? 'bg-emerald-100' :
                        isActive && pColor ? pColor.icon :
                        isActive ? 'bg-indigo-100' :
                        isFailed ? 'bg-red-100' :
                        'bg-slate-100'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isActive ? (
                          <Loader2 className={`w-5 h-5 animate-spin ${pColor ? pColor.spin : 'text-indigo-600'}`} />
                        ) : isFailed ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <StepIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold transition-colors ${
                          isComplete ? 'text-emerald-700' :
                          isActive && pColor ? pColor.text :
                          isActive ? 'text-indigo-700' :
                          isFailed ? 'text-red-600' :
                          'text-slate-400'
                        }`}>
                          {step.label}
                        </p>
                        {isComplete && (
                          <p className="text-xs text-emerald-500 mt-0.5">Completed</p>
                        )}
                        {isActive && ['stylometry', 'aidetect', 'sources'].includes(step.id) && (
                          <p className="text-xs text-slate-400 mt-0.5">Running in parallel...</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pipeline Status Badges */}
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                {[
                  { key: 'stylometry', label: 'Stylometry', color: 'indigo' },
                  { key: 'aiDetection', label: 'AI Detection', color: 'purple' },
                  { key: 'sourceTracing', label: 'Source Tracing', color: 'orange' },
                ].map(p => {
                  const status = pipelineStatus[p.key]
                  const statusColors = {
                    pending: 'bg-slate-100 text-slate-400',
                    running: `bg-${p.color}-50 text-${p.color}-600 border-${p.color}-200`,
                    done: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    failed: 'bg-red-50 text-red-600 border-red-200',
                  }
                  return (
                    <span
                      key={p.key}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[status] || statusColors.pending}`}
                    >
                      {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                      {status === 'failed' && <AlertCircle className="w-3 h-3" />}
                      {p.label}: {status}
                    </span>
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
                    onClick={runPipeline}
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
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  result.combinedRisk === 'high' ? 'bg-red-50' :
                  result.combinedRisk === 'moderate' ? 'bg-amber-50' :
                  'bg-emerald-50'
                }`}
              >
                {result.combinedRisk === 'high' ? (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                ) : result.combinedRisk === 'moderate' ? (
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                )}
              </motion.div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">Analysis Complete</h2>
              <p className="text-slate-500 mb-6">Your forensic report is ready.</p>

              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold mb-8 ${getVerdictColor(result.verdict)}`}>
                <Sparkles className="w-4 h-4" />
                {result.verdict}
              </div>

              {result.warnings && result.warnings.length > 0 && (
                 <div className="mb-6 bg-amber-50 rounded-xl p-4 border border-amber-200 text-left mx-auto max-w-md">
                    <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" /> Partial Results Displayed
                    </p>
                    <ul className="list-disc pl-5 text-amber-700 text-sm">
                       {result.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                 </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50/50 rounded-2xl p-4">
                  <p className="text-3xl font-black text-slate-900">{result.integrity_score?.toFixed(1)}%</p>
                  <p className="text-xs text-slate-400 mt-1">Style Integrity</p>
                </div>
                <div className="bg-purple-50/50 rounded-2xl p-4">
                  <p className="text-3xl font-black text-slate-900">{result.ai_score ?? 'N/A'}{result.ai_score !== undefined ? '%' : ''}</p>
                  <p className="text-xs text-slate-400 mt-1">AI Probability</p>
                </div>
              </div>

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
