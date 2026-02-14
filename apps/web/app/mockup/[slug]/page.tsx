import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMockupPage, getAllMockupPages } from '../../../lib/mockup/data'

export async function generateStaticParams() {
  const pages = getAllMockupPages()
  return pages.map((page) => ({ slug: page.slug }))
}

type MockupPageProps = {
  params: Promise<{ slug: string }>
}

export default async function MockupDetailPage({ params }: MockupPageProps) {
  const { slug } = await params
  const page = getMockupPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8">
          <Link
            href="/mockup"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <span>&larr;</span>
            <span>Zurück zur Übersicht</span>
          </Link>
        </nav>

        <article className="rounded-lg border border-gray-200 bg-white p-8 shadow">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">
            {page.title}
          </h1>

          {/* SECURITY: page.body is trusted static HTML from lib/mockup/data.ts (developer-only content) */}
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </article>

        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Mockup-Hinweis:</strong> Dies ist eine Vorschau-Seite für
            Design-Feedback. Die Inhalte sind Platzhalter.
          </p>
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          BackstagePass Mockup Preview
        </div>
      </div>
    </main>
  )
}
