import { createClient } from '@/lib/supabase/server'
import { ProbenplanGenerator } from '@/components/proben/ProbenplanGenerator'
import Link from 'next/link'
import type { Route } from 'next'

export const metadata = {
  title: 'Probenplan-Generator | BackstagePass',
}

export default async function ProbenGeneratorPage() {
  const supabase = await createClient()

  // Fetch active Stücke with their scenes
  const { data: stuecke } = await supabase
    .from('stuecke')
    .select(`
      id,
      titel,
      status,
      szenen(id, nummer, titel, dauer_minuten)
    `)
    .in('status', ['in_produktion', 'in_vorbereitung'])
    .order('titel')

  // Fetch saved templates
  const { data: templates } = await supabase
    .from('probenplan_templates')
    .select(`
      *,
      szenen:probenplan_template_szenen(
        szene_id,
        szene:szenen(id, nummer, titel)
      ),
      stueck:stuecke(id, titel)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Probenplan-Generator
          </h1>
          <p className="mt-1 text-gray-600">
            Erstelle automatisch wiederkehrende Proben
          </p>
        </div>
        <Link
          href={'/proben' as Route}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Zur Probenübersicht
        </Link>
      </div>

      {stuecke && stuecke.length > 0 ? (
        <ProbenplanGenerator
          stuecke={stuecke as unknown as Parameters<typeof ProbenplanGenerator>[0]['stuecke']}
          templates={(templates || []) as unknown as Parameters<typeof ProbenplanGenerator>[0]['templates']}
        />
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Keine aktiven Stücke
          </h3>
          <p className="mt-2 text-gray-500">
            Um den Probenplan-Generator zu nutzen, muss mindestens ein Stück in
            Produktion oder Vorbereitung sein.
          </p>
          <Link
            href={'/stuecke' as Route}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            Stücke verwalten
          </Link>
        </div>
      )}
    </div>
  )
}
