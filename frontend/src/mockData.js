// TEMPORARY placeholder data — replaced with live backend calls in Phase 6.
// Structure mirrors what GET /sensors, GET /risk, GET /history, GET /alerts will return.

export const mockNodes = [
  { node_id: 'NODE_01', latitude: 23.51, longitude: 82.48, status: 'SAFE', risk_score: 12, tilt: 0.14, vibration: 0.06, displacement: 0.61, crack_status: 0 },
  { node_id: 'NODE_02', latitude: 23.53, longitude: 82.52, status: 'SAFE', risk_score: 18, tilt: 0.19, vibration: 0.08, displacement: 0.72, crack_status: 0 },
  { node_id: 'NODE_03', latitude: 23.49, longitude: 82.46, status: 'WARNING', risk_score: 54, tilt: 1.8, vibration: 0.6, displacement: 4.3, crack_status: 0 },
  { node_id: 'NODE_04', latitude: 23.52, longitude: 82.50, status: 'SAFE', risk_score: 9, tilt: 0.11, vibration: 0.05, displacement: 0.44, crack_status: 0 },
  { node_id: 'NODE_05', latitude: 23.47, longitude: 82.53, status: 'CRITICAL', risk_score: 88, tilt: 4.2, vibration: 1.9, displacement: 12.1, crack_status: 1 },
  { node_id: 'NODE_06', latitude: 23.50, longitude: 82.44, status: 'SAFE', risk_score: 15, tilt: 0.16, vibration: 0.07, displacement: 0.55, crack_status: 0 },
]

export const mockHistory = (nodeId) => {
  const base = mockNodes.find((n) => n.node_id === nodeId) || mockNodes[0]
  const points = []
  for (let i = 20; i >= 0; i--) {
    const drift = Math.max(0, (20 - i) * (base.risk_score / 20) * 0.05)
    points.push({
      time: `T-${i}`,
      tilt: +(base.tilt * (0.3 + drift)).toFixed(2),
      vibration: +(base.vibration * (0.3 + drift)).toFixed(2),
      displacement: +(base.displacement * (0.3 + drift)).toFixed(2),
      risk_score: Math.min(100, Math.round(base.risk_score * (0.3 + drift))),
    })
  }
  return points
}

export const mockAlerts = [
  { id: 1, node_id: 'NODE_05', timestamp: '2026-09-04 11:42', alert_type: 'Critical Displacement', message: 'Displacement exceeded critical threshold', severity: 'CRITICAL', status: 'active' },
  { id: 2, node_id: 'NODE_03', timestamp: '2026-09-04 11:20', alert_type: 'Rising Tilt', message: 'Tilt trending upward over last 6 readings', severity: 'MEDIUM', status: 'active' },
  { id: 3, node_id: 'NODE_05', timestamp: '2026-09-04 10:58', alert_type: 'Crack Detected', message: 'Crack sensor triggered', severity: 'CRITICAL', status: 'acknowledged' },
]

export const statusColor = {
  SAFE: '#3DDC97',
  WARNING: '#F2A93B',
  CRITICAL: '#E8523F',
}