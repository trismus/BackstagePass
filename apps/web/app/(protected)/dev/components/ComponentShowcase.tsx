'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  Select,
  Textarea,
  TagInput,
  DateInput,
  DatePicker,
  TimePicker,
  Modal,
  Tabs,
  Tooltip,
  Accordion,
  Table,
  Pagination,
  CalendarEvent,
} from '@/components/ui'

// =============================================================================
// Code Block Component
// =============================================================================

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative mt-2 overflow-hidden rounded-lg bg-neutral-900">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-600"
      >
        {copied ? 'Kopiert!' : 'Kopieren'}
      </button>
      <pre className="overflow-x-auto p-4 text-sm text-neutral-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// =============================================================================
// Component Section
// =============================================================================

interface ComponentSectionProps {
  title: string
  description: string
  children: React.ReactNode
  code: string
}

function ComponentSection({ title, description, children, code }: ComponentSectionProps) {
  const [showCode, setShowCode] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {showCode ? 'Vorschau' : 'Code'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {showCode ? (
          <CodeBlock code={code} />
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Main Showcase Component
// =============================================================================

export function ComponentShowcase() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectValue, setSelectValue] = useState<string>()
  const [tags, setTags] = useState<string[]>(['React', 'TypeScript'])
  const [date, setDate] = useState<string>()
  const [page, setPage] = useState(1)

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
    { value: 'option4', label: 'Option 4', group: 'Gruppe A' },
    { value: 'option5', label: 'Option 5', group: 'Gruppe A' },
  ]

  const tableColumns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'E-Mail' },
    { key: 'role', header: 'Rolle', render: (row: { role: string }) => (
      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
        {row.role}
      </span>
    )},
  ]

  const tableData = [
    { id: 1, name: 'Max Muster', email: 'max@example.com', role: 'Admin' },
    { id: 2, name: 'Anna Beispiel', email: 'anna@example.com', role: 'User' },
    { id: 3, name: 'Peter Test', email: 'peter@example.com', role: 'User' },
  ]

  const tabs = [
    { id: 'buttons', label: 'Buttons & Inputs' },
    { id: 'forms', label: 'Formulare' },
    { id: 'layout', label: 'Layout' },
    { id: 'data', label: 'Daten' },
    { id: 'calendar', label: 'Kalender' },
  ]

  return (
    <Tabs tabs={tabs} defaultTab="buttons">
      {(activeTab) => (
        <div className="mt-6 space-y-6">
          {/* Buttons & Inputs Tab */}
          {activeTab === 'buttons' && (
            <>
              <ComponentSection
                title="Button"
                description="Interaktive Schaltflaechen mit verschiedenen Varianten"
                code={`<Button>Primaer</Button>
<Button variant="secondary">Sekundaer</Button>
<Button variant="danger">Loeschen</Button>
<Button variant="ghost">Ghost</Button>
<Button loading>Laden...</Button>`}
              >
                <div className="flex flex-wrap gap-2">
                  <Button>Primaer</Button>
                  <Button variant="secondary">Sekundaer</Button>
                  <Button variant="danger">Loeschen</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button loading>Laden...</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Klein</Button>
                  <Button size="md">Mittel</Button>
                  <Button size="lg">Gross</Button>
                </div>
              </ComponentSection>

              <ComponentSection
                title="Input"
                description="Texteingabefelder mit Label und Fehleranzeige"
                code={`<Input label="Name" placeholder="Vorname eingeben" />
<Input label="E-Mail" type="email" error="Ungueltige E-Mail" />
<Input label="Passwort" type="password" helperText="Min. 8 Zeichen" />`}
              >
                <Input label="Name" placeholder="Vorname eingeben" />
                <Input label="E-Mail" type="email" error="Ungueltige E-Mail" />
                <Input label="Passwort" type="password" helperText="Min. 8 Zeichen" />
              </ComponentSection>

              <ComponentSection
                title="Alert"
                description="Benachrichtigungen und Hinweise"
                code={`<Alert variant="info">Information fuer den Benutzer</Alert>
<Alert variant="success">Aktion erfolgreich!</Alert>
<Alert variant="warning">Achtung!</Alert>
<Alert variant="error">Fehler aufgetreten</Alert>`}
              >
                <Alert variant="info">Information fuer den Benutzer</Alert>
                <Alert variant="success">Aktion erfolgreich!</Alert>
                <Alert variant="warning">Achtung!</Alert>
                <Alert variant="error">Fehler aufgetreten</Alert>
              </ComponentSection>
            </>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && (
            <>
              <ComponentSection
                title="Select"
                description="Dropdown-Auswahl mit Such- und Multi-Select"
                code={`<Select
  label="Auswahl"
  options={[
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ]}
  value={value}
  onChange={setValue}
  searchable
/>`}
              >
                <Select
                  label="Einfache Auswahl"
                  options={selectOptions}
                  value={selectValue}
                  onChange={(v) => setSelectValue(v as string)}
                  placeholder="Bitte waehlen..."
                />
                <Select
                  label="Mit Suche"
                  options={selectOptions}
                  searchable
                  placeholder="Suchen..."
                />
              </ComponentSection>

              <ComponentSection
                title="Textarea"
                description="Mehrzeiliges Textfeld mit Auto-Resize und Zeichenzaehler"
                code={`<Textarea
  label="Beschreibung"
  autoResize
  showCount
  maxLength={200}
/>`}
              >
                <Textarea
                  label="Standard"
                  placeholder="Text eingeben..."
                />
                <Textarea
                  label="Mit Zeichenzaehler"
                  showCount
                  maxLength={200}
                  placeholder="Max. 200 Zeichen..."
                />
                <Textarea
                  label="Auto-Resize"
                  autoResize
                  minRows={2}
                  maxRows={6}
                  placeholder="Waechst mit dem Inhalt..."
                />
              </ComponentSection>

              <ComponentSection
                title="TagInput"
                description="Eingabe fuer mehrere Tags mit Autocomplete"
                code={`<TagInput
  label="Tags"
  value={tags}
  onChange={setTags}
  suggestions={['React', 'Vue', 'Angular']}
  maxTags={5}
/>`}
              >
                <TagInput
                  label="Skills"
                  value={tags}
                  onChange={setTags}
                  suggestions={['React', 'TypeScript', 'Next.js', 'Tailwind', 'Node.js']}
                  maxTags={5}
                  helperText="Enter oder Komma zum Hinzufuegen"
                />
              </ComponentSection>

              <ComponentSection
                title="DateInput"
                description="Datumseingabe mit Kalender-Popup und deutschem Format"
                code={`<DateInput
  label="Datum"
  value={date}
  onChange={setDate}
  placeholder="TT.MM.JJJJ"
/>`}
              >
                <DateInput
                  label="Geburtsdatum"
                  value={date}
                  onChange={setDate}
                  helperText="Manuelle Eingabe oder Kalender verwenden"
                />
              </ComponentSection>
            </>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <>
              <ComponentSection
                title="Modal"
                description="Dialog-Fenster mit Focus-Trap und Animationen"
                code={`<Button onClick={() => setOpen(true)}>Modal oeffnen</Button>
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Beispiel Modal"
  footer={<Button onClick={() => setOpen(false)}>Schliessen</Button>}
>
  <p>Modal Inhalt hier...</p>
</Modal>`}
              >
                <Button onClick={() => setModalOpen(true)}>Modal oeffnen</Button>
                <Modal
                  open={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title="Beispiel Modal"
                  description="Dies ist ein Beispiel-Dialog"
                  footer={
                    <Button onClick={() => setModalOpen(false)}>Schliessen</Button>
                  }
                >
                  <p className="text-neutral-600">
                    Modal-Inhalt mit Focus-Trap und ESC zum Schliessen.
                  </p>
                </Modal>
              </ComponentSection>

              <ComponentSection
                title="Accordion"
                description="Einklappbare Inhaltsbereiche"
                code={`<Accordion
  items={[
    { id: '1', title: 'Frage 1', content: 'Antwort 1' },
    { id: '2', title: 'Frage 2', content: 'Antwort 2' },
  ]}
  multiple
/>`}
              >
                <Accordion
                  items={[
                    { id: '1', title: 'Was ist BackstagePass?', content: 'Eine Verwaltungsapp fuer Theatergruppen.' },
                    { id: '2', title: 'Wie melde ich mich an?', content: 'Ueber den Login-Button auf der Startseite.' },
                    { id: '3', title: 'Wer hat Zugriff?', content: 'Mitglieder der Theatergruppe.' },
                  ]}
                  multiple
                />
              </ComponentSection>

              <ComponentSection
                title="Tooltip"
                description="Kontextuelle Hinweise beim Hover"
                code={`<Tooltip text="Dies ist ein Tooltip">
  <Button>Hover mich</Button>
</Tooltip>`}
              >
                <div className="flex gap-4">
                  <Tooltip text="Oben angezeigt" placement="top">
                    <Button variant="secondary">Top</Button>
                  </Tooltip>
                  <Tooltip text="Unten angezeigt" placement="bottom">
                    <Button variant="secondary">Bottom</Button>
                  </Tooltip>
                  <Tooltip text="Links angezeigt" placement="left">
                    <Button variant="secondary">Left</Button>
                  </Tooltip>
                  <Tooltip text="Rechts angezeigt" placement="right">
                    <Button variant="secondary">Right</Button>
                  </Tooltip>
                </div>
              </ComponentSection>
            </>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <>
              <ComponentSection
                title="Table"
                description="Datentabelle mit Sortierung und Selektion"
                code={`<Table
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'E-Mail' },
  ]}
  data={users}
  selectable
/>`}
              >
                <Table
                  columns={tableColumns}
                  data={tableData}
                  selectable
                  hoverable
                />
              </ComponentSection>

              <ComponentSection
                title="Pagination"
                description="Seitennavigation fuer Listen"
                code={`<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
/>`}
              >
                <Pagination
                  currentPage={page}
                  totalPages={10}
                  onPageChange={setPage}
                  showFirstLast
                />
                <p className="text-sm text-neutral-500">
                  Aktuelle Seite: {page}
                </p>
              </ComponentSection>

              <ComponentSection
                title="Card"
                description="Container fuer gruppierte Inhalte"
                code={`<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>Inhalt</CardContent>
</Card>`}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card hover>
                    <CardContent>
                      <p className="font-medium">Standard Card</p>
                      <p className="text-sm text-neutral-500">Mit Hover-Effekt</p>
                    </CardContent>
                  </Card>
                  <Card padding="lg">
                    <CardContent>
                      <p className="font-medium">Groesseres Padding</p>
                      <p className="text-sm text-neutral-500">padding=lg</p>
                    </CardContent>
                  </Card>
                </div>
              </ComponentSection>
            </>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <>
              <ComponentSection
                title="DatePicker"
                description="Datumsauswahl mit Kalender-Dropdown"
                code={`<DatePicker
  label="Datum"
  value={date}
  onChange={setDate}
  minDate="2024-01-01"
/>`}
              >
                <DatePicker
                  label="Startdatum"
                  placeholder="Datum waehlen..."
                />
              </ComponentSection>

              <ComponentSection
                title="TimePicker"
                description="Zeitauswahl mit 15-Minuten-Schritten"
                code={`<TimePicker
  label="Uhrzeit"
  value={time}
  onChange={setTime}
  step={15}
/>`}
              >
                <TimePicker
                  label="Beginn"
                  placeholder="Zeit waehlen..."
                  step={15}
                />
              </ComponentSection>

              <ComponentSection
                title="CalendarEvent"
                description="Event-Darstellung mit Farbkodierung"
                code={`<CalendarEvent
  event={{
    id: '1',
    title: 'Probe',
    date: '2024-03-15',
    variant: 'stage',
  }}
  mode="expanded"
/>`}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <CalendarEvent
                    event={{
                      id: '1',
                      title: 'Hauptprobe',
                      date: '2024-03-15',
                      startTime: '19:00',
                      endTime: '22:00',
                      location: 'Gemeindesaal',
                      variant: 'stage',
                    }}
                    mode="expanded"
                  />
                  <CalendarEvent
                    event={{
                      id: '2',
                      title: 'Vorstandssitzung',
                      date: '2024-03-18',
                      startTime: '18:00',
                      variant: 'info',
                    }}
                    mode="expanded"
                  />
                </div>
                <div className="flex gap-2">
                  <CalendarEvent
                    event={{ id: '3', title: 'Premiere', date: '2024-04-01', variant: 'success' }}
                    mode="compact"
                  />
                  <CalendarEvent
                    event={{ id: '4', title: 'Warnung', date: '2024-04-01', variant: 'warning' }}
                    mode="compact"
                  />
                  <CalendarEvent
                    event={{ id: '5', title: 'Abgesagt', date: '2024-04-01', variant: 'error' }}
                    mode="compact"
                  />
                </div>
              </ComponentSection>
            </>
          )}
        </div>
      )}
    </Tabs>
  )
}
