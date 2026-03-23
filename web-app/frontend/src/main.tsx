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

ChartJS.defaults.font.family = '"JetBrains Mono", monospace'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 text-text-primary p-8">
          <p className="text-danger font-semibold text-lg">App failed to load</p>
          <p className="text-text-muted text-sm font-mono max-w-md text-center">
            Check the browser console for details. If Supabase is not configured, ensure
            VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in web-app/frontend/.env
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-md hover:bg-accent-hover cursor-pointer"
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
