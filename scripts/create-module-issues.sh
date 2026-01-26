#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${REPO:-}" ]]; then
  remote_url="$(git remote get-url origin)"
  if [[ "$remote_url" == https://github.com/* ]]; then
    REPO="${remote_url#https://github.com/}"
    REPO="${REPO%.git}"
  elif [[ "$remote_url" == git@github.com:* ]]; then
    REPO="${remote_url#git@github.com:}"
    REPO="${REPO%.git}"
  else
    echo "Konnte GitHub-Repo nicht aus origin ableiten. Setze REPO=owner/repo." >&2
    exit 1
  fi
fi

token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
if [[ -z "$token" ]]; then
  echo "Kein GitHub Token gefunden. Setze GITHUB_TOKEN oder GH_TOKEN." >&2
  exit 1
fi

create_issue() {
  local title="$1"
  local body="$2"
  local payload
  payload="$(
    python - <<'PY' "$title" "$body"
import json
import sys

title = sys.argv[1]
body = sys.argv[2]
print(json.dumps({"title": title, "body": body}))
PY
  )"

  curl -sSf \
    -H "Authorization: token ${token}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO}/issues" \
    -d "$payload" \
    >/dev/null
  echo "✓ Erstellt: ${title}"
}

create_issue \
  "Epic: Vereinsleben & Helfereinsätze zentral abbilden" \
  "## Ziel
Vereinsinterne Anlässe und externe Helfereinsätze inklusive Anmeldung, Rollen, Kalender und Helferstunden transparent verwalten.

## Nutzen/ User Storys
- Als Mitglied möchte ich mich zu Vereinsanlässen an- und abmelden können, um meine Teilnahme zu planen.
- Als Organisator:in möchte ich Teilnehmerlisten sehen, um den Anlass vorzubereiten.
- Als Verein möchte ich Engagement und Helferstunden nachvollziehen.

## Vorschlag
- Modul mit Vereinsevents, Helferevents, An-/Abmeldung, Rollen, Kalender und Helferstunden.
- Persönliche Übersichten je Mitglied.

## Alternativen
- Externe Tools für Anmeldungen (Doodle/Forms).
- Nur interne Events, keine externen Helfereinsätze."

create_issue \
  "Vereinsevents verwalten (Erstellen/Planen/Anmelden)" \
  "## Ziel
Vereinsinterne Anlässe (z. B. GV, Helferessen, Ausflug) als Events mit An- und Abmeldung verwaltbar machen.

## Nutzen/ User Storys
- Als Mitglied möchte ich mich zu Vereinsanlässen an- und abmelden können, um meine Teilnahme zu planen.
- Als Organisator:in möchte ich Teilnehmerlisten sehen, um den Anlass vorzubereiten.

## Vorschlag
- Event-Objekt mit Datum, Ort, Beschreibung, Kapazität, An-/Abmeldestatus.
- Anmeldelogik inkl. Warteliste (optional).
- Übersichtsliste der Events für Mitglieder.

## Alternativen
- Anmeldungen nur über externes Tool (z. B. Doodle/Forms) ohne Integration.
- Nur interne Events ohne externen Helferbezug abbilden."

create_issue \
  "Externe Helfereinsätze abbilden" \
  "## Ziel
Externe Helfereinsätze bei Partnerorganisationen erfassen und verwalten.

## Nutzen/ User Storys
- Als Mitglied möchte ich Einsätze bei Partnerorganisationen sehen und mich eintragen können.
- Als Verein möchte ich Einsatzhistorien pro Mitglied nachvollziehen können.

## Vorschlag
- Helferevent-Objekt mit Partner, Einsatzzeit, Rollenbedarf.
- Anmeldung mit Rollen/Schichten.
- Export oder Übersicht für Nachweis.

## Alternativen
- Nur interne Helfereinsätze, externe nur als Notizfeld.
- Einsatzhistorie ausschließlich manuell."

create_issue \
  "Persönliche Einsatz- und Kalenderübersicht" \
  "## Ziel
Persönliche Kalender- und Einsatzübersichten bereitstellen.

## Nutzen/ User Storys
- Als Mitglied möchte ich alle meine Einsätze und Vereinsanlässe in einer Übersicht sehen.
- Als Verein möchte ich Engagement und Helferstunden transparent machen.

## Vorschlag
- Personal Dashboard: kommende/abgeschlossene Einsätze, Stundenkonto.
- Kalender-Ansicht (Monat/Woche).
- Filter nach Eventtyp (Verein/extern).

## Alternativen
- Nur Listenansicht ohne Kalender.
- Keine persönliche Übersicht (nur Eventlisten)."

create_issue \
  "Epic: Operative Aufführungslogistik effizient planen" \
  "## Ziel
Aufführungen, Helferpläne, Räume, Ressourcen und wiederkehrende Abläufe für die Spielphase koordinieren.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich Zeitblöcke, Helferrollen und Ressourcen pro Aufführung planen.
- Als Helfer:in möchte ich klar sehen, wann und wo ich gebraucht werde.

## Vorschlag
- Aufführungen mit Zeitblöcken, Helferrollen und Schichten.
- Ressourcen- und Raumverwaltung mit Verfügbarkeiten.
- Templates für wiederkehrende Abläufe.

## Alternativen
- Schichtplanung in externem Tool.
- Nur Aufführungszeiten ohne Ressourcen-/Schichtlogik."

create_issue \
  "Aufführungen mit Zeitblöcken planen" \
  "## Ziel
Aufführungen inklusive Zeitblöcken und Schichten planbar machen.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich pro Aufführung Zeitblöcke definieren, um Schichten zu planen.
- Als Helfer:in möchte ich sehen, wann ich gebraucht werde.

## Vorschlag
- Aufführung-Objekt mit Datum, Zeit, Status.
- Zeitblock/Schicht-Objekte mit Start/Ende, Bedarf.
- Verknüpfung zu Helferrollen.

## Alternativen
- Nur fixe Aufführungszeiten ohne Schichtplanung.
- Schichten in externem Tool verwalten."

create_issue \
  "Ressourcen & Räume verwalten" \
  "## Ziel
Räume und Ressourcen (Technik/Material) für Aufführungen planen.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich Ressourcen zuordnen, um Engpässe zu vermeiden.
- Als Technikteam möchte ich benötigtes Material rechtzeitig bereitstellen.

## Vorschlag
- Ressourcen- und Raumobjekte mit Verfügbarkeit.
- Zuordnung zu Aufführungen/Schichten.
- Konfliktanzeige (z. B. Doppelbelegung).

## Alternativen
- Ressourcen nur in Freitext.
- Raumplanung getrennt von Aufführungen."

create_issue \
  "Einsatz-Templates für wiederkehrende Abläufe" \
  "## Ziel
Wiederkehrende Abläufe als Templates für Schichtplanung abbilden.

## Nutzen/ User Storys
- Als Produktionsleitung möchte ich standardisierte Abläufe schneller anlegen.
- Als Helfer:in möchte ich konsistente Rollen/Schichten sehen.

## Vorschlag
- Template-Objekt mit Rollen, Zeiten, Ressourcen.
- Kopierfunktion auf neue Aufführungen.
- Anpassbarkeit pro Aufführung.

## Alternativen
- Manuelle Schichtplanung ohne Vorlagen.
- Nur Rollen-Templates, keine Zeitblöcke."

create_issue \
  "Epic: Künstlerische Planung vom Stück bis zur Probe strukturieren" \
  "## Ziel
Stückentwicklung, Rollen-/Szenenstruktur, Besetzung und Probenplanung zentral steuern.

## Nutzen/ User Storys
- Als Regie möchte ich Szenen, Rollen und Besetzungen klar strukturieren.
- Als Ensemblemitglied möchte ich meine Rollen und Proben übersichtlich sehen.

## Vorschlag
- Stück, Szenen, Rollen und Besetzungen verknüpft abbilden.
- Probenplanung inkl. künstlerischer Funktionen.

## Alternativen
- Planung in separaten Dokumenten ohne Verknüpfung.
- Proben nur als Freitext ohne Funktionen."

create_issue \
  "Stück, Szenen und Rollen strukturieren" \
  "## Ziel
Stück, Szenen und Rollen strukturiert erfassen und verknüpfen.

## Nutzen/ User Storys
- Als Regie möchte ich Szenen und Rollen sauber strukturiert dokumentieren.
- Als Produktionsteam möchte ich schnell sehen, welche Rollen in welchen Szenen auftreten.

## Vorschlag
- Stück-Objekt mit Szenenliste.
- Rollenobjekt, zugeordnet zu Szenen.
- Übersicht über Szenen/Rollen-Matrix.

## Alternativen
- Nur Szenenliste ohne Rollenbezug.
- Rollen nur als Freitext."

create_issue \
  "Besetzung verwalten" \
  "## Ziel
Besetzungen für Rollen erfassen und nachvollziehbar machen.

## Nutzen/ User Storys
- Als Regie möchte ich Rollen mit Darsteller:innen besetzen können.
- Als Ensemblemitglied möchte ich meine Rollenübersicht sehen.

## Vorschlag
- Besetzungsobjekt Rolle ↔ Mitglied.
- Mehrfachbesetzung/Alternates möglich.
- Rollenübersicht pro Mitglied.

## Alternativen
- Besetzungen nur in externen Dokumenten.
- Keine Besetzungshistorie."

create_issue \
  "Probenplanung mit künstlerischen Funktionen" \
  "## Ziel
Probenplanung inklusive künstlerischer Funktionen (Regie, Regieassistenz, Bühnenbau, Maske, Technik) ermöglichen.

## Nutzen/ User Storys
- Als Regie möchte ich Proben inkl. beteiligter Funktionen planen.
- Als Technik/Maske möchte ich Proben mit Vorlauf kennen.

## Vorschlag
- Probe-Objekt mit Datum/Zeit, Szenenbezug.
- Zuordnung künstlerischer Funktionen.
- Teilnehmerliste & Benachrichtigungen (optional).

## Alternativen
- Proben ohne Funktionszuordnung.
- Funktionen nur als Freitext pro Probe."
