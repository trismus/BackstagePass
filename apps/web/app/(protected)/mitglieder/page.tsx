import Link from 'next/link'
import { getPersonen } from '@/lib/actions/personen'
import { MitgliederTable } from '@/components/mitglieder/MitgliederTable'

export default async function MitgliederPage() {
  const personen = await getPersonen()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mitglieder</h1>
            <p className="text-gray-600 mt-1">
              Verwalte die Mitglieder deines Theatervereins
            </p>
          </div>
          <Link
            href="/mitglieder/neu"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + Neues Mitglied
          </Link>
        </div>

        {/* Table */}
        <MitgliederTable personen={personen} />

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
