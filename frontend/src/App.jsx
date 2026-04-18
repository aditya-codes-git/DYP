import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import { Header } from './components/ui/header-2.jsx'

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<AppLayout><UploadPage /></AppLayout>} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  )
}
