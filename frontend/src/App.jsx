import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import InputPage from './pages/InputPage'
import QCPage from './pages/QCPage'
import PlanPage from './pages/PlanPage'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/"     element={<InputPage />} />
          <Route path="/qc"   element={<QCPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="*"     element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
