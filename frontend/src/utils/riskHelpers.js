export const statusColor = {
  SAFE: '#3FE0A8',
  WARNING: '#FFB84D',
  CRITICAL: '#FF4F7B',
  UNKNOWN: '#8B7FC7',
}

// Merges node list with latest risk results (if any exist yet).
// Falls back to UNKNOWN status/0 score when Phase 7/8 hasn't scored a node yet.
export function mergeNodesWithRisk(nodes, riskResults) {
  const latestRiskByNode = {}
  for (const r of riskResults) {
    const existing = latestRiskByNode[r.node_id]
    if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
      latestRiskByNode[r.node_id] = r
    }
  }

  return nodes.map((node) => {
    const risk = latestRiskByNode[node.node_id]
    return {
      ...node,
      risk_score: risk ? risk.risk_score : 0,
      status: risk ? risk.risk_level : 'UNKNOWN',
    }
  })
}