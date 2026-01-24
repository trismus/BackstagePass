import Link from 'next/link'
import { getAllMockupPages } from '../../lib/mockup/data'

export default function MockupOverviewPage() {
  const pages = getAllMockupPages()

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mockup-Seiten
        </h1>
        <p className="text-gray-600 mb-8">
          Klickbare Mockups für Design-Feedback. Wähle eine Seite aus:
        </p>

        <div className="grid gap-4">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/mockup/${page.slug}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {page.title}
              </h2>
              <p className="text-gray-500 mt-1">
                /mockup/{page.slug}
              </p>
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
