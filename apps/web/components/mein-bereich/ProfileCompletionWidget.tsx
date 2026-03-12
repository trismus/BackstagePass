'use client'

interface ProfileCompletionWidgetProps {
  person: {
    telefon?: string | null
    strasse?: string | null
    plz?: string | null
    ort?: string | null
    notfallkontakt_name?: string | null
    notfallkontakt_telefon?: string | null
    skills?: string[] | null
  } | null
}

interface CheckItem {
  label: string
  completed: boolean
}

export function ProfileCompletionWidget({ person }: ProfileCompletionWidgetProps) {
  if (!person) return null

  const checks: CheckItem[] = [
    {
      label: 'Telefonnummer',
      completed: !!person.telefon,
    },
    {
      label: 'Adresse',
      completed: !!(person.strasse && person.plz && person.ort),
    },
    {
      label: 'Notfallkontakt',
      completed: !!(person.notfallkontakt_name && person.notfallkontakt_telefon),
    },
    {
      label: 'Skills',
      completed: !!(person.skills && person.skills.length > 0),
    },
  ]

  const completedCount = checks.filter((c) => c.completed).length
  const totalCount = checks.length

  // Hide when all complete
  if (completedCount === totalCount) return null

  const percentage = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-900">
          Profil vervollständigen
        </h3>
        <span className="text-xs font-medium text-amber-700">
          {completedCount} von {totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-amber-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2">
            {check.completed ? (
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span
              className={`text-sm ${
                check.completed
                  ? 'text-neutral-500 line-through'
                  : 'text-amber-900'
              }`}
            >
              {check.label}
            </span>
            {!check.completed && (
              <a
                href="#profile-card"
                className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                Ausfüllen
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
