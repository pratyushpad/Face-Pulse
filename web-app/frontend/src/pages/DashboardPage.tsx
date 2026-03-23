import { useDetection } from '@/contexts/DetectionContext'
import { AnalyticsPanel } from '@/components/AnalyticsPanel'

export function DashboardPage() {
  const {
    sessionStart,
    totalDetections,
    emotionCounts,
    timelineData,
    isDetecting,
    resetSession,
  } = useDetection()

  return (
    <div className="max-w-content mx-auto px-6 pt-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-[15px] text-text-secondary mt-2">
            Live session analytics and emotion distribution.
          </p>
        </div>

        {totalDetections > 0 && (
          <button
            onClick={resetSession}
            className="inline-flex items-center gap-1.5 px-[10px] py-[6px] text-[12px] font-medium rounded-[6px] cursor-pointer transition-colors duration-150 bg-transparent border border-border-default text-text-secondary hover:text-danger hover:border-danger/50"
          >
            Reset Session
          </button>
        )}
      </div>

      <AnalyticsPanel
        sessionStart={sessionStart}
        totalDetections={totalDetections}
        emotionCounts={emotionCounts}
        timelineData={timelineData}
        isDetecting={isDetecting}
      />
    </div>
  )
}
