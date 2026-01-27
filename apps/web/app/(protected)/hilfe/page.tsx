import Link from 'next/link'
import { getHelpTopics } from '@/app/actions/help'
import type { HelpContextKey, HelpTopic } from '@/lib/help'

export const metadata = {
  title: 'Hilfe',
  description: 'Hilfe und Dokumentation für BackstagePass',
}

// Force dynamic rendering since getHelpTopics uses cookies for auth
export const dynamic = 'force-dynamic'

// Section order for display
const SECTION_ORDER = [
  'Erste Schritte',
  'Mein Bereich',
  'Veranstaltungen',
  'Künstlerisch',
  'Verwaltung',
  'Administration',
]

// Topic Card Component
function TopicCard({
  topic,
  topicKey,
}: {
  topic: HelpTopic
  topicKey: HelpContextKey
}) {
  return (
    <Link
      href={`/hilfe/${topicKey}` as never}
      className="group rounded-lg border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm"
    >
      <h3 className="font-medium text-neutral-900 group-hover:text-primary-700">
        {topic.title}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">{topic.description}</p>
    </Link>
  )
}

// Section Component
function Section({
  title,
  topics,
}: {
  title: string
  topics: Array<{ key: HelpContextKey; topic: HelpTopic }>
}) {
  // Deduplicate topics by title (some context keys map to same file)
  const uniqueTopics = topics.reduce(
    (acc, curr) => {
      const existing = acc.find((t) => t.topic.title === curr.topic.title)
      if (!existing) {
        acc.push(curr)
      }
      return acc
    },
    [] as typeof topics
  )

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueTopics.map(({ key, topic }) => (
          <TopicCard key={key} topic={topic} topicKey={key} />
        ))}
      </div>
    </div>
  )
}

export default async function HilfePage() {
  const result = await getHelpTopics()

  if (!result.success || !result.sections) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Hilfe</h1>
          <p className="mt-1 text-neutral-600">
            Hilfe und Dokumentation für BackstagePass
          </p>
        </div>

        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {result.error || 'Fehler beim Laden der Hilfe-Themen'}
          </p>
        </div>
      </div>
    )
  }

  // Sort sections by defined order
  const sortedSections = SECTION_ORDER.filter(
    (section) => result.sections![section]
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Hilfe</h1>
        <p className="mt-1 text-neutral-600">
          Hilfe und Dokumentation für BackstagePass
        </p>
      </div>

      {/* Intro */}
      <div className="rounded-xl border border-neutral-200 bg-gradient-to-r from-primary-50 to-white p-6">
        <h2 className="font-semibold text-neutral-900">
          Willkommen im Hilfebereich
        </h2>
        <p className="mt-2 text-neutral-600">
          Hier findest du Anleitungen und Erklärungen zu allen Funktionen von
          BackstagePass. Wähle ein Thema aus der Liste unten oder nutze die
          Hilfe-Buttons (?) direkt bei den einzelnen Features.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sortedSections.map((sectionTitle) => (
          <Section
            key={sectionTitle}
            title={sectionTitle}
            topics={result.sections![sectionTitle]}
          />
        ))}
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold text-neutral-900">Weitere Hilfe</h2>
        <p className="mt-2 text-neutral-600">
          Bei Fragen oder Problemen wende dich an den Vorstand oder schreibe
          eine E-Mail an{' '}
          <a
            href="mailto:support@tgw.ch"
            className="text-primary-600 hover:underline"
          >
            support@tgw.ch
          </a>
        </p>
      </div>
    </div>
  )
}
