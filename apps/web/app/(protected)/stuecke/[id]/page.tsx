import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getStueck, getSzenen, getRollen, getSzenenRollen } from '@/lib/actions/stuecke'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { StatusBadge, SzenenList, RollenList, SzenenRollenMatrix } from '@/components/stuecke'

interface StueckDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function StueckDetailPage({ params }: StueckDetailPageProps) {
  const { id } = await params
  const [stueck, szenen, rollen, szenenRollen, profile] = await Promise.all([
    getStueck(id),
    getSzenen(id),
    getRollen(id),
    getSzenenRollen(id),
    getUserProfile(),
  ])

  if (!stueck) {
    notFound()
  }

  const canEdit = profile ? checkCanEdit(profile.role) : false

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={'/stuecke' as Route}
            className="text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{stueck.titel}</h1>
                <StatusBadge status={stueck.status} />
              </div>
              {stueck.autor && (
                <p className="text-gray-600">von {stueck.autor}</p>
              )}
              {stueck.beschreibung && (
                <p className="text-gray-500 mt-2">{stueck.beschreibung}</p>
              )}
              {stueck.premiere_datum && (
                <p className="text-sm text-gray-500 mt-3">
                  <span className="font-medium">Premiere:</span>{' '}
                  {formatDate(stueck.premiere_datum)}
                </p>
              )}
            </div>
            {canEdit && (
              <Link
                href={`/stuecke/${id}/bearbeiten` as Route}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Bearbeiten
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200">
            <div>
              <span className="text-2xl font-bold text-gray-900">{szenen.length}</span>
              <span className="text-gray-500 ml-2">Szenen</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">{rollen.length}</span>
              <span className="text-gray-500 ml-2">Rollen</span>
            </div>
          </div>
        </div>

        {/* Szenen-Rollen-Matrix */}
        <div className="mb-6">
          <SzenenRollenMatrix
            szenen={szenen}
            rollen={rollen}
            szenenRollen={szenenRollen}
            canEdit={canEdit}
          />
        </div>

        {/* Szenen und Rollen nebeneinander */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SzenenList stueckId={id} szenen={szenen} canEdit={canEdit} />
          <RollenList stueckId={id} rollen={rollen} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
