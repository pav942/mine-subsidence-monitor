import { useEffect, useState, useRef } from 'react'
import { getAlerts } from '../api/client'
import { POLL_INTERVAL_MS } from '../config'

const CRIT = '#FF4F7B'
const WARN = '#FFB84D'
const VIOLET = '#B14CFF'
const MAGENTA = '#FF4FD8'
const CYAN = '#3ED6F0'
const BLUE = '#4F8CFF'
const GOLD = '#FFD84F'

const severityStyle = {
  CRITICAL: { color: CRIT, background: 'rgba(255,79,123,.12)', border: '1px solid rgba(255,79,123,.4)' },
  HIGH: { color: CRIT, background: 'rgba(255,79,123,.12)', border: '1px solid rgba(255,79,123,.4)' },
  MEDIUM: { color: WARN, background: 'rgba(255,184,77,.12)', border: '1px solid rgba(255,184,77,.4)' },
  WARNING: { color: WARN, background: 'rgba(255,184,77,.12)', border: '1px solid rgba(255,184,77,.4)' },
  LOW: { color: '#3FE0A8', background: 'rgba(63,224,168,.12)', border: '1px solid rgba(63,224,168,.4)' },
}

// Dot colour + class for the Type cell, based on what kind of alert it is.
function typeDotColor(alertType = '') {
  const t = alertType.toLowerCase()
  if (t.includes('crack')) return MAGENTA
  if (t.includes('critical')) return VIOLET
  return BLUE
}

function formatIST(timestamp) {
  return new Date(timestamp + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

// Highlights any "number%" in the message (e.g. "92.8%") in gold + bold,
// same look as the design mockup.
function renderMessage(message = '') {
  const parts = message.split(/(\d+(?:\.\d+)?%)/g)
  return parts.map((part, i) =>
    /^\d+(?:\.\d+)?%$/.test(part) ? (
      <b key={i} style={{ color: GOLD, fontWeight: 700 }}>{part}</b>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const seenAlertIds = useRef(new Set())
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await getAlerts()

      if (!isFirstLoad.current) {
        const newCritical = data.filter(
          (a) => a.severity === 'CRITICAL' && !seenAlertIds.current.has(a.id)
        )
        if (newCritical.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
          newCritical.forEach((a) => {
            new Notification('CRITICAL Subsidence Alert', {
              body: `${a.node_id}: ${a.message}`,
            })
          })
        }
      }

      data.forEach((a) => seenAlertIds.current.add(a.id))
      isFirstLoad.current = false
      setAlerts(data)
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            background: `linear-gradient(90deg, #F1EEFB, ${CYAN})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Alerts
        </h1>
      </div>

      <div
        className="bg-panel border border-border rounded-md overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(177,76,255,.06), 0 20px 60px -30px rgba(177,76,255,.35)' }}
      >
        {alerts.length === 0 ? (
          <div className="p-4 text-sm text-muted font-mono">
            No alerts yet — nodes currently within safe thresholds.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Time</th>
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Node</th>
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Type</th>
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Message</th>
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Severity</th>
                <th className="px-5 py-4 font-bold text-white text-xs tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-border last:border-0 hover:bg-panel-hi">
                  <td className="px-5 py-4 text-muted whitespace-nowrap">{formatIST(alert.timestamp)}</td>
                  <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: CYAN }}>
                    {alert.node_id}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        marginRight: 8,
                        background: typeDotColor(alert.alert_type),
                        boxShadow: `0 0 8px ${typeDotColor(alert.alert_type)}`,
                      }}
                    />
                    {alert.alert_type}
                  </td>
                  <td className="px-5 py-4 max-w-md" title={alert.message}>
                    {renderMessage(alert.message)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="font-bold text-xs px-3 py-1 rounded"
                      style={severityStyle[alert.severity] || { color: '#8B7FC7' }}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2" style={{ color: CYAN }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: CYAN,
                          boxShadow: `0 0 8px ${CYAN}`,
                        }}
                      />
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Alerts