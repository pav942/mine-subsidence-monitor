import { useEffect, useState } from 'react'
import { getCorrelation } from '../api/client'
import { POLL_INTERVAL_MS } from '../config'

const METRIC_LABELS = {
  tilt: 'Tilt',
  vibration: 'Vibration',
  displacement: 'Displacement',
  risk_score: 'Risk Score',
}

function cellColor(value) {
  const abs = Math.abs(value)
  const intensity = 0.15 + abs * 0.65
  return value >= 0 ? `rgba(62,214,240,${intensity})` : `rgba(255,184,77,${intensity})`
}

function CorrelationHeatmap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getCorrelation()
        setData(result)
        setError(null)
      } catch (err) {
        setError('Not enough data yet to compute correlations.')
      }
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="bg-panel border border-border rounded-sm p-4 text-sm text-muted font-mono">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-panel border border-border rounded-sm p-4 text-sm text-muted font-mono">
        Loading correlation data...
      </div>
    )
  }

  const metrics = data.metrics

  return (
    <div className="bg-panel border border-border rounded-sm p-4">
      <div className="text-sm font-medium mb-1">Metric Correlation Heatmap</div>
      <p className="text-xs text-muted font-mono mb-3">
        Pearson correlation across all readings — closer to 1 or -1 means stronger relationship
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {metrics.map((m) => (
                <th key={m} className="p-2 text-xs text-muted font-mono">{METRIC_LABELS[m]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((rowMetric) => (
              <tr key={rowMetric}>
                <td className="p-2 text-xs text-muted font-mono whitespace-nowrap">{METRIC_LABELS[rowMetric]}</td>
                {metrics.map((colMetric) => {
                  const value = data.matrix[rowMetric][colMetric]
                  return (
                    <td key={colMetric} className="p-1">
                      <div
                        className="w-16 h-12 flex items-center justify-center rounded-sm text-xs font-mono text-text"
                        style={{ backgroundColor: cellColor(value) }}
                      >
                        {value.toFixed(2)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CorrelationHeatmap