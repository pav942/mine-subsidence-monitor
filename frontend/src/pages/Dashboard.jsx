import { useEffect, useState } from 'react'
import { getSensors, getRisk, getAlerts } from '../api/client'
import { mergeNodesWithRisk } from '../utils/riskHelpers'
import { POLL_INTERVAL_MS } from '../config'
import { Boxes, Wifi, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react'

function nodeSortKey(nodeId) {
  const match = nodeId.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 999
}

const tileColors = {
  data: { fg: '#3ED6F0', bg: 'rgba(62,214,240,0.14)' },
  safe: { fg: '#3FE0A8', bg: 'rgba(63,224,168,0.14)' },
  warning: { fg: '#FFB84D', bg: 'rgba(255,184,77,0.14)' },
  critical: { fg: '#FF4F7B', bg: 'rgba(255,79,123,0.14)' },
}

const statusDot = {
  SAFE: '#3FE0A8',
  WARNING: '#FFB84D',
  CRITICAL: '#FF4F7B',
  UNKNOWN: '#8B7FC7',
}

const borderPalette = ['#3FE0A8', '#3ED6F0', '#FF4F7B', '#FFB84D', '#8B5CF6']

function KpiTile({ label, value, accent, Icon }) {
  const c = tileColors[accent]
  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: 'rgba(62,30,120,0.35)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-white font-medium">{label}</div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: c.bg }}
        >
          <Icon size={16} style={{ color: c.fg }} />
        </div>
      </div>
      <div className="text-4xl font-bold" style={{ color: c.fg }}>
        {value}
      </div>
    </div>
  )
}

function RiskGauge({ score, level, color }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(score, 100))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className="rounded-lg p-5 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'rgba(62,30,120,0.35)' }}
    >
      <div className="text-sm text-white font-medium self-start mb-2">Overall mine risk</div>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#3A2A66" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
        />
        <text x="60" y="66" textAnchor="middle" fill={color} fontSize="19" fontFamily="monospace" fontWeight="600">
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="text-base font-semibold mt-1" style={{ color }}>
        {level}
      </div>
    </div>
  )
}

function NodeCard({ node, index }) {
  const isOffline = node.status_online === false
  const status = isOffline ? 'UNKNOWN' : node.status
  const dotColor = statusDot[status] || statusDot.UNKNOWN
  const borderColor = borderPalette[index % borderPalette.length]

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'rgba(24,11,54,0.6)',
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className="text-white font-semibold text-sm mb-2">{node.node_id}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOffline ? '#8B7FC7' : '#3FE0A8' }} />
          {isOffline ? 'Offline' : 'Online'}
        </span>
        <span className="font-mono" style={{ color: isOffline ? '#8B7FC7' : dotColor }}>
          {isOffline ? 'No data' : status}
        </span>
      </div>
    </div>
  )
}

function Dashboard() {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const [sensors, risk] = await Promise.all([getSensors(), getRisk()])
      const merged = mergeNodesWithRisk(sensors, risk)
      merged.sort((a, b) => nodeSortKey(a.node_id) - nodeSortKey(b.node_id))
      setNodes(merged)
      setError(null)
    } catch (err) {
      setError('Could not reach backend. Is uvicorn running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const totalNodes = nodes.length
  const onlineNodes = nodes.filter((n) => n.status_online !== false).length
  const safeNodes = nodes.filter((n) => n.status === 'SAFE').length
  const warningNodes = nodes.filter((n) => n.status === 'WARNING').length
  const criticalNodes = nodes.filter((n) => n.status === 'CRITICAL').length

  const overallRisk =
    criticalNodes > 0 ? 'CRITICAL' : warningNodes > 0 ? 'WARNING' : 'SAFE'
  const overallColorKey =
    overallRisk === 'CRITICAL' ? 'critical' : overallRisk === 'WARNING' ? 'warning' : 'safe'
  const overallColor = tileColors[overallColorKey].fg

  const avgRiskScore =
    nodes.length > 0
      ? nodes.reduce((sum, n) => sum + (n.risk_score || 0), 0) / nodes.length
      : 0

  if (loading) {
    return <div className="text-muted text-sm font-mono">Loading live data...</div>
  }

  if (error) {
    return (
      <div className="bg-panel border border-critical rounded-sm p-4 text-sm text-critical font-mono">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Mine Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiTile label="Total nodes" value={totalNodes} accent="data" Icon={Boxes} />
        <KpiTile label="Online" value={onlineNodes} accent="safe" Icon={Wifi} />
        <KpiTile label="Safe" value={safeNodes} accent="safe" Icon={ShieldCheck} />
        <KpiTile label="Warning" value={warningNodes} accent="warning" Icon={AlertTriangle} />
        <KpiTile label="Critical" value={criticalNodes} accent="critical" Icon={AlertOctagon} />
        <RiskGauge score={avgRiskScore} level={overallRisk} color={overallColor} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Nodes</h2>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3FE0A8' }} /> Safe
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFB84D' }} /> Warning
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF4F7B' }} /> Critical
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8B7FC7' }} /> Offline
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {nodes.map((node, i) => (
            <NodeCard key={node.node_id} node={node} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard