import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHelpContent } from '@/app/actions/help'
import { HELP_TOPICS, type HelpContextKey } from '@/lib/help'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata dynamically
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const topic = HELP_TOPICS[slug as HelpContextKey]

  if (!topic) {
    return {
      title: 'Hilfe - Nicht gefunden',
    }
  }

  return {
    title: `${topic.title} - Hilfe`,
    description: topic.description,
  }
}

// Generate static params for all help topics
export async function generateStaticParams() {
  return Object.keys(HELP_TOPICS).map((key) => ({
    slug: key,
  }))
}

export default async function HilfeTopicPage({ params }: PageProps) {
  const { slug } = await params
  const contextKey = slug as HelpContextKey

  // Validate context key
  if (!HELP_TOPICS[contextKey]) {
    notFound()
  }

  const result = await getHelpContent(contextKey)

  if (!result.success || !result.content) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Link
            href={"/hilfe" as never}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            &larr; Zurück zur Übersicht
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {HELP_TOPICS[contextKey].title}
          </h1>
        </div>

        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {result.error || 'Fehler beim Laden des Hilfe-Inhalts'}
          </p>
        </div>
      </div>
    )
  }

  const { content } = result

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href={"/hilfe" as never} className="text-neutral-500 hover:text-neutral-700">
          Hilfe
        </Link>
        <span className="text-neutral-400">/</span>
        <span className="text-neutral-900">{content.title}</span>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
          <h1 className="text-xl font-semibold text-neutral-900">
            {content.title}
          </h1>
          <p className="mt-1 text-neutral-600">{content.description}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        </div>
      </div>

      {/* Related Topics */}
      {content.relatedTopics && content.relatedTopics.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-neutral-900">
            Verwandte Themen
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.relatedTopics.map((topic) => (
              <Link
                key={topic.key}
                href={`/hilfe/${topic.key}` as never}
                className="group rounded-lg border border-neutral-200 p-4 transition-all hover:border-primary-300 hover:shadow-sm"
              >
                <h3 className="font-medium text-neutral-900 group-hover:text-primary-700">
                  {topic.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {topic.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div>
        <Link
          href={"/hilfe" as never}
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Zurück zur Hilfe-Übersicht
        </Link>
      </div>
    </div>
  )
}
