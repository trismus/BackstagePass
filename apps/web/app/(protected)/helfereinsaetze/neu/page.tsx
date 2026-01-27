import Link from 'next/link'
import { getActivePartner } from '@/lib/actions/partner'
import { HelfereinsatzForm } from '@/components/helfereinsaetze/HelfereinsatzForm'

export default async function NeuerHelfereinsatzPage() {
  const partner = await getActivePartner()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
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
          <p className="mt-1 text-gray-600">
            Erstelle einen neuen externen Helfereinsatz
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <HelfereinsatzForm partner={partner} mode="create" />
        </div>
      </div>
    </main>
  )
}
