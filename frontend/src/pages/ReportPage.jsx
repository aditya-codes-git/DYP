import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Download, Users, Shield, AlertTriangle,
  FileText, BookOpen, TrendingUp, Clock, ChevronRight,
  BarChart3, Layers, Eye, Loader2, Bot
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import { supabase } from '../lib/supabaseClient'

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
  if (score >= 0.8) return 'text-emerald-600 bg-emerald-50'
  if (score >= 0.6) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

function getIntegrityColor(score) {
  if (score > 80) return { ring: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' }
  if (score >= 50) return { ring: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' }
  return { ring: '#ef4444', bg: 'bg-red-50', text: 'text-red-600' }
}

function getVerdictStyle(verdict) {
  if (!verdict) return 'bg-slate-100 text-slate-600 border-slate-200'
  if (verdict.includes('🤖')) return 'bg-purple-50 text-purple-700 border-purple-200'
  if (verdict.includes('🚨')) return 'bg-red-50 text-red-700 border-red-200'
  if (verdict.includes('⚠️')) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-black ${color.text}`}>{score?.toFixed(1)}</span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
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

export default function ReportPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('document')
  const [error, setError] = useState(null)

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

  const result = analysis.result || {}
  const paragraphs = result.paragraphs || []
  const rawParagraphs = analysis.paragraphs || []
  const clusters = [...new Set(paragraphs.map(p => p.cluster))].sort()
  const flaggedCount = paragraphs.filter(p => p.flagged).length
  const majorityCluster = (() => {
    const counts = {}
    paragraphs.forEach(p => { counts[p.cluster] = (counts[p.cluster] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'A'
  })()

  // Chart data
  const chartData = paragraphs.map(p => ({
    id: p.id,
    consistency_score: p.consistency_score,
    cluster: p.cluster,
  }))

  // Shift points
  const shiftPoints = []
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i].cluster !== paragraphs[i - 1].cluster) {
      shiftPoints.push({
        id: paragraphs[i].id,
        from: paragraphs[i - 1].cluster,
        to: paragraphs[i].cluster,
        reason: paragraphs[i].reason,
      })
    }
  }

  // Generate "What This Means" bullets from real data
  const generateInsights = () => {
    const insights = []
    if (analysis.author_count === 1) {
      insights.push('The document shows a consistent writing style throughout, suggesting it was written by a single author.')
    } else {
      insights.push(`The analysis detected ${analysis.author_count} distinct writing styles, which may indicate sections were written by different individuals or sourced from different materials.`)
    }
    if (flaggedCount > 0) {
      insights.push(`${flaggedCount} out of ${paragraphs.length} paragraphs were flagged for inconsistency — these sections showed notable deviations in tone, vocabulary, or sentence structure.`)
    } else {
      insights.push('No paragraphs were flagged for inconsistency. The writing style remains uniform across all sections.')
    }
    if (analysis.integrity_score >= 80) {
      insights.push('The high integrity score indicates strong stylistic consistency. This document is unlikely to contain stitched or externally sourced content.')
    } else if (analysis.integrity_score >= 50) {
      insights.push('The moderate integrity score suggests some variation in writing style. This could indicate collaborative writing, heavy editing, or partially borrowed content.')
    } else {
      insights.push('The low integrity score raises significant concerns about content authenticity. Multiple writing styles suggest externally sourced or stitched content.')
    }
    return insights
  }

  const tabs = [
    { id: 'document', label: 'Document View', icon: Eye },
    { id: 'timeline', label: 'Style Shift Timeline', icon: TrendingUp },
    { id: 'summary', label: 'Summary & Verdict', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ textAlign: 'left' }}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 no-underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getVerdictStyle(analysis.verdict)}`}>
            {analysis.verdict}
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ═══════ SIDEBAR ═══════ */}
        <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-200 p-6 gap-6 fixed top-0 left-0 h-screen overflow-y-auto z-30">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline mb-2">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg shadow-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-bold text-slate-800 tracking-tight">
              Forens<span className="text-indigo-600">IQ</span>
            </span>
          </Link>

          <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">Forensic Report</div>

          {/* Back link */}
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 no-underline font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          {/* File info */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-800 truncate flex-1">{analysis.file_name}</p>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Integrity Score */}
          <div className="flex flex-col items-center py-4">
            <CircularProgress score={analysis.integrity_score} />
            <p className="text-xs text-slate-400 font-medium mt-3">Integrity Score</p>
          </div>

          {/* Verdict */}
          <div className={`px-4 py-2.5 rounded-full text-center text-xs font-bold border ${getVerdictStyle(analysis.verdict)}`}>
            {analysis.verdict}
          </div>

          {/* Author count */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{analysis.author_count}</p>
              <p className="text-xs text-slate-400">Estimated Authors</p>
            </div>
          </div>

          {/* Cluster Legend */}
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Cluster Legend</p>
            <div className="space-y-2.5">
              {clusters.map(c => {
                const cl = getCluster(c)
                const count = paragraphs.filter(p => p.cluster === c).length
                const profile = result.cluster_profiles?.[c]
                return (
                  <div key={c} className="flex items-start gap-3">
                    <div className={`w-3 h-3 mt-1.5 rounded-full flex-shrink-0 ${cl.dot}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">Style {c}</span>
                        <span className="text-xs text-slate-400 ml-auto">{count} ¶</span>
                      </div>
                      {profile && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{profile}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={() => {
              const reportData = JSON.stringify(analysis, null, 2)
              const blob = new Blob([reportData], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `forensiq-report-${analysis.file_name}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </aside>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="flex-1 lg:ml-[280px] p-4 sm:p-6 lg:p-8 pt-4 lg:pt-8">
          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-center gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-slate-200 w-fit">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ═══ TAB 1: DOCUMENT VIEW ═══ */}
            {activeTab === 'document' && (
              <motion.div
                key="document"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {paragraphs.map((p, idx) => {
                  const cl = getCluster(p.cluster)
                  const rawText = rawParagraphs[idx]?.text || rawParagraphs[idx] || ''

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`
                        rounded-2xl border-l-4 ${cl.border} p-5 sm:p-6 transition-all
                        ${p.flagged
                          ? 'bg-red-50/40 border border-red-200/60'
                          : 'bg-white border border-slate-100'
                        }
                      `}
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
                          {p.ai_likelihood && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.ai_likelihood === 'high' ? 'bg-rose-100 text-rose-700' :
                              p.ai_likelihood === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              AI: {p.ai_likelihood.toUpperCase()}
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getScoreColor(p.consistency_score)}`}>
                            {(p.consistency_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">
                        {rawText}
                      </p>

                      {p.flagged && p.reason && (
                        <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-relaxed">{p.reason}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                        <span>Tone: <span className="text-slate-600 font-medium">{p.tone}</span></span>
                        <span>Vocabulary: <span className="text-slate-600 font-medium">{p.vocabulary_richness}</span></span>
                        <span>Sentences: <span className="text-slate-600 font-medium">{p.sentence_length}</span></span>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* ═══ TAB 2: STYLE SHIFT TIMELINE ═══ */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Timeline Strip */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Paragraph Cluster Map</h3>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {paragraphs.map(p => {
                      const cl = getCluster(p.cluster)
                      return (
                        <div
                          key={p.id}
                          className={`flex-shrink-0 w-9 h-9 rounded-lg ${cl.dot} flex items-center justify-center transition-transform hover:scale-110`}
                          title={`¶${p.id} — Style ${p.cluster} (${(p.consistency_score * 100).toFixed(0)}%)`}
                        >
                          <span className="text-xs font-bold text-white">{p.id}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Line Chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Consistency Score Across Paragraphs</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="id"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          label={{ value: 'Paragraph', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: '#94a3b8' } }}
                        />
                        <YAxis
                          domain={[0, 1]}
                          ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                          y={0.6}
                          stroke="#ef4444"
                          strokeDasharray="6 4"
                          label={{ value: 'Inconsistency Threshold', position: 'right', style: { fontSize: 10, fill: '#ef4444' } }}
                        />
                        <Line
                          type="monotone"
                          dataKey="consistency_score"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          dot={(props) => {
                            const cl = getCluster(props.payload.cluster)
                            return (
                              <circle
                                key={props.key}
                                cx={props.cx}
                                cy={props.cy}
                                r={5}
                                fill={cl.hex}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            )
                          }}
                          activeDot={{ r: 7, stroke: '#6366f1', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Shift Points */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Style Shift Points</h3>
                  {shiftPoints.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No style shifts detected — consistent writing throughout.</p>
                  ) : (
                    <div className="space-y-3">
                      {shiftPoints.map((sp, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              ¶{sp.id} — Style shifted from{' '}
                              <span className={getCluster(sp.from).text}>{sp.from}</span>
                              {' → '}
                              <span className={getCluster(sp.to).text}>{sp.to}</span>
                            </p>
                            {sp.reason && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sp.reason}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══ TAB 3: SUMMARY & VERDICT ═══ */}
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Verdict Banner */}
                <div className={`rounded-2xl p-6 sm:p-8 border ${getVerdictStyle(analysis.verdict)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-xl sm:text-2xl font-black">Verdict</h2>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{analysis.verdict}</p>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Forensic Summary</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[15px]">
                    {analysis.summary}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: 'Integrity Score',
                      value: `${analysis.integrity_score?.toFixed(1)}%`,
                      icon: Shield,
                      color: 'indigo',
                    },
                    {
                      label: 'AI Probability',
                      value: `${result.ai_percentage !== undefined ? result.ai_percentage + '%' : 'N/A'}`,
                      icon: Bot,
                      color: 'rose',
                    },
                    {
                      label: 'Author Count',
                      value: analysis.author_count,
                      icon: Users,
                      color: 'violet',
                    },
                    {
                      label: 'Flagged Paragraphs',
                      value: flaggedCount,
                      icon: AlertTriangle,
                      color: 'amber',
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    const colorMap = {
                      indigo: 'bg-indigo-50 text-indigo-600',
                      violet: 'bg-violet-50 text-violet-600',
                      amber: 'bg-amber-50 text-amber-600',
                      emerald: 'bg-emerald-50 text-emerald-600',
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

                {/* What This Means */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">What This Means</h3>
                  <div className="space-y-3">
                    {generateInsights().map((insight, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-1" />
                        <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
