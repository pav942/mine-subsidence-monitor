import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { getSensors, getRisk } from '../api/client'
import { mergeNodesWithRisk, statusColor } from '../utils/riskHelpers'
import { POLL_INTERVAL_MS } from '../config'

// Converts a 0-100 risk score into a zone radius (meters) and opacity.
// Purely a visual aggregation of sensor data — not a modeled subsidence boundary.
function zoneStyle(riskScore) {
  const clamped = Math.max(0, Math.min(riskScore || 0, 100))
  const radius = 20 + clamped * 1.2      // scaled down for the tighter campus-level zoom
  const opacity = 0.28 + (clamped / 100) * 0.34
  return { radius, opacity }
}

function MapView() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showZones, setShowZones] = useState(true)

  const fetchData = async () => {
    try {
      const [sensors, risk] = await Promise.all([getSensors(), getRisk()])
      setNodes(mergeNodesWithRisk(sensors, risk))
    } catch (err) {
      // handled by empty state below
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // PSNA College of Engineering and Technology, Dindigul
  const center =
    nodes.length > 0
      ? [nodes[0].latitude, nodes[0].longitude]
      : [10.4165, 77.9005]

  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Live GIS Map</h1>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor.SAFE }} /> Safe
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor.WARNING }} /> Warning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor.CRITICAL }} /> Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor.UNKNOWN }} /> Unscored
        </span>

        <label className="flex items-center gap-2 ml-auto cursor-pointer text-muted">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            className="accent-data"
          />
          Show risk zones
        </label>
      </div>

      <div className="flex-1 border border-border rounded-sm overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted text-sm font-mono">
            Loading map data...
          </div>
        ) : (
          <MapContainer center={center} zoom={17} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showZones &&
              nodes.map((node) => {
                const { radius, opacity } = zoneStyle(node.risk_score)
                const color = statusColor[node.status] || statusColor.UNKNOWN
                return (
                  <Circle
                    key={`zone-${node.node_id}`}
                    center={[node.latitude, node.longitude]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: opacity,
                      opacity: 0.9,
                      weight: 2,
                    }}
                  />
                )
              })}

            {nodes.map((node) => {
              const color = statusColor[node.status] || statusColor.UNKNOWN
              return (
                <CircleMarker
                  key={node.node_id}
                  center={[node.latitude, node.longitude]}
                  radius={9}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => navigate(`/sensor/${node.node_id}`),
                  }}
                >
                  <Popup>
                    <div className="font-mono text-xs">
                      <div className="font-semibold mb-1">{node.node_id}</div>
                      <div>Status: {node.status}</div>
                      <div>Risk: {node.risk_score}%</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}

export default MapView