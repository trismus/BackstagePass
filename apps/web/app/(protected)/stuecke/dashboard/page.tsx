import Link from 'next/link'
import { getProductionProgress } from '@/lib/actions/mitglieder-integration'
import { ProductionDashboard } from '@/components/produktionen/ProductionDashboard'

export default async function ProductionDashboardPage() {
  const productions = await getProductionProgress()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/stuecke"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zu Stücke
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Produktions-Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Übersicht über Besetzung, Schichten und Proben aller aktiven Produktionen
          </p>
        </div>

        {/* Dashboard */}
        <ProductionDashboard productions={productions} />
      </div>
    </main>
  )
}
