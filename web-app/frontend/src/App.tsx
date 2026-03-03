/**
 * App — root component with React Router + AnimatePresence page transitions.
 *
 * Layout:
 *   <Navbar /> is rendered globally above all pages.
 *   Each page is wrapped in a motion.div for fade+slide transitions.
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { Landing } from './pages/Landing'
import { Detect } from './pages/Detect'
import { Analytics } from './pages/Analytics'
import { ModelInfo } from './pages/ModelInfo'
import { ApiDocs } from './pages/ApiDocs'

/** Page transition wrapper — applied to every route. */
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Inner component so we can call useLocation (requires Router context). */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Landing />
            </PageWrapper>
          }
        />
        <Route
          path="/detect"
          element={
            <PageWrapper>
              <Detect />
            </PageWrapper>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageWrapper>
              <Analytics />
            </PageWrapper>
          }
        />
        <Route
          path="/model"
          element={
            <PageWrapper>
              <ModelInfo />
            </PageWrapper>
          }
        />
        <Route
          path="/api"
          element={
            <PageWrapper>
              <ApiDocs />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  )
}
