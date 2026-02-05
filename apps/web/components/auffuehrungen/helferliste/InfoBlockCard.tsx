import type { InfoBlock } from '@/lib/supabase/types'

interface InfoBlockCardProps {
  infoBlock: InfoBlock
}

export function InfoBlockCard({ infoBlock }: InfoBlockCardProps) {
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5)
  }

  return (
    <div className="rounded-lg border border-info-200 bg-info-50 p-4">
      <div className="flex items-start gap-3">
        {/* Info Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-info-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-info-900">{infoBlock.titel}</h4>
            <span className="text-sm text-info-700">
              {formatTime(infoBlock.startzeit)} - {formatTime(infoBlock.endzeit)}
            </span>
          </div>
          {infoBlock.beschreibung && (
            <p className="mt-1 text-sm text-info-700">{infoBlock.beschreibung}</p>
          )}
        </div>
      </div>
    </div>
  )
}
