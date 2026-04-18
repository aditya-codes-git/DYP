/**
 * AnalysisPage
 * ============
 * Shows progress while the forensic pipeline runs.
 * Receives fileId from UploadPage via router state.
 *
 * Owner: Frontend Dev 1
 */

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { analyzeFile } from '../services/api.js'

const STEPS = [
  { label: 'Parsing PDF', icon: '📄' },
  { label: 'Extracting stylometric features', icon: '🧬' },
  { label: 'Clustering writing styles', icon: '📊' },
  { label: 'Analyzing citations', icon: '📚' },
  { label: 'Tracing sources', icon: '🔍' },
  { label: 'Building report', icon: '📝' },
]

export default function AnalysisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { fileId, filename } = location.state || {}

  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!fileId) {
      navigate('/')
      return
    }

    // Simulate step progression while waiting for actual analysis
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 2000)

    // Start actual analysis
    analyzeFile(fileId)
      .then((result) => {
        clearInterval(interval)
        setCurrentStep(STEPS.length)
        setTimeout(() => {
          navigate(`/report/${fileId}`, { state: { report: result.report } })
        }, 800)
      })
      .catch((err) => {
        clearInterval(interval)
        setError(err.response?.data?.detail || 'Analysis failed.')
      })

    return () => clearInterval(interval)
  }, [fileId, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full animate-fade-in-up">
        <div className="glass-card" style={{ padding: 40 }}>
          <h2 className="text-2xl font-bold mb-2 text-center">Analyzing Paper</h2>
          <p className="text-sm text-center mb-8" style={{ color: 'var(--forensiq-text-muted)' }}>
            {filename || 'document.pdf'}
          </p>

          {/* Step List */}
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => {
              const isActive = i === currentStep
              const isDone = i < currentStep || currentStep >= STEPS.length
              return (
                <div key={i} className="flex items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(99,102,241,0.15)' : 'rgba(30,58,95,0.3)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.4)' : isActive ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                    transition: 'all 0.4s ease',
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span className="text-sm font-medium" style={{
                    color: isDone ? 'var(--forensiq-success)' : isActive ? '#fff' : 'var(--forensiq-text-muted)',
                    transition: 'color 0.3s ease',
                  }}>
                    {step.label}
                    {isActive && <span className="ml-2 inline-block" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-8 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--forensiq-surface-2)' }}>
            <div style={{
              height: '100%', borderRadius: 9999, transition: 'width 0.6s ease',
              width: `${Math.min(((currentStep + 1) / STEPS.length) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
            }} />
          </div>

          {error && (
            <div className="mt-6 px-4 py-3 rounded-xl text-sm" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--forensiq-danger)',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
