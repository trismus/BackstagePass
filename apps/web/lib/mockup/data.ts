/**
 * Mockup Data Layer
 * Dummy-Daten für Mockup-Seiten (ohne Supabase-Anbindung)
 */

export type MockupPage = {
  id: string
  slug: string
  title: string
  body: string
}

export const mockupPages: MockupPage[] = [
  {
    id: '1',
    slug: 'dashboard',
    title: 'Dashboard',
    body: `
      <h2>Willkommen im Theater-Dashboard</h2>
      <p>Hier siehst du eine Übersicht aller aktuellen Produktionen,
      anstehenden Proben und offenen Aufgaben.</p>
      <ul>
        <li>3 aktive Produktionen</li>
        <li>12 Proben diese Woche</li>
        <li>5 offene Aufgaben</li>
      </ul>
    `,
  },
  {
    id: '2',
    slug: 'produktionen',
    title: 'Produktionen',
    body: `
      <h2>Aktuelle Produktionen</h2>
      <div>
        <h3>Hamlet</h3>
        <p>Premiere: 15. März 2026</p>
        <p>Status: In Proben</p>
      </div>
      <div>
        <h3>Der Kirschgarten</h3>
        <p>Premiere: 20. April 2026</p>
        <p>Status: Casting</p>
      </div>
      <div>
        <h3>Sommernachtstraum</h3>
        <p>Premiere: 1. Juni 2026</p>
        <p>Status: Planung</p>
      </div>
    `,
  },
  {
    id: '3',
    slug: 'mitglieder',
    title: 'Mitglieder',
    body: `
      <h2>Ensemble & Crew</h2>
      <p>Übersicht aller Vereinsmitglieder mit Rollen und Kontaktdaten.</p>
      <table>
        <tr><th>Name</th><th>Rolle</th><th>Aktiv seit</th></tr>
        <tr><td>Anna Müller</td><td>Schauspielerin</td><td>2020</td></tr>
        <tr><td>Max Schmidt</td><td>Regisseur</td><td>2018</td></tr>
        <tr><td>Lisa Weber</td><td>Bühnenbildnerin</td><td>2021</td></tr>
      </table>
    `,
  },
]

export function getMockupPage(slug: string): MockupPage | undefined {
  return mockupPages.find((page) => page.slug === slug)
}

export function getAllMockupPages(): MockupPage[] {
  return mockupPages
}
