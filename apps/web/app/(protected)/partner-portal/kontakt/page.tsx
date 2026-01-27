import Link from 'next/link'

export default function PartnerKontaktPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/partner-portal' as never}
            className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Kontakt</h1>
          <p className="mt-1 text-gray-600">
            So erreichen Sie die Theatergruppe Widen
          </p>
        </div>

        {/* Contact Info */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Theatergruppe Widen
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
              <dd>
                <a
                  href="mailto:info@theatergruppe-widen.ch"
                  className="text-blue-600 hover:text-blue-800"
                >
                  info@theatergruppe-widen.ch
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Website</dt>
              <dd>
                <a
                  href="https://www.theatergruppe-widen.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  www.theatergruppe-widen.ch
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Adresse</dt>
              <dd className="text-gray-900">
                <address className="not-italic">
                  Theatergruppe Widen
                  <br />
                  8967 Widen
                  <br />
                  Schweiz
                </address>
              </dd>
            </div>
          </dl>
        </div>

        {/* Contact Form Placeholder */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Nachricht senden
          </h2>
          <form className="space-y-4">
            <div>
              <label
                htmlFor="betreff"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Betreff
              </label>
              <input
                type="text"
                id="betreff"
                name="betreff"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Ihr Anliegen"
              />
            </div>
            <div>
              <label
                htmlFor="nachricht"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Nachricht
              </label>
              <textarea
                id="nachricht"
                name="nachricht"
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Ihre Nachricht an uns..."
              />
            </div>
            <div>
              <button
                type="submit"
                disabled
                className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-gray-500"
              >
                Senden (Demnächst verfügbar)
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Das Kontaktformular wird in Kürze aktiviert. Bitte nutzen Sie
                vorerst die E-Mail-Adresse oben.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
