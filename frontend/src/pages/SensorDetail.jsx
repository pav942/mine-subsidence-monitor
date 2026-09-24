import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getSensor, getHistory, getRisk } from '../api/client'
import { mergeNodesWithRisk, statusColor } from '../utils/riskHelpers'

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  )
}

function SensorDetail() {
  const { id } = useParams()
  const [node, setNode] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensor, risk, hist] = await Promise.all([
          getSensor(id),
          getRisk(),
          getHistory(id, 30),
        ])
        const [merged] = mergeNodesWithRisk([sensor], risk)
        setNode(merged)
        setHistory(hist.slice().reverse()) // oldest -> newest for chart
      } catch (err) {
        setError('Node not found or backend unreachable.')
      }
    }
    fetchData()
  }, [id])

  if (error) {
    return (
      <div className="text-sm text-critical font-mono">
        {error} <Link to="/map" className="text-data underline">Back to map</Link>
      </div>
    )
  }

  if (!node) {
    return <div className="text-muted text-sm font-mono">Loading...</div>
  }

  const latest = history[history.length - 1]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/map" className="text-xs text-data font-mono">&larr; Back to map</Link>
        <h1 className="text-xl font-semibold mt-2">{node.node_id}</h1>
        <p className="text-sm text-muted mt-1">
          {node.latitude?.toFixed(4)}, {node.longitude?.toFixed(4)}
        </p>
      </div>

      <div
        className="bg-panel border border-border rounded-sm p-4"
        style={{ borderLeft: `2px solid ${statusColor[node.status] || statusColor.UNKNOWN}` }}
      >
        <div className="text-xs text-muted mb-1">Current Status</div>
        <div className="text-2xl font-mono font-semibold" style={{ color: statusColor[node.status] || statusColor.UNKNOWN }}>
          {node.status}
        </div>
        <div className="text-sm text-muted mt-1">Risk Score: {node.risk_score}%</div>
      </div>

      {latest && (
        <div className="bg-panel border border-border rounded-sm p-4">
          <div className="text-sm font-medium mb-2">Latest Readings</div>
          <DetailRow label="Tilt" value={latest.tilt} />
          <DetailRow label="Vibration" value={latest.vibration} />
          <DetailRow label="Displacement" value={latest.displacement} />
          <DetailRow label="Crack Status" value={latest.crack_status ? 'Detected' : 'None'} />
        </div>
      )}

      <div className="bg-panel border border-border rounded-sm p-4">
        <div className="text-sm font-medium mb-3">Displacement Trend (recent readings)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A333B" />
            <XAxis dataKey="timestamp" hide />
            <YAxis stroke="#8B96A3" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: '#1B2126', border: '1px solid #2A333B', fontSize: 12 }} />
            <Line type="monotone" dataKey="displacement" stroke="#F2A93B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default SensorDetail