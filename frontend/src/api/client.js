import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 5000,
})

export const getSensors = () => api.get('/sensors').then((res) => res.data)

export const getSensor = (nodeId) =>
  api.get(`/sensor/${nodeId}`).then((res) => res.data)

export const getHistory = (nodeId, limit = 50) =>
  api.get(`/history/${nodeId}`, { params: { limit } }).then((res) => res.data)

export const getRisk = () => api.get('/risk').then((res) => res.data)

export const getAlerts = () => api.get('/alerts').then((res) => res.data)

export const getFukuzono = (nodeId, limit = 50) =>
  api.get(`/fukuzono/${nodeId}`, { params: { limit } }).then((res) => res.data)

export const getCorrelation = () => api.get('/correlation').then((res) => res.data)

export default api