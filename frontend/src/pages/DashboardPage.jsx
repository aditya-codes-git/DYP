import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Users, AlertTriangle, ArrowRight, Upload,
  BarChart3, Shield, Clock, TrendingUp, Loader2, Search
} from 'lucide-react'
import { Header } from '../components/ui/header-2'
import { supabase } from '../lib/supabaseClient'

function getVerdictStyle(verdict) {
  if (!verdict) return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
  if (verdict.includes('🚨')) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
  if (verdict.includes('⚠️')) return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
  return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' }
}

function getScoreBarColor(score) {
  if (score > 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded-full w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full w-full mb-3" />
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 bg-slate-100 rounded-full w-24" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-100 rounded-full w-20" />
        <div className="h-8 bg-slate-100 rounded-full w-28" />
      </div>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalyses() {
      const { data, error } = await supabase
        .from('analyses')
        .select('id, created_at, file_name, integrity_score, author_count, verdict, result')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setAnalyses(data)
      }
      setLoading(false)
    }
    fetchAnalyses()
  }, [])

  const totalDocuments = analyses.length
  const avgScore = totalDocuments > 0
    ? (analyses.reduce((sum, a) => sum + (a.integrity_score || 0), 0) / totalDocuments).toFixed(1)
    : '—'
  const flaggedDocs = analyses.filter(a =>
    a.verdict?.includes('⚠️') || a.verdict?.includes('🚨')
  ).length

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-stretch"
      style={{ textAlign: 'left' }}
    >
      <Header />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                  Your Analyses
                </h1>
                <p className="text-slate-500 text-base">
                  Track and review all of your forensic integrity reports.
                </p>
              </div>
              <Link
                to="/upload"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-bold no-underline shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {[
              {
                label: 'Total Documents',
                value: loading ? '—' : totalDocuments,
                icon: FileText,
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                label: 'Average Integrity',
                value: loading ? '—' : `${avgScore}%`,
                icon: Shield,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Documents Flagged',
                value: loading ? '—' : flaggedDocs,
                icon: AlertTriangle,
                color: 'bg-amber-50 text-amber-600',
              },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
                >
                  <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : analyses.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No analyses yet</h2>
              <p className="text-slate-400 mb-8 max-w-sm">
                Upload your first research paper and let ForensIQ's AI engine detect writing inconsistencies.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-indigo-600 text-white text-base font-bold no-underline shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
              >
                <Upload className="w-5 h-5" />
                Upload Your First Document
              </Link>
            </motion.div>
          ) : (
            /* Analysis Cards Grid */
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              initial="hidden"
              animate="visible"
            >
              {analyses.map((a, i) => {
                const verdictStyle = getVerdictStyle(a.verdict)
                const flaggedCount = a.result?.paragraphs?.filter(p => p.flagged)?.length || 0

                return (
                  <motion.div
                    key={a.id}
                    variants={fadeUp}
                    custom={i}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                  >
                    {/* File info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.file_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Integrity Score Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">Integrity</span>
                        <span className="text-xs font-bold text-slate-700">{a.integrity_score?.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getScoreBarColor(a.integrity_score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${a.integrity_score}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                        />
                      </div>
                    </div>

                    {/* Verdict Badge */}
                    <div className={`inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}>
                      {a.verdict}
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {a.author_count} author{a.author_count !== 1 ? 's' : ''}
                      </span>
                      {flaggedCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {flaggedCount} flagged
                        </span>
                      )}
                    </div>

                    {/* View Report Button */}
                    <Link
                      to={`/report/${a.id}`}
                      className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-sm font-semibold no-underline hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100"
                    >
                      View Report
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
