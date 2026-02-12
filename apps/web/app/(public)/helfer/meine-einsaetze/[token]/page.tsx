import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getHelferDashboardData } from '@/lib/actions/helfer-dashboard'
import { HelferDashboardView } from '@/components/helfer-dashboard/HelferDashboardView'

export const metadata: Metadata = {
  title: 'Meine Einsätze',
  description: 'Übersicht deiner Helfer-Einsätze',
  robots: { index: false },
}

export default async function HelferDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getHelferDashboardData(token)

  if (!data) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <HelferDashboardView data={data} />
    </div>
  )
}
