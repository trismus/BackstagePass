import Link from 'next/link'
import {
  getAlleHelfer,
  type AlleHelferFilterParams,
  type AlleHelferSortField,
  type SortOrder,
  type HelferTyp,
} from '@/lib/actions/alle-helfer'
import { AlleHelferTable } from '@/components/alle-helfer/AlleHelferTable'

interface PageProps {
  searchParams: Promise<{
    search?: string
    typ?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function AlleHelferPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filterParams: AlleHelferFilterParams = {
    search: params.search || '',
    typ: (params.typ as HelferTyp | 'alle') || 'alle',
    sortBy: (params.sortBy as AlleHelferSortField) || 'name',
    sortOrder: (params.sortOrder as SortOrder) || 'asc',
  }

  const helfer = await getAlleHelfer(filterParams)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Alle Helfer</h1>
          <p className="mt-1 text-gray-600">
            Übersicht aller internen und externen Helfer mit ihren Einsätzen
          </p>
        </div>

        {/* Table with Filters */}
        <AlleHelferTable helfer={helfer} filterParams={filterParams} />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
