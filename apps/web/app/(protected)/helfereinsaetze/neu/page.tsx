import Link from 'next/link'
import { getActivePartner } from '@/lib/actions/partner'
import { HelfereinsatzForm } from '@/components/helfereinsaetze/HelfereinsatzForm'

export default async function NeuerHelfereinsatzPage() {
  const partner = await getActivePartner()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/helfereinsaetze"
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Neuer Helfereinsatz
          </h1>
          <p className="text-gray-600 mt-1">
            Erstelle einen neuen externen Helfereinsatz
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <HelfereinsatzForm partner={partner} mode="create" />
        </div>
      </div>
    </main>
  )
}
