import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Theatergruppe Widen',
  description:
    'Datenschutzerklärung der Theatergruppe Widen nach Schweizer Datenschutzgesetz (nDSG)',
  openGraph: {
    title: 'Datenschutzerklärung | Theatergruppe Widen',
    type: 'website',
  },
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Datenschutzerklärung
          </h1>
          <p className="mt-4 text-gray-600">
            Diese Datenschutzerklärung informiert dich über die Verarbeitung
            deiner Daten durch die Theatergruppe Widen. Stand: März 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-12 text-gray-700">
          {/* 1. Verantwortliche Stelle */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              1. Verantwortliche Stelle
            </h2>
            <div className="space-y-2 rounded-lg bg-gray-50 p-6">
              <p className="font-semibold text-gray-900">
                Theatergruppe Widen (TGW)
              </p>
              <p>Ein Verein gemäss Schweizer Zivilrecht</p>
              <p className="mt-4 font-semibold text-gray-900">Kontakt:</p>
              <p>E-Mail: theatergruppewiden@gmail.com</p>
              <p>Website: https://www.theatergruppe-widen.ch</p>
              <p>Plattform: https://backstage-pass.vercel.app</p>
              <p className="mt-4 text-sm italic text-gray-600">
                Für Fragen zu deinen Daten wende dich bitte per E-Mail an uns.
              </p>
            </div>
          </section>

          {/* 2. Welche Daten werden erhoben? */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              2. Welche Daten werden erhoben?
            </h2>
            <p className="mb-4">
              Wir verarbeiten folgende Kategorien von Daten je nach deiner
              Nutzung:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  A) Mitglieder und Vereinsmitarbeiter
                </h3>
                <ul className="mt-2 ml-4 space-y-1 list-disc text-gray-700">
                  <li>Vorname, Nachname</li>
                  <li>E-Mail-Adresse</li>
                  <li>Telefonnummer (optional)</li>
                  <li>Postanschrift (optional)</li>
                  <li>Rolle im Verein (Mitglied, Vorstand, etc.)</li>
                  <li>Arbeitsstunden (Stundenkonto)</li>
                  <li>Anmeldungen zu Veranstaltungen und Proben</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  B) Externe Helfer (Helferliste)
                </h3>
                <ul className="mt-2 ml-4 space-y-1 list-disc text-gray-700">
                  <li>Vorname, Nachname</li>
                  <li>E-Mail-Adresse</li>
                  <li>Telefonnummer (optional)</li>
                  <li>Anmeldungen zu Helfereinsätzen</li>
                  <li>Timestamp der Datenschutz-Akzeptanz</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  C) Technische Daten
                </h3>
                <ul className="mt-2 ml-4 space-y-1 list-disc text-gray-700">
                  <li>IP-Adresse (beim Login)</li>
                  <li>Browser-Informationen (User-Agent)</li>
                  <li>Session-Cookies für Authentifizierung</li>
                  <li>Zeitstempel von Aktivitäten (Logins, Änderungen)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Zweck der Datenverarbeitung */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              3. Zweck der Datenverarbeitung
            </h2>
            <p className="mb-4">Deine Daten verarbeiten wir für folgende Zwecke:</p>

            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Benutzerkonto und Authentifizierung
                  </h3>
                  <p className="text-gray-600">
                    Erstellen und Verwalten deines Accounts, Anmeldung,
                    Passwort-Zurücksetzen
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Vereinsverwaltung
                  </h3>
                  <p className="text-gray-600">
                    Verwaltung von Mitgliedschaften, Rollen, Aufgaben und
                    Verantwortlichkeiten im Verein
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Veranstaltungsverwaltung
                  </h3>
                  <p className="text-gray-600">
                    Registrierung zu Proben, Aufführungen, Veranstaltungen und
                    Helfereinsätzen
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Kommunikation
                  </h3>
                  <p className="text-gray-600">
                    Versand von Bestätigungen, Erinnerungen, Änderungen und
                    informationen zu Veranstaltungen per E-Mail
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Stundenkonten und Abrechnung
                  </h3>
                  <p className="text-gray-600">
                    Tracking von geleisteten Arbeitsstunden für Mitglieder
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 rounded-full bg-primary-100 p-2">
                  <svg
                    className="h-5 w-5 text-primary-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sicherheit und Compliance
                  </h3>
                  <p className="text-gray-600">
                    Audit-Logging für Sicherheit und Datenschutzkonformität
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Rechtsgrundlage */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              4. Rechtsgrundlage für die Datenverarbeitung
            </h2>
            <p className="mb-4">
              Nach dem neuen Schweizer Datenschutzgesetz (nDSG, gültig seit
              1. September 2023) darf der Verein personenbezogene Daten nur
              unter bestimmten Bedingungen verarbeiten:
            </p>

            <div className="space-y-4 rounded-lg bg-gray-50 p-6">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Vereinszweck und Mitgliederverwaltung
                </h3>
                <p className="mt-2 text-gray-700">
                  Die Verarbeitung von Daten zur Verwaltung der Mitgliedschaft
                  und zur Erreichung der Vereinsziele ist notwendig und zulässig
                  gemäss nDSG Art. 31.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  Einwilligung (für externe Helfer)
                </h3>
                <p className="mt-2 text-gray-700">
                  Für externe Helfer, die sich über die öffentliche
                  Helferliste anmelden, ist eine Einwilligung zur
                  Datenschutzerklärung erforderlich. Diese kannst du jederzeit
                  schriftlich widerrufen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  Rechtliche Verpflichtung
                </h3>
                <p className="mt-2 text-gray-700">
                  Falls relevant, verarbeiten wir Daten zur Erfüllung
                  gesetzlicher Verpflichtungen (z.B. Versicherungsanforderungen).
                </p>
              </div>
            </div>
          </section>

          {/* 5. Speicherdauer */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              5. Wie lange speichern wir deine Daten?
            </h2>
            <p className="mb-4">
              Wir speichern deine Daten nur so lange, wie es notwendig ist:
            </p>

            <div className="space-y-3">
              <div className="flex gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex-shrink-0 text-primary-600 font-semibold">
                  Mitglieder:
                </div>
                <div className="text-gray-700">
                  Solange du Mitglied im Verein bist, sowie 3 weitere Jahre nach
                  Austritt (für Abrechnung und Dokumentation)
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex-shrink-0 text-primary-600 font-semibold">
                  Externe Helfer:
                </div>
                <div className="text-gray-700">
                  Bis 2 Jahre nach der letzten Anmeldung. Danach erfolgt eine
                  Löschung auf Anfrage.
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex-shrink-0 text-primary-600 font-semibold">
                  Audit-Logs:
                </div>
                <div className="text-gray-700">
                  Sicherheitsrelevante Logs werden 1 Jahr lang gespeichert
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex-shrink-0 text-primary-600 font-semibold">
                  Session-Cookies:
                </div>
                <div className="text-gray-700">
                  Werden automatisch gelöscht, wenn du dich abmeldest oder
                  nach 30 Tagen Inaktivität
                </div>
              </div>
            </div>
          </section>

          {/* 6. Datenweitergabe an Dritte */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              6. Geben wir deine Daten an Dritte weiter?
            </h2>
            <p className="mb-4">
              Wir geben deine Daten grundsätzlich nicht an Dritte weiter, mit
              folgenden Ausnahmen:
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <h3 className="font-semibold text-gray-900">
                  Hosting und technische Infrastruktur
                </h3>
                <ul className="mt-3 ml-4 space-y-2 list-disc text-gray-700">
                  <li>
                    <strong>Supabase</strong> (EU/Frankfurt): Backend-Datenbank
                    und Authentifizierung — Standard Data Processing Agreement
                    (DPA)
                  </li>
                  <li>
                    <strong>Vercel</strong> (USA, mit EU Data Processing): Hosting
                    und Frontend — Bestandteil des Service
                  </li>
                  <li>
                    <strong>Gmail SMTP</strong>: E-Mail-Versand — Vertraglich
                    geregelt, wird nur als Transportmedium genutzt
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900">
                  Interne Weitergabe
                </h3>
                <p className="mt-2 text-gray-700">
                  Daten können an Vorstandsmitglieder und beauftragte
                  Vereinsmitarbeiter weitergegeben werden, aber nur soweit
                  notwendig für ihre Aufgaben (z.B. Veranstaltungsleiter für
                  Registrierungslisten).
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <h3 className="font-semibold text-gray-900">
                  Keine Weitergabe an andere Länder
                </h3>
                <p className="mt-2 text-gray-700">
                  Deine Daten werden nicht in Länder ausserhalb der EU/Schweiz
                  übertragen, mit Ausnahme von Vercel (USA), das einen Standard
                  Contractual Clauses (SCCs) Mechanismus für Datenschutz nutzt.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Deine Rechte */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              7. Welche Rechte hast du?
            </h2>
            <p className="mb-4">
              Nach dem nDSG hast du folgende Rechte bezüglich deiner Daten:
            </p>

            <div className="space-y-4">
              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht auf Auskunft
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst jederzeit erfahren, welche Daten wir über dich
                  speichern und wie wir sie verarbeiten.
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht auf Berichtigung
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst unrichtige oder unvollständige Daten korrigieren —
                  idealerweise direkt über dein Benutzerkonto in BackstagePass.
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht auf Löschung (Recht vergessen zu werden)
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst die Löschung deiner Daten verlangen, ausser wenn
                  wir sie aus gesetzlichen oder vertraglichen Gründen speichern
                  müssen (z.B. zur Abrechnung offener Stunden).
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht auf Datenportabilität
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst verlangen, dass wir deine Daten in einem
                  maschinenlesbaren Format herausgeben.
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht auf Widerspruch
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst der Verarbeitung deiner Daten widersprechen, z.B.
                  beim Erhalt von Benachrichtigungen oder Werbung.
                </p>
              </div>

              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="font-semibold text-gray-900">
                  Recht, ein Recht auszuüben
                </h3>
                <p className="mt-2 text-gray-700">
                  Um eines dieser Rechte auszuüben, schreib uns eine E-Mail an{' '}
                  <a
                    href="mailto:theatergruppewiden@gmail.com"
                    className="font-semibold text-primary-600 hover:text-primary-700"
                  >
                    theatergruppewiden@gmail.com
                  </a>{' '}
                  mit deinem Namen und einer klaren Beschreibung, welches Recht
                  du ausüben möchtest. Wir bearbeiten deine Anfrage innerhalb
                  von 30 Tagen.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              8. Cookies
            </h2>
            <p className="mb-4">
              BackstagePass verwendet Cookies zur Verwaltung deiner
              Benuttersession:
            </p>

            <div className="space-y-4 rounded-lg bg-gray-50 p-6">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Session-Cookies (erforderlich)
                </h3>
                <p className="mt-2 text-gray-700">
                  Diese werden von Supabase Auth automatisch gesetzt, um dich
                  angemeldet zu halten. Sie sind notwendig für die
                  Funktionalität der Plattform.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900">
                  Keine Tracking-Cookies
                </h3>
                <p className="mt-2 text-gray-700">
                  Wir verwenden <strong>keine</strong> Google Analytics,
                  Facebook Pixel oder andere Tracking-Tools. BackstagePass
                  respektiert deine Privatsphäre.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900">
                  Cookie-Einstellungen
                </h3>
                <p className="mt-2 text-gray-700">
                  Du kannst Session-Cookies jederzeit durch Abmeldung oder
                  Löschen der Cookies in deinem Browser entfernen. Wenn du
                  Cookies deaktivierst, können einige Funktionen von
                  BackstagePass nicht mehr funktionieren.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Datensicherheit */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              9. Wie schützen wir deine Daten?
            </h2>
            <p className="mb-4">
              Wir treffen technische und organisatorische Massnahmen zum Schutz
              deiner Daten:
            </p>

            <ul className="space-y-3 ml-4 list-disc text-gray-700">
              <li>
                <strong>HTTPS/TLS-Verschlüsselung:</strong> Alle Daten werden
                zwischen deinem Browser und unseren Servern verschlüsselt
                übertragen
              </li>
              <li>
                <strong>Datenbank-Verschlüsselung:</strong> Supabase verschlüsselt
                Daten in der Datenbank
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Daten sind durch
                Datenbank-Richtlinien geschützt — jeder Benutzer sieht nur
                seine autorisierten Daten
              </li>
              <li>
                <strong>Passwort-Hashing:</strong> Passwörter werden mit
                sicheren Algorithmen gehashed und gesalzt
              </li>
              <li>
                <strong>Zugriffskontrolle:</strong> Nur autorisierte
                Mitarbeiter und Systeme haben Zugriff auf sensible Daten
              </li>
              <li>
                <strong>Audit-Logging:</strong> Wichtige Datenänderungen werden
                geloggt und können überprüft werden
              </li>
              <li>
                <strong>Regelmäßige Updates:</strong> Alle Systeme und
                Abhängigkeiten werden regelmässig aktualisiert
              </li>
            </ul>
          </section>

          {/* 10. Externe Links */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              10. Externe Links und Websites
            </h2>
            <p className="text-gray-700">
              BackstagePass kann Links zu externen Websites (z.B. die Verein-Website
              https://www.theatergruppe-widen.ch) enthalten. Wir sind nicht
              verantwortlich für die Datenschutzpraktiken anderer Websites. Wenn
              du auf externe Links klickst, beachte die Datenschutzerklärung
              dieser Websites.
            </p>
          </section>

          {/* 11. Änderungen */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              11. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-gray-700">
              Wir können diese Datenschutzerklärung jederzeit aktualisieren, um
              technische Änderungen oder neue Anforderungen widerzuspiegeln. Bei
              wesentlichen Änderungen informieren wir dich per E-Mail. Die jeweils
              aktuelle Datenschutzerklärung findest du unter{' '}
              <a
                href="https://backstage-pass.vercel.app/datenschutz"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                https://backstage-pass.vercel.app/datenschutz
              </a>
              .
            </p>
          </section>

          {/* 12. Kontakt */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              12. Fragen und Kontakt
            </h2>
            <p className="mb-4">
              Hast du Fragen zu dieser Datenschutzerklärung oder deinen
              Daten? Kontaktiere uns:
            </p>

            <div className="rounded-lg bg-primary-50 p-6 border border-primary-200">
              <p className="font-semibold text-gray-900">
                Theatergruppe Widen
              </p>
              <p className="mt-2 text-gray-700">
                E-Mail:{' '}
                <a
                  href="mailto:theatergruppewiden@gmail.com"
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  theatergruppewiden@gmail.com
                </a>
              </p>
              <p className="mt-2 text-gray-700">
                Website:{' '}
                <a
                  href="https://www.theatergruppe-widen.ch"
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  https://www.theatergruppe-widen.ch
                </a>
              </p>
              <p className="mt-4 text-sm italic text-gray-600">
                Wir antworten auf Anfragen zur Datenverwaltung innerhalb von
                30 Tagen.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>
              <strong>Stand der Datenschutzerklärung: März 2026</strong>
            </p>
            <p className="mt-2">
              Datenschutzerklärung gemäss neues Schweizer Datenschutzgesetz
              (nDSG, gültig seit 1. September 2023)
            </p>
            <p className="mt-4">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                Zur Startseite
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
