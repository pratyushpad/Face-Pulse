import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

ChartJS.defaults.color = '#525252'
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.05)'
ChartJS.defaults.font.family = '"JetBrains Mono", monospace'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-white p-8">
          <p className="text-[#ef4444] font-semibold text-lg">App failed to load</p>
          <p className="text-[#525252] text-sm font-mono max-w-md text-center">
            Check the browser console for details. If Supabase is not configured, ensure
            VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in web-app/frontend/.env
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#60a5fa] text-black text-sm font-medium rounded-md hover:bg-[#3b82f6] cursor-pointer"
          >
            Reload
          </button>
        </div>
      }
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
