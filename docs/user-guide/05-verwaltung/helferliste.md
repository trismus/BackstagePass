# Helferliste verwalten

> **Hinweis:** Dieser Bereich ist nur für **Vorstand** und **Administratoren** zugänglich.

Die Helferliste ermöglicht die Verwaltung externer Helfer-Events: Veranstaltungen, für die der Verein Helferinnen und Helfer von ausserhalb rekrutiert. Die Anmeldung erfolgt über eine öffentliche Seite — Helfer benötigen keinen Login.

Pfad: `/vorstand/helferliste`

---

## Übersicht der Helfer-Events

### Aufrufen:
1. Gehe zu **"Verwaltung"** → **"Helferliste"** in der Seitennavigation
2. Die Übersicht aller zukünftigen Helfer-Events wird angezeigt

### Kennzahlen-Leiste:
Oben in der Übersicht erscheinen vier Kennzahlen:

| Kennzahl | Bedeutung |
|----------|-----------|
| **Events** | Anzahl zukünftiger Helfer-Events |
| **Besetzung** | Belegte vs. benötigte Helferstellen (in %) |
| **Kritisch** | Anzahl Events mit kritischer Unterbesetzung |
| **Rollen total** | Gesamtzahl aller Helferrollen |

---

## Ampelsystem

Jedes Event zeigt einen **Ampelstatus**, der den Belegungsgrad der Helferstellen anzeigt:

| Farbe | Bedeutung |
|-------|-----------|
| **Grün** | Vollständig besetzt (100 %) |
| **Gelb** | Teilweise besetzt (unter 100 %) |
| **Rot** | Kritisch unterbesetzt (wenige oder keine Helfer) |

Der Ampelstatus wird automatisch berechnet und aktualisiert sich bei jeder Anmeldung oder Abmeldung.

---

## Filtern und Suchen

- **Suche** - Nach Event-Name oder Ort suchen
- **Ampelfilter** - Anzeige auf "Alle", "Voll besetzt", "Teilweise" oder "Kritisch" einschränken

---

## Event-Details aufrufen

Klicke auf ein Event in der Liste, um die Detailansicht zu öffnen.

Die Detailansicht zeigt:
- Alle Helferrollen des Events mit Beschreibung und benötigter Anzahl
- Aktuelle Belegung pro Rolle (Name, Telefon, Status)
- Möglichkeit, Helfer manuell hinzuzufügen oder zuzuweisen

---

## Helfer-Event erstellen und verwalten

Die eigentliche Verwaltung der Helfer-Events (Erstellen, Bearbeiten, Rollen definieren) erfolgt über den Bereich **"Helferliste"** im Hauptmenü (nicht die Vorstand-Ansicht). Die Vorstand-Helferliste unter `/vorstand/helferliste` ist die **Monitoring-Ansicht** für den Belegungsstatus.

---

## Öffentliche Anmeldeseite

Jedes Helfer-Event hat einen öffentlichen Anmeldelink, der ohne Login zugänglich ist. Dieser Link kann geteilt werden (z.B. per E-Mail oder auf der Vereinswebsite). Helfer, die sich über diesen Link anmelden, müssen der Datenschutzerklärung zustimmen.

---

## Häufige Fragen

### Was ist der Unterschied zwischen "Helferliste" und "Helfereinsätze"?
- **Helferliste** (neu): Externes System für öffentliche Helfer-Events, die über eine öffentliche Seite zugänglich sind. Helfer brauchen keinen Account.
- **Helfereinsätze** (legacy): Älteres System für interne Einsätze mit bestehenden Vereinsmitgliedern.

### Wie bekomme ich mehr Helfer für ein kritisches Event?
1. Öffne das Event in der Detailansicht
2. Kopiere den öffentlichen Anmeldelink
3. Teile ihn per E-Mail oder auf Social Media

---

*Weiter zu: [Events erstellen](./events-erstellen.md)*
