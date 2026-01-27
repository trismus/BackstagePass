import Link from 'next/link'
import { getAllMockupPages } from '../../lib/mockup/data'

export default function MockupOverviewPage() {
  const pages = getAllMockupPages()

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Mockup-Seiten</h1>
        <p className="mb-8 text-gray-600">
          Klickbare Mockups für Design-Feedback. Wähle eine Seite aus:
        </p>

        <div className="grid gap-4">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/mockup/${page.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {page.title}
              </h2>
              <p className="mt-1 text-gray-500">/mockup/{page.slug}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          BackstagePass Mockup Preview
        </div>
      </div>
    </main>
  )
}
