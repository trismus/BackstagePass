import Link from 'next/link'
import { getPersonen } from '@/lib/actions/personen'
import { MitgliederTable } from '@/components/mitglieder/MitgliederTable'
import { HelpButton } from '@/components/help'

export default async function MitgliederPage() {
  const personen = await getPersonen()

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
