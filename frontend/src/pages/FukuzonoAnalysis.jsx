import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getSensors, getFukuzono } from '../api/client'
import { POLL_INTERVAL_MS } from '../config'

// Sorts node IDs in natural numeric order (NODE_1, NODE_2, ... NODE_20)
// instead of whatever order the API happens to return them in.
function sortNodesById(sensors) {
  return [...sensors].sort((a, b) => {
    const numA = parseInt(String(a.node_id).replace(/\D/g, ''), 10)
    const numB = parseInt(String(b.node_id).replace(/\D/g, ''), 10)
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return String(a.node_id).localeCompare(String(b.node_id))
    }
    return numA - numB
  })
}

function FukuzonoAnalysis() {
  const [nodes, setNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadNodes = async () => {
      const sensors = await getSensors()
      const sorted = sortNodesById(sensors)
      setNodes(sorted)
      if (sorted.length > 0 && !selectedNode) {
        setSelectedNode(sorted[0].node_id)
      }
    }
    loadNodes()
  }, [])

  useEffect(() => {
    if (!selectedNode) return
    const load = async () => {
      try {
        const result = await getFukuzono(selectedNode, 50)
        setData(result)
        setError(null)
      } catch (err) {
        setError('Not enough readings yet for this node, or backend unreachable.')
        setData(null)
      }
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [selectedNode])

  const inverseVelocityData = data?.series?.filter((p) => p.inverse_velocity !== null) || []
  const velocityData = data?.series || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fukuzono Inverse Velocity Analysis</h1>
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

      {error && (
        <div className="bg-panel border border-critical rounded-sm p-4 text-sm text-critical font-mono">
          {error}
        </div>
      )}

      {data && (
        <>
          <div
            className="bg-panel border border-border rounded-sm p-4"
            style={{ borderLeft: `2px solid ${data.predicted_failure_time ? '#FF4F7B' : '#3FE0A8'}` }}
          >
            <div className="text-xs text-muted mb-1">Estimated Failure Time</div>
            {data.predicted_failure_time ? (
              <div className="text-xl font-mono font-semibold text-critical">
                {new Date(data.predicted_failure_time).toLocaleString()}
              </div>
            ) : (
              <div className="text-xl font-mono font-semibold text-safe">
                No convergent trend detected
              </div>
            )}
          </div>

          <div className="bg-panel border border-border rounded-sm p-4">
            <div className="text-sm font-medium mb-3">Inverse Velocity Over Time</div>
            {inverseVelocityData.length === 0 ? (
              <div className="text-sm text-muted font-mono">
                Not enough displacement movement yet to compute a trend for this node.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={inverseVelocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A1A54" />
                  <XAxis
                    dataKey="t_seconds"
                    stroke="#8B7FC7"
                    fontSize={11}
                    label={{ value: 'Seconds elapsed', position: 'insideBottom', offset: -4, fill: '#8B7FC7', fontSize: 11 }}
                  />
                  <YAxis stroke="#8B7FC7" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#180B36', border: '1px solid #2A1A54', fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="#FF4F7B" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="inverse_velocity" stroke="#3ED6F0" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-panel border border-border rounded-sm p-4">
            <div className="text-sm font-medium mb-3">Velocity Over Time</div>
            {velocityData.length === 0 ? (
              <div className="text-sm text-muted font-mono">
                Not enough readings yet to compute velocity for this node.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A1A54" />
                  <XAxis
                    dataKey="t_seconds"
                    stroke="#8B7FC7"
                    fontSize={11}
                    label={{ value: 'Seconds elapsed', position: 'insideBottom', offset: -4, fill: '#8B7FC7', fontSize: 11 }}
                  />
                  <YAxis stroke="#8B7FC7" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#180B36', border: '1px solid #2A1A54', fontSize: 12 }} />
                  <Line type="monotone" dataKey="velocity" stroke="#FFB84D" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default FukuzonoAnalysis