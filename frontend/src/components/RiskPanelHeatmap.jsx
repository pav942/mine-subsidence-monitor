import { useEffect, useState } from 'react'
import { getSensors, getRisk } from '../api/client'
import { mergeNodesWithRisk } from '../utils/riskHelpers'
import { POLL_INTERVAL_MS } from '../config'

const ROWS = 4
const COLS = 5
const ROW_LABELS = Array.from({ length: ROWS }, (_, i) => `Panel ${String.fromCharCode(65 + i)}`)
const COL_LABELS = Array.from({ length: COLS }, (_, i) => `Zone ${i + 1}`)

// Extracts the trailing number from a node_id like "NODE_07" -> 7, for stable grid ordering.
function nodeSortKey(nodeId) {
  const match = nodeId.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 999
}

// Continuous green -> yellow -> red interpolation driven by risk score (0-100).
function riskColor(score) {
  const s = Math.max(0, Math.min(score, 100))
  const green = [27, 122, 67]   // #1B7A43
  const yellow = [217, 181, 74] // #D9B54A
  const red = [179, 55, 43]     // #B3372B

  let from, to, t
  if (s <= 50) {
    from = green
    to = yellow
    t = s / 50
  } else {
    from = yellow
    to = red
    t = (s - 50) / 50
  }

  const r = Math.round(from[0] + (to[0] - from[0]) * t)
  const g = Math.round(from[1] + (to[1] - from[1]) * t)
  const b = Math.round(from[2] + (to[2] - from[2]) * t)
  return `rgb(${r},${g},${b})`
}

function riskLabel(level) {
  if (level === 'CRITICAL') return 'CRITICAL'
  if (level === 'WARNING') return 'WARNING'
  if (level === 'SAFE') return 'NORMAL'
  return 'NO DATA'
}

function RiskPanelHeatmap() {
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [sensors, risk] = await Promise.all([getSensors(), getRisk()])
        const merged = mergeNodesWithRisk(sensors, risk)
        merged.sort((a, b) => nodeSortKey(a.node_id) - nodeSortKey(b.node_id))
        setNodes(merged)
      } catch (err) {
        // leave grid empty on failure
      }
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const cells = Array.from({ length: ROWS * COLS }, (_, i) => nodes[i] || null)

  return (
    <div className="bg-panel border border-border rounded-sm p-5">
      <div className="text-lg font-semibold text-white mb-4">
        Live Deformation Risk — Panel Heatmap
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `70px repeat(${COLS}, 1fr)` }}
          >
            <div />
            {COL_LABELS.map((label) => (
              <div key={label} className="text-center text-xs text-muted font-mono pb-1">
                {label}
              </div>
            ))}

            {ROW_LABELS.map((rowLabel, rowIdx) => (
              <>
                <div key={`row-${rowLabel}`} className="flex items-center text-sm text-white font-semibold pr-2">
                  {rowLabel}
                </div>
                {COL_LABELS.map((_, colIdx) => {
                  const cellIndex = rowIdx * COLS + colIdx
                  const node = cells[cellIndex]
                  const hasData = node && node.status_online !== false && node.status !== 'UNKNOWN'
                  const score = hasData ? node.risk_score : 0
                  const bg = hasData ? riskColor(score) : '#2A1A54'
                  const textColor = hasData && score > 45 ? '#FFFFFF' : hasData ? '#12241B' : '#8B7FC7'

                  return (
                    <div
                      key={`${rowLabel}-${colIdx}`}
                      className="flex flex-col items-center justify-center rounded-sm"
                      style={{ backgroundColor: bg, minHeight: '64px', padding: '8px' }}
                    >
                      <div
                        className="text-xs font-bold font-mono"
                        style={{ color: textColor }}
                      >
                        {hasData ? riskLabel(node.status) : 'NO DATA'}
                      </div>
                      {hasData && (
                        <div className="text-sm font-bold font-mono mt-0.5" style={{ color: textColor }}>
                          {Math.round(score)}%
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between py-2 w-16">
          <span className="text-xs text-muted font-mono">Critical</span>
          <div
            className="flex-1 w-3 rounded-full my-2"
            style={{
              background: 'linear-gradient(to top, #1B7A43, #D9B54A, #B3372B)',
            }}
          />
          <span className="text-xs text-muted font-mono">Normal</span>
        </div>
      </div>
    </div>
  )
}

export default RiskPanelHeatmap