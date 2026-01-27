import Link from 'next/link'
import {
  getPersonenAdvanced,
  getAllSkills,
  type MitgliederFilterParams,
  type ArchiveFilter,
  type SortField,
  type SortOrder,
} from '@/lib/actions/personen'
import { MitgliederTable } from '@/components/mitglieder/MitgliederTable'
import { HelpButton } from '@/components/help'

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    rolle?: string | string[]
    skills?: string | string[]
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function MitgliederPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Parse URL params into filter params
  const filterParams: MitgliederFilterParams = {
    search: params.search || '',
    status: (params.status as ArchiveFilter) || 'aktiv',
    rolle: params.rolle
      ? Array.isArray(params.rolle)
        ? params.rolle
        : [params.rolle]
      : [],
    skills: params.skills
      ? Array.isArray(params.skills)
        ? params.skills
        : [params.skills]
      : [],
    sortBy: (params.sortBy as SortField) || 'name',
    sortOrder: (params.sortOrder as SortOrder) || 'asc',
  }

  const [personen, allSkills] = await Promise.all([
    getPersonenAdvanced(filterParams),
    getAllSkills(),
  ])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Mitglieder</h1>
              <HelpButton contextKey="mitglieder" />
            </div>
            <p className="mt-1 text-gray-600">
              Verwalte die Mitglieder deines Theatervereins
            </p>
          </div>
          <Link
            href="/mitglieder/neu"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            + Neues Mitglied
          </Link>
        </div>

        {/* Table with Filters */}
        <MitgliederTable
          personen={personen}
          filterParams={filterParams}
          availableSkills={allSkills}
          showArchiveActions={true}
        />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}
