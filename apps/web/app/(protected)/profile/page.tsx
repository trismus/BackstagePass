import { redirect } from 'next/navigation'
import { getUser, getUserProfile } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export const metadata = {
  title: 'Profil bearbeiten',
  description: 'Bearbeite dein Profil',
}

export default async function ProfilePage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Profil</h1>
        <p className="mt-1 text-neutral-600">
          Verwalte deine Profilinformationen
        </p>
      </div>

      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Profilinformationen</CardTitle>
            <CardDescription>
              Aktualisiere deinen Anzeigenamen und andere Informationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              initialDisplayName={profile?.display_name || null}
              email={user.email || ''}
              role={profile?.role || 'VIEWER'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
