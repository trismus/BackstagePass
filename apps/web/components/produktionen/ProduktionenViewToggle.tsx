'use client'

import { useState } from 'react'
import type { Produktion } from '@/lib/supabase/types'
import { ProduktionenTable } from './ProduktionenTable'
import { ProduktionKanban } from './ProduktionKanban'
import { ProduktionTimeline } from './ProduktionTimeline'

type ViewMode = 'kanban' | 'liste' | 'timeline'

interface ProduktionenViewToggleProps {
  produktionen: Produktion[]
  canEdit?: boolean
  canDelete?: boolean
}

export function ProduktionenViewToggle({
  produktionen,
  canEdit = false,
  canDelete = false,
}: ProduktionenViewToggleProps) {
  const [view, setView] = useState<ViewMode>('kanban')

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setView('kanban')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'kanban'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Kanban
        </button>
        <button
          onClick={() => setView('liste')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'liste'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Liste
        </button>
        <button
          onClick={() => setView('timeline')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === 'timeline'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* Views */}
      {view === 'kanban' && (
        <ProduktionKanban produktionen={produktionen} canEdit={canEdit} />
      )}
      {view === 'liste' && (
        <ProduktionenTable
          produktionen={produktionen}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
      {view === 'timeline' && <ProduktionTimeline produktionen={produktionen} />}
    </div>
  )
}
