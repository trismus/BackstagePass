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
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-8">
          <Link
            href="/mockup"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>&larr;</span>
            <span>Zurück zur Übersicht</span>
          </Link>
        </nav>

        <article className="bg-white rounded-lg shadow p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {page.title}
          </h1>

          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        </article>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Mockup-Hinweis:</strong> Dies ist eine Vorschau-Seite für Design-Feedback.
            Die Inhalte sind Platzhalter.
          </p>
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          BackstagePass Mockup Preview
        </div>
      </div>
    </main>
  )
}