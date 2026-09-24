import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getSensors, getHistory, getRisk } from '../api/client'
import { mergeNodesWithRisk } from '../utils/riskHelpers'
import { POLL_INTERVAL_MS } from '../config'
import RiskPanelHeatmap from '../components/RiskPanelHeatmap'

function nodeSortKey(nodeId) {
  const match = nodeId.match(/(\d+)$/)
  return match ? parseInt(match[1], 10) : 999
}

// Turns an ISO timestamp into a short HH:MM:SS label for the axis/tooltip.
function formatTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return timestamp
  return d.toLocaleTimeString('en-IN', { hour12: false })
}

function ChartPanel({ title, dataKey, color, data }) {
  return (
    <div className="bg-panel border border-border rounded-sm p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A1A54" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#8B7FC7"
            fontSize={11}
            minTickGap={24}
            label={{ value: 'Time', position: 'insideBottom', offset: -4, fill: '#8B7FC7', fontSize: 11 }}
          />
          <YAxis stroke="#8B7FC7" fontSize={11} />
          <Tooltip
            labelFormatter={formatTime}
            contentStyle={{ backgroundColor: '#180B36', border: '1px solid #2A1A54', fontSize: 12 }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Analytics() {
  const [nodes, setNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const loadNodes = async () => {
      const sensors = await getSensors()
      const risk = await getRisk()
      const merged = mergeNodesWithRisk(sensors, risk)
      merged.sort((a, b) => nodeSortKey(a.node_id) - nodeSortKey(b.node_id))
      setNodes(merged)
      if (merged.length > 0 && !selectedNode) {
        setSelectedNode(merged[0].node_id)
      }
    }
    loadNodes()
  }, [])

  useEffect(() => {
    if (!selectedNode) return
    const loadHistory = async () => {
      const hist = await getHistory(selectedNode, 50)
      setHistory(hist.slice().reverse())
    }
    loadHistory()
    const interval = setInterval(loadHistory, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [selectedNode])

  if (nodes.length === 0) {
    return <div className="text-muted text-sm font-mono">Loading nodes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Historical Analytics</h1>
        </div>
        <select
          value={selectedNode || ''}
          onChange={(e) => setSelectedNode(e.target.value)}
          className="bg-panel border border-border rounded-sm px-3 py-2 text-sm font-mono focus:outline-none focus:border-data"
        >
          {nodes.map((n) => (
            <option key={n.node_id} value={n.node_id}>{n.node_id}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPanel title="Tilt Over Time" dataKey="tilt" color="#3ED6F0" data={history} />
        <ChartPanel title="Displacement Over Time" dataKey="displacement" color="#FFB84D" data={history} />
        <ChartPanel title="Vibration Over Time" dataKey="vibration" color="#3ED6F0" data={history} />
      </div>

      <RiskPanelHeatmap />
    </div>
  )
}

export default Analytics