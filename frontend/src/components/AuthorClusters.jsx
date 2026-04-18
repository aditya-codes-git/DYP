/**
 * AuthorClusters
 * ==============
 * Visualizes writing style clusters with avg stats per cluster.
 *
 * Props:
 *   clusters: Array<{ cluster_id, paragraph_count, avg_style }>
 *   paragraphs: Array<ParagraphResult>
 *
 * Owner: Frontend Dev 2
 */

import React from 'react'

const CLUSTER_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#a855f7', '#10b981']
const CLUSTER_NAMES = ['Style A', 'Style B', 'Style C', 'Style D', 'Style E']

export default function AuthorClusters({ clusters = [], paragraphs = [] }) {
  if (!clusters.length) {
    return <div className="glass-card text-center" style={{ color: 'var(--forensiq-text-muted)' }}>No cluster data.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clusters.map((cluster) => {
        const color = CLUSTER_COLORS[cluster.cluster_id % CLUSTER_COLORS.length]
        const name = CLUSTER_NAMES[cluster.cluster_id % CLUSTER_NAMES.length]
        const stats = cluster.avg_style

        return (
          <div key={cluster.cluster_id} className="glass-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: `${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color,
              }}>
                {String.fromCharCode(65 + cluster.cluster_id)}
              </div>
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs" style={{ color: 'var(--forensiq-text-muted)' }}>
                  {cluster.paragraph_count} paragraphs
                </p>
              </div>
            </div>

            {/* Style Metrics */}
            <div className="flex flex-col gap-2">
              {[
                { label: 'Avg Sentence Length', value: stats.avg_sentence_length, max: 40 },
                { label: 'Vocabulary Richness', value: stats.type_token_ratio, max: 1 },
                { label: 'Avg Word Length', value: stats.avg_word_length, max: 10 },
                { label: 'Punctuation Density', value: stats.punctuation_density, max: 0.5 },
                { label: 'Passive Voice', value: stats.passive_voice_ratio, max: 1 },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--forensiq-text-muted)' }}>{m.label}</span>
                    <span className="font-mono">{typeof m.value === 'number' ? m.value.toFixed(2) : '—'}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--forensiq-surface-2)' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, background: color,
                      width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
