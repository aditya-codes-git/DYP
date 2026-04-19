import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Download, Users, Shield, AlertTriangle,
  FileText, BookOpen, TrendingUp, Clock, ChevronRight,
  BarChart3, Layers, Eye, Loader2, Bot, Globe,
  Brain, ExternalLink, Search, CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import { supabase } from '../lib/supabaseClient'

// ═══ CONSTANTS ═══
const CLUSTER_COLORS = {
  A: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700', hex: '#6366f1', dot: 'bg-indigo-500' },
  B: { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700', hex: '#f43f5e', dot: 'bg-rose-500' },
  C: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700', hex: '#f59e0b', dot: 'bg-amber-500' },
  D: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', hex: '#10b981', dot: 'bg-emerald-500' },
  E: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', hex: '#a855f7', dot: 'bg-purple-500' },
  F: { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700', hex: '#06b6d4', dot: 'bg-cyan-500' },
}

function getCluster(letter) {
  return CLUSTER_COLORS[letter] || CLUSTER_COLORS.A
}

function getScoreColor(score) {
  if (score >= 0.75) return 'text-emerald-600 bg-emerald-50'
  if (score >= 0.6) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

function getAiScoreColor(score) {
  if (score <= 25) return { text: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Human' }
  if (score <= 45) return { text: 'text-emerald-600', bg: 'bg-emerald-400', label: 'Likely Human' }
  if (score <= 65) return { text: 'text-amber-600', bg: 'bg-amber-500', label: 'Ambiguous' }
  if (score <= 85) return { text: 'text-orange-600', bg: 'bg-orange-500', label: 'Likely AI' }
  return { text: 'text-red-600', bg: 'bg-red-500', label: 'AI Generated' }
}

function getIntegrityColor(score) {
  if (score > 80) return { ring: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' }
  if (score >= 50) return { ring: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' }
  return { ring: '#ef4444', bg: 'bg-red-50', text: 'text-red-600' }
}

function getRiskBannerStyle(risk) {
  if (risk === 'high') return 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
  if (risk === 'moderate') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
  return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
}

function CircularProgress({ score, size = 140, strokeWidth = 10 }) {
  const color = getIntegrityColor(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color.ring} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900">{score?.toFixed(1)}</span>
        <span className="text-xs text-slate-400 font-bold">/ 100</span>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 text-left">
      <p className="text-xs font-bold text-slate-800 mb-1">Paragraph {data.id}</p>
      <p className="text-xs text-slate-500">Score: <span className="font-semibold">{data.consistency_score?.toFixed(2)}</span></p>
      <p className="text-xs text-slate-500">Cluster: <span className="font-semibold">Style {data.cluster}</span></p>
    </div>
  )
}

// ═══ MAIN COMPONENT ═══
export default function ReportPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stylometry')
  const [error, setError] = useState(null)
  const [expandedParagraphs, setExpandedParagraphs] = useState(new Set())

  useEffect(() => {
    async function fetchAnalysis() {
      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setAnalysis(data)
      }
      setLoading(false)
    }
    if (id) fetchAnalysis()
  }, [id])

  const toggleExpanded = (pid) => {
    setExpandedParagraphs(prev => {
      const next = new Set(prev)
      next.has(pid) ? next.delete(pid) : next.add(pid)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 px-4">
        <div className="text-center bg-white rounded-3xl p-12 border border-slate-200 shadow-sm max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Report Not Found</h2>
          <p className="text-slate-500 mb-6">{error || 'The analysis could not be found.'}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-bold no-underline hover:bg-indigo-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ═══ DATA EXTRACTION (backward compatible) ═══
  const rawResult = analysis.result || {}
  const isNewFormat = !!rawResult.stylometry
  
  // Stylometry data
  const stylometry = isNewFormat ? rawResult.stylometry : rawResult
  const paragraphs = stylometry?.paragraphs || []
  const rawParagraphs = analysis.paragraphs || []
  const clusters = [...new Set(paragraphs.map(p => p.cluster))].sort()
  const flaggedCount = paragraphs.filter(p => p.flagged).length

  // AI Detection data
  const aiDetection = isNewFormat ? rawResult.aiDetection : null

  // Source Tracing data
  const sourceTracing = isNewFormat ? rawResult.sourceTracing : null

  // Combined verdict
  const combinedVerdict = rawResult.combinedVerdict || analysis.verdict
  const combinedRisk = rawResult.combinedRisk || (analysis.integrity_score >= 80 ? 'low' : analysis.integrity_score >= 50 ? 'moderate' : 'high')

  // Chart data
  const chartData = paragraphs.map(p => ({
    id: p.id,
    consistency_score: p.consistency_score,
    cluster: p.cluster,
  }))

  // Style shift points
  const shiftPoints = []
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i].cluster !== paragraphs[i - 1].cluster) {
      shiftPoints.push({
        id: paragraphs[i].id,
        from: paragraphs[i - 1].cluster,
        to: paragraphs[i].cluster,
        reason: paragraphs[i].flag_reason || paragraphs[i].reason,
      })
    }
  }

  const tabs = [
    { id: 'stylometry', label: 'Stylometry', icon: Brain, color: 'indigo' },
    { id: 'aidetection', label: 'AI Detection', icon: Bot, color: 'purple' },
    { id: 'sources', label: 'Source Tracing', icon: Globe, color: 'orange' },
    { id: 'summary', label: 'Summary', icon: BookOpen, color: 'slate' },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ textAlign: 'left' }}>
      {/* ═══ COMBINED VERDICT BANNER ═══ */}
      <div className={`${getRiskBannerStyle(combinedRisk)} px-4 py-4 sm:py-5`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {combinedRisk === 'high' ? <AlertCircle className="w-6 h-6" /> :
             combinedRisk === 'moderate' ? <AlertTriangle className="w-6 h-6" /> :
             <CheckCircle2 className="w-6 h-6" />}
            <div>
              <p className="text-sm font-bold opacity-80">Combined Forensic Verdict</p>
              <p className="text-base sm:text-lg font-black">{combinedVerdict}</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm font-semibold opacity-80 hover:opacity-100 no-underline text-white/90 hover:text-white transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>

      {/* ═══ FILE INFO BAR ═══ */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">{analysis.file_name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="mx-1">•</span>
                {paragraphs.length} paragraphs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="bg-white border-b border-slate-200 px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const colorMap = {
              indigo: isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : '',
              purple: isActive ? 'bg-purple-50 text-purple-600 border-purple-200' : '',
              orange: isActive ? 'bg-orange-50 text-orange-600 border-orange-200' : '',
              slate: isActive ? 'bg-slate-100 text-slate-700 border-slate-200' : '',
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive ? colorMap[tab.color] : 'text-slate-400 hover:text-slate-600 border-transparent hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'aidetection' && aiDetection && aiDetection.overall_ai_score != null && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    aiDetection.overall_ai_score > 65 ? 'bg-red-100 text-red-600' :
                    aiDetection.overall_ai_score > 45 ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {aiDetection.overall_ai_score}%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ═══════ TAB 1: STYLOMETRY (Blue) ═══════ */}
          {activeTab === 'stylometry' && (
            <motion.div
              key="stylometry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center">
                  <CircularProgress score={stylometry?.integrity_score || 0} size={120} />
                  <p className="text-xs text-slate-400 font-bold mt-3">Style Integrity Score</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black text-slate-900">{stylometry?.cluster_count || clusters.length}</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">Style Clusters</p>
                  <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    stylometry?.verdict?.includes('🚨') ? 'bg-red-50 text-red-600 border-red-200' :
                    stylometry?.verdict?.includes('⚠️') ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>{stylometry?.verdict || 'N/A'}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="text-xs text-slate-400 font-bold mb-3">Cluster Legend</p>
                  <div className="space-y-3">
                    {clusters.map(c => {
                      const cl = getCluster(c)
                      const count = paragraphs.filter(p => p.cluster === c).length
                      const profile = stylometry?.cluster_profiles?.[c]
                      return (
                        <div key={c} className="flex items-start gap-2">
                          <div className={`w-3 h-3 mt-1 rounded-full flex-shrink-0 ${cl.dot}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">Style {c}</span>
                              <span className="text-[10px] text-slate-400">{count} ¶</span>
                            </div>
                            {profile && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{profile}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Style Timeline Chart */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Style Consistency Timeline
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="id" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Threshold', fill: '#ef4444', fontSize: 10 }} />
                      <Line type="monotone" dataKey="consistency_score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Paragraph Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  Paragraph Analysis ({paragraphs.length})
                </h3>
                {paragraphs.map(p => {
                  const cl = getCluster(p.cluster)
                  const rawText = rawParagraphs.find(rp => rp.id === p.id)?.text || `Paragraph ${p.id}`
                  const scoreColorClass = p.consistency_score >= 0.75 ? 'border-l-emerald-400' :
                                          p.consistency_score >= 0.6 ? 'border-l-amber-400' :
                                          'border-l-red-400'
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${scoreColorClass} p-5`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">¶{p.id}</span>
                          {p.flagged && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cl.bg} ${cl.text}`}>
                            Style {p.cluster}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(p.consistency_score)}`}>
                            {(p.consistency_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-3">
                        {rawText}
                      </p>

                      {p.flagged && (p.flag_reason || p.reason) && (
                        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-relaxed">{p.flag_reason || p.reason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex-wrap">
                        <span>Tone: <span className="text-slate-600 font-medium">{p.tone}</span></span>
                        <span>Vocab: <span className="text-slate-600 font-medium">{p.vocabulary_richness}</span></span>
                        <span>Sentences: <span className="text-slate-600 font-medium">{p.sentence_length}</span></span>
                        {p.passive_voice_ratio && <span>Passive: <span className="text-slate-600 font-medium">{p.passive_voice_ratio}</span></span>}
                        {p.hedging_frequency && <span>Hedging: <span className="text-slate-600 font-medium">{p.hedging_frequency}</span></span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════ TAB 2: AI DETECTION (Purple) ═══════ */}
          {activeTab === 'aidetection' && (
            <motion.div
              key="aidetection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {!aiDetection ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Bot className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">AI Detection Unavailable</h3>
                  <p className="text-sm text-slate-400">This pipeline failed or wasn't available for this analysis. Try re-analyzing the document.</p>
                </div>
              ) : (
                <>
                  {/* Header Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center">
                      <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                        <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="16" fill="none"
                            stroke={aiDetection.overall_ai_score > 65 ? '#ef4444' : aiDetection.overall_ai_score > 45 ? '#f59e0b' : '#10b981'}
                            strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${aiDetection.overall_ai_score} ${100 - aiDetection.overall_ai_score}`}
                            initial={{ strokeDasharray: '0 100' }}
                            animate={{ strokeDasharray: `${aiDetection.overall_ai_score} ${100 - aiDetection.overall_ai_score}` }}
                            transition={{ duration: 1.2 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900">{aiDetection.overall_ai_score}</span>
                          <span className="text-[10px] text-slate-400 font-bold">AI Score</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        aiDetection.verdict?.includes('🚨') ? 'bg-red-50 text-red-600 border-red-200' :
                        aiDetection.verdict?.includes('🤖') ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        aiDetection.verdict?.includes('⚠️') ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>{aiDetection.verdict}</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-slate-900">{aiDetection.ai_percentage || 0}%</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">Paragraphs Likely AI</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                      {aiDetection.dominant_ai_tool && aiDetection.dominant_ai_tool !== 'None' ? (
                        <>
                          <Bot className="w-10 h-10 text-purple-500 mb-2" />
                          <p className="text-lg font-black text-slate-900">{aiDetection.dominant_ai_tool}</p>
                          <p className="text-xs text-slate-400 font-bold mt-1">Likely AI Tool</p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                          <p className="text-lg font-black text-slate-900">No AI Tool</p>
                          <p className="text-xs text-slate-400 font-bold mt-1">Detected</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {aiDetection.summary && (
                    <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-6">
                      <p className="text-sm text-purple-800 leading-relaxed">{aiDetection.summary}</p>
                    </div>
                  )}

                  {/* Per-paragraph AI Scores */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-500" />
                      Per-Paragraph AI Analysis ({aiDetection.paragraphs?.length || 0})
                    </h3>
                    {aiDetection.paragraphs?.map(p => {
                      const scoreInfo = getAiScoreColor(p.ai_score)
                      const isExpanded = expandedParagraphs.has(`ai-${p.id}`)
                      const isSuspicious = aiDetection.most_suspicious_paragraphs?.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          className={`bg-white rounded-2xl border p-5 ${isSuspicious ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">¶{p.id}</span>
                              {isSuspicious && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600">Suspicious</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.ai_score > 65 ? 'bg-red-100 text-red-700' :
                                p.ai_score > 45 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>{p.verdict} ({p.ai_score}%)</span>
                              {p.confidence && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{p.confidence}</span>
                              )}
                            </div>
                          </div>

                          {/* AI score bar */}
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                            <motion.div
                              className={`h-full rounded-full ${scoreInfo.bg}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${p.ai_score}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>

                          {/* Signals */}
                          {p.signals_detected?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {p.signals_detected.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {p.human_signals_detected?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {p.human_signals_detected.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Expandable reasoning */}
                          <button
                            onClick={() => toggleExpanded(`ai-${p.id}`)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-2"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Hide' : 'Show'} reasoning
                          </button>
                          {isExpanded && p.reasoning && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-xs text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl leading-relaxed"
                            >
                              {p.reasoning}
                            </motion.p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ═══════ TAB 3: SOURCE TRACING (Orange) ═══════ */}
          {activeTab === 'sources' && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {!sourceTracing ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Source Tracing Unavailable</h3>
                  <p className="text-sm text-slate-400">This pipeline failed or wasn't available for this analysis. Try re-analyzing the document.</p>
                </div>
              ) : (
                <>
                  {/* Stitching Banner */}
                  {sourceTracing.stitching_analysis && (
                    <div className={`rounded-2xl p-6 border ${
                      sourceTracing.stitching_analysis.stitching_detected
                        ? 'bg-red-50 border-red-200'
                        : sourceTracing.stitching_analysis.verdict?.includes('⚠️')
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-6 h-6" />
                        <h3 className="text-lg font-black">{sourceTracing.stitching_analysis.verdict}</h3>
                      </div>
                      <p className="text-sm leading-relaxed opacity-80">{sourceTracing.stitching_analysis.summary}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs font-bold opacity-60">
                          Confidence: {sourceTracing.stitching_analysis.confidence} • 
                          Traced to {sourceTracing.stitching_analysis.distinct_source_count || 0} potential sources
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Traced Paragraphs */}
                  {sourceTracing.paragraph_traces?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Search className="w-4 h-4 text-orange-500" />
                        Source Matches ({sourceTracing.paragraph_traces.length} paragraphs traced)
                      </h3>
                      {sourceTracing.paragraph_traces.map((trace, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                          {/* Paragraph preview */}
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-orange-500 mt-1">¶{trace.paragraph_id}</span>
                            <p className="text-xs text-slate-500 leading-relaxed italic">{trace.paragraph_preview}</p>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Search query: <span className="text-slate-600">"{trace.search_query_used}"</span>
                          </div>

                          {/* Semantic Scholar Matches */}
                          {trace.semantic_scholar_matches?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-indigo-600 mb-2">Semantic Scholar Matches</p>
                              <div className="space-y-2">
                                {trace.semantic_scholar_matches.map((paper, j) => (
                                  <div key={j} className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3">
                                    <a href={paper.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1">
                                      {paper.title}
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                    <p className="text-[10px] text-slate-500 mt-1">{paper.authors}</p>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                      {paper.year && <span>{paper.year}</span>}
                                      {paper.venue && paper.venue !== 'N/A' && <span>{paper.venue}</span>}
                                      <span>{paper.citation_count} citations</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* arXiv Matches */}
                          {trace.arxiv_matches?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-orange-600 mb-2">arXiv Matches</p>
                              <div className="space-y-2">
                                {trace.arxiv_matches.map((paper, j) => (
                                  <div key={j} className="bg-orange-50/50 rounded-xl border border-orange-100 p-3">
                                    <a href={paper.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-orange-700 hover:underline flex items-center gap-1">
                                      {paper.title}
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                    {paper.authors && <p className="text-[10px] text-slate-500 mt-1">{paper.authors}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {trace.semantic_scholar_matches?.length === 0 && trace.arxiv_matches?.length === 0 && (
                            <p className="text-xs text-slate-400 italic">No matching sources found for this paragraph.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-700">No suspicious paragraphs found for source tracing ✅</p>
                      <p className="text-xs text-slate-400 mt-1">No paragraphs were flagged, so source tracing was not required.</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ═══════ TAB 4: SUMMARY & VERDICT ═══════ */}
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Text */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Forensic Summary</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-[15px] mb-4">
                  {stylometry?.summary || analysis.summary || 'No forensic summary available.'}
                </p>
                {aiDetection?.summary && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-purple-600 mb-2">AI Detection Summary</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{aiDetection.summary}</p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Style Integrity',
                    value: `${(stylometry?.integrity_score || analysis.integrity_score)?.toFixed(1)}%`,
                    icon: Shield,
                    color: 'indigo',
                  },
                  {
                    label: 'AI Score',
                    value: aiDetection?.overall_ai_score != null ? `${aiDetection.overall_ai_score}%` : 'N/A',
                    icon: Bot,
                    color: 'purple',
                  },
                  {
                    label: 'Style Clusters',
                    value: stylometry?.cluster_count || clusters.length,
                    icon: Layers,
                    color: 'violet',
                  },
                  {
                    label: 'Flagged ¶',
                    value: flaggedCount,
                    icon: AlertTriangle,
                    color: 'amber',
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  const colorMap = {
                    indigo: 'bg-indigo-50 text-indigo-600',
                    purple: 'bg-purple-50 text-purple-600',
                    violet: 'bg-violet-50 text-violet-600',
                    amber: 'bg-amber-50 text-amber-600',
                  }
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col"
                    >
                      <div className={`w-9 h-9 rounded-xl ${colorMap[stat.color]} flex items-center justify-center mb-3`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 mb-1">{stat.value}</p>
                      <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pipeline Results Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Pipeline Results</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Stylometric Analysis', status: stylometry ? 'complete' : 'unavailable', verdict: stylometry?.verdict, color: 'indigo' },
                    { label: 'AI Content Detection', status: aiDetection ? 'complete' : 'unavailable', verdict: aiDetection?.verdict, color: 'purple' },
                    { label: 'Source Tracing', status: sourceTracing ? 'complete' : 'unavailable', verdict: sourceTracing?.stitching_analysis?.verdict, color: 'orange' },
                  ].map((p, i) => (
                    <div key={p.label || i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        {p.status === 'complete' ? (
                          <CheckCircle2 className={`w-4 h-4 text-${p.color}-500`} />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-700">{p.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${p.status === 'complete' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {p.verdict || 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
