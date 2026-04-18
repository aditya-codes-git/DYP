/**
 * RiskScore
 * =========
 * Animated circular risk score meter (0-100).
 *
 * Props:
 *   score: number (0-100)
 *
 * Owner: Frontend Dev 2
 */

import React, { useEffect, useRef } from 'react'

export default function RiskScore({ score = 0 }) {
  const canvasRef = useRef(null)

  const getColor = (s) => {
    if (s >= 70) return '#ef4444'
    if (s >= 40) return '#f59e0b'
    return '#10b981'
  }

  const getLabel = (s) => {
    if (s >= 70) return 'High Risk'
    if (s >= 40) return 'Medium Risk'
    return 'Low Risk'
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 160
    canvas.width = size * 2
    canvas.height = size * 2
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(2, 2)

    const cx = size / 2, cy = size / 2, radius = 60, lineWidth = 10
    const startAngle = 0.75 * Math.PI
    const endAngle = 2.25 * Math.PI
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle)
    const color = getColor(score)

    // Background arc
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.strokeStyle = 'rgba(30,58,95,0.4)'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    // Score arc
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, scoreAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.shadowBlur = 0

    // Score text
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 28px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(Math.round(score), cx, cy + 5)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px Inter, sans-serif'
    ctx.fillText('/100', cx, cy + 22)
  }, [score])

  return (
    <div className="glass-card flex flex-col items-center justify-center col-span-1">
      <canvas ref={canvasRef} />
      <p className="text-sm font-semibold mt-2" style={{ color: getColor(score) }}>
        {getLabel(score)}
      </p>
      <p className="text-xs" style={{ color: 'var(--forensiq-text-muted)' }}>Overall Risk Score</p>
    </div>
  )
}
