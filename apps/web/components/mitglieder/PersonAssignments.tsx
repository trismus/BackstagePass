'use client'

import Link from 'next/link'
import type { PersonAssignment } from '@/lib/actions/mitglieder-integration'

interface PersonAssignmentsProps {
  assignments: PersonAssignment[]
}

const typLabels: Record<string, string> = {
  besetzung: 'Besetzung',
  schicht: 'Schicht',
  probe: 'Probe',
  veranstaltung: 'Veranstaltung',
}

const typColors: Record<string, string> = {
  besetzung: 'bg-purple-100 text-purple-800',
  schicht: 'bg-blue-100 text-blue-800',
  probe: 'bg-amber-100 text-amber-800',
  veranstaltung: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  hauptbesetzung: 'Hauptbesetzung',
  zweitbesetzung: 'Zweitbesetzung',
  ersatz: 'Ersatz',
  zugesagt: 'Zugesagt',
  abgesagt: 'Abgesagt',
  eingeladen: 'Eingeladen',
  angemeldet: 'Angemeldet',
  warteliste: 'Warteliste',
  erschienen: 'Erschienen',
  nicht_erschienen: 'Nicht erschienen',
  vielleicht: 'Vielleicht',
}

const statusColors: Record<string, string> = {
  hauptbesetzung: 'text-green-700',
  zweitbesetzung: 'text-blue-700',
  zugesagt: 'text-green-700',
  angemeldet: 'text-green-700',
  eingeladen: 'text-amber-700',
  vielleicht: 'text-amber-700',
  abgesagt: 'text-red-700',
  nicht_erschienen: 'text-red-700',
  erschienen: 'text-green-700',
}

function formatDate(datum: string | null): string {
  if (!datum) return '-'
  return new Date(datum).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function PersonAssignments({ assignments }: PersonAssignmentsProps) {
  const upcoming = assignments.filter(
    (a) => !a.datum || a.datum >= new Date().toISOString().split('T')[0]
  )
  const past = assignments.filter(
    (a) => a.datum && a.datum < new Date().toISOString().split('T')[0]
  )

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Aktuell & Kommend ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((a) => (
              <AssignmentRow key={`${a.typ}-${a.id}`} assignment={a} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Vergangen ({past.length})
          </h3>
          <div className="space-y-2">
            {past.slice(0, 10).map((a) => (
              <AssignmentRow key={`${a.typ}-${a.id}`} assignment={a} />
            ))}
            {past.length > 10 && (
              <p className="text-sm text-gray-500">
                ... und {past.length - 10} weitere
              </p>
            )}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500">
          Keine Einsätze vorhanden
        </p>
      )}
    </div>
  )
}

function AssignmentRow({ assignment }: { assignment: PersonAssignment }) {
  const href = assignment.veranstaltung_id
    ? `/auffuehrungen/${assignment.veranstaltung_id}`
    : null

  const content = (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typColors[assignment.typ] || 'bg-gray-100 text-gray-800'}`}
        >
          {typLabels[assignment.typ] || assignment.typ}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-900">{assignment.titel}</p>
          {assignment.stueck_titel && (
            <p className="text-xs text-gray-500">{assignment.stueck_titel}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">{formatDate(assignment.datum)}</span>
        <span
          className={`font-medium ${statusColors[assignment.status] || 'text-gray-600'}`}
        >
          {statusLabels[assignment.status] || assignment.status}
        </span>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href as never}>{content}</Link>
  }

  return content
}
