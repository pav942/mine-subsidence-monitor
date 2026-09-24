 import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import SensorDetail from './pages/SensorDetail'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import FukuzonoAnalysis from './pages/FukuzonoAnalysis'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/sensor/:id" element={<SensorDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/fukuzono" element={<FukuzonoAnalysis />} />
      </Route>
    </Routes>
  )
}

export default App