#!/bin/bash
#
# Erstellt Milestone + Issues fuer "Fix Email-Einladungssystem"
# Usage: ./scripts/create-email-fix-issues.sh
#
# Voraussetzung: gh CLI authentifiziert (gh auth login)
# Oder: GITHUB_TOKEN env variable gesetzt
#

set -euo pipefail

REPO="trismus/BackstagePass"
MILESTONE_TITLE="Fix Email-Einladungssystem"

echo "================================================"
echo " BackstagePass – Fix Email-Einladungssystem"
echo " Erstelle Milestone + 5 Issues"
echo "================================================"
echo ""

# Check gh auth
if ! gh auth status &>/dev/null; then
  echo "Fehler: gh ist nicht authentifiziert."
  echo "Bitte zuerst: gh auth login"
  exit 1
fi

echo "[1/6] Erstelle Milestone..."
MILESTONE_NUMBER=$(gh api repos/$REPO/milestones \
  --method POST \
  -f title="$MILESTONE_TITLE" \
  -f description="Das Einladungssystem per E-Mail funktioniert nicht korrekt. Einladungslinks zeigen auf die falsche URL (Vercel Preview statt Production), SMTP ist nicht konfiguriert, und neu eingeladene Mitglieder landen ohne gefuehrten Passwort-Setup-Flow. Alle Issues in diesem Milestone beheben gemeinsam den vollstaendigen Einladungsflow." \
  -f due_on="2026-03-03T00:00:00Z" \
  --jq '.number')

echo "   Milestone #$MILESTONE_NUMBER erstellt"

# --- Issue 1: Falscher Redirect ---
echo "[2/6] Issue 1: Falscher Redirect-URL..."
ISSUE1=$(gh issue create --repo $REPO \
  --milestone "$MILESTONE_TITLE" \
  --label "bug,backend,prio:high" \
  --title "fix: Einladungslinks zeigen auf falsche URL (Vercel Preview statt Production)" \
  --body "$(cat <<'ISSUE_EOF'
## Problem

Der Einladungslink in der empfangenen Mail zeigt auf:
`https://backstage-pass-backstagepass-projects.vercel.app/`

Das ist ein Vercel Preview-Deployment, nicht die Production-URL.
Der Link führt ins Nichts (falsche Umgebung).

## Ursachen (2 Stellen)

### 1. Supabase Dashboard falsch konfiguriert
- Auth → URL Configuration → Site URL ist auf die Preview-URL gesetzt
- Supabase verwendet diese als Fallback wenn kein `redirectTo` übergeben wird

### 2. Code übergibt kein explizites `redirectTo`

`lib/actions/personen.ts:141` – branded Email Pfad:
```ts
await adminClient.auth.admin.generateLink({
  type: 'invite',
  email,
  options: { data: { display_name: `${vorname} ${nachname}` } },
  // ❌ kein redirectTo!
})
```

`lib/actions/personen.ts:158` – Fallback Pfad:
```ts
await adminClient.auth.admin.inviteUserByEmail(
  email,
  { data: { display_name: `${vorname} ${nachname}` } }
  // ❌ kein redirectTo!
)
```

## Fix

1. **Supabase Dashboard**: Auth → URL Configuration → Site URL auf Production-URL setzen
2. **Code**: `redirectTo` in beiden Aufrufen ergänzen:

```ts
// generateLink
options: {
  data: { display_name: `${vorname} ${nachname}` },
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/passwort-setzen`,
}

// inviteUserByEmail
{
  data: { display_name: `${vorname} ${nachname}` },
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/passwort-setzen`,
}
```

## Abhängigkeiten
- Requires: "Passwort-Setup-Seite erstellen" (Issue in diesem Milestone)
- Requires: `NEXT_PUBLIC_SITE_URL` in Vercel korrekt gesetzt
ISSUE_EOF
)")

echo "   $ISSUE1"

# --- Issue 2: SMTP ---
echo "[3/6] Issue 2: SMTP nicht konfiguriert..."
ISSUE2=$(gh issue create --repo $REPO \
  --milestone "$MILESTONE_TITLE" \
  --label "bug,backend,prio:high" \
  --title "fix: SMTP nicht konfiguriert – gebrandete Einladungsmail wird nicht verwendet" \
  --body "$(cat <<'ISSUE_EOF'
## Problem

Die empfangene Einladungsmail kommt von Supabase's eigenem E-Mail-System
(erkennbar am Link `uoatifhowwsnupvgvslg.supabase.co/auth/v1/verify`),
nicht von unserem konfigurierten Absender.

Das bedeutet:
- Unser gebrandetes Template aus der DB wird **nicht** verwendet
- Der Betreff ist unvollständig ("Einladung zu BackstagePass –")
- Die Mail sieht nicht nach BackstagePass aus

## Ursache

`isEmailServiceConfigured()` in `lib/email/client.ts` prüft ob `SMTP_HOST`,
`SMTP_USER` und `SMTP_PASS` gesetzt sind. Sind sie es nicht, fällt
`performInvite()` (personen.ts:139) auf `inviteUserByEmail()` zurück.

In der Vercel Production-Umgebung sind diese Variablen **nicht gesetzt**.

## Fix

In Vercel (Settings → Environment Variables → Production) setzen:

| Variable | Beispielwert |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `backstagepass.tgw@gmail.com` |
| `SMTP_PASS` | App-spezifisches Passwort (Google → Sicherheit → App-Passwörter) |
| `EMAIL_FROM_ADDRESS` | `BackstagePass <backstagepass.tgw@gmail.com>` |

### Gmail App-Passwort erstellen
1. Google Account → Sicherheit → 2-Faktor-Authentifizierung aktivieren
2. Google Account → Sicherheit → App-Passwörter
3. Neues App-Passwort für "Mail" / "Andere" erstellen
4. 16-stelliges Passwort in `SMTP_PASS` eintragen

## Verifikation
Nach Deployment: Test-Einladung senden und prüfen ob Mail von
`backstagepass.tgw@gmail.com` kommt mit dem gebrandeten Template.
ISSUE_EOF
)")

echo "   $ISSUE2"

# --- Issue 3: Passwort-Setup ---
echo "[4/6] Issue 3: Passwort-Setup-Seite..."
ISSUE3=$(gh issue create --repo $REPO \
  --milestone "$MILESTONE_TITLE" \
  --label "feature,frontend,prio:high" \
  --title "feat: Passwort-Setup-Seite für neu eingeladene Mitglieder" \
  --body "$(cat <<'ISSUE_EOF'
## Problem

Nach dem Klick auf den Einladungslink wird der User auf `/` (Root/Dashboard)
weitergeleitet — ohne Aufforderung, ein Passwort zu setzen. Neue Mitglieder
sind verwirrt und wissen nicht was zu tun ist. Das führt zu unnötigen
Rückfragen beim Vorstand.

## Anforderung

Neue Route `/auth/passwort-setzen` erstellen:

1. **Erkennung**: Seite erkennt, dass User von einem Invite-Link kommt
   (Supabase setzt nach Verifikation eine Session mit entsprechendem Token)
2. **Formular**: Passwort + Passwort-Bestätigung eingeben
3. **Validierung**: Min. 8 Zeichen, Felder müssen übereinstimmen
4. **Nach Erfolg**: Weiterleitung zum Dashboard mit Willkommensmeldung
5. **Vorhandene Seite nutzen**: Die bestehende `/reset-password` Seite
   (`app/(auth)/reset-password/page.tsx`) als Vorlage verwenden —
   die Logik ist identisch (`supabase.auth.updateUser({ password })`)

## Technische Details

```
app/(auth)/passwort-setzen/page.tsx   ← neue Seite
```

- Supabase `updateUser({ password })` — exakt wie beim Passwort-Reset
- UI-Text anpassen: "Willkommen bei BackstagePass! Bitte setze dein Passwort."
- Error-Handling: Session abgelaufen → Link zu Login mit Hinweis
- Nach erfolgreichem Setzen: Redirect zu `/dashboard`

## Abhängigkeit
Issue "Einladungslinks zeigen auf falsche URL" muss `redirectTo` auf
`/auth/passwort-setzen` setzen.
ISSUE_EOF
)")

echo "   $ISSUE3"

# --- Issue 4: Supabase Template ---
echo "[5/6] Issue 4: Supabase-Standard-Template..."
ISSUE4=$(gh issue create --repo $REPO \
  --milestone "$MILESTONE_TITLE" \
  --label "bug,frontend,prio:medium" \
  --title "fix: Supabase-Standard-Einladungsmail hat unvollständigen Betreff" \
  --body "$(cat <<'ISSUE_EOF'
## Problem

Wenn SMTP nicht konfiguriert ist (Fallback), sendet Supabase eine Mail
mit dem Betreff:

> `Einladung zu BackstagePass –`

Der Strich am Ende deutet auf einen nicht gefüllten Platzhalter hin
(Organisationsname "Theatergruppe Widen" fehlt).

## Ursache

Das Supabase-Standard-Template für Invite-Mails im Dashboard verwendet
einen Platzhalter für den Organisationsnamen, der nicht konfiguriert ist.

## Fix

**Supabase Dashboard → Authentication → Email Templates → Invite**:

Betreff anpassen auf:
```
Willkommen bei BackstagePass – Theatergruppe Widen
```

Body ebenfalls anpassen mit vollständigem Begrüssungstext und
funktionierendem `{{ .ConfirmationURL }}` Link.

## Hinweis
Dies ist ein Sicherheitsnetz für den Fall, dass SMTP ausfällt.
Primär sollte Issue "SMTP konfigurieren" gelöst werden.
ISSUE_EOF
)")

echo "   $ISSUE4"

# --- Issue 5: URL-Inkonsistenz ---
echo "[6/6] Issue 5: URL-Inkonsistenz..."
ISSUE5=$(gh issue create --repo $REPO \
  --milestone "$MILESTONE_TITLE" \
  --label "enhancement,backend,prio:medium" \
  --title "chore: URL-Inkonsistenz bei Einladungs-Actions beheben" \
  --body "$(cat <<'ISSUE_EOF'
## Problem

Im Codebase werden zwei verschiedene Env-Variablen für die Base-URL verwendet:
- `NEXT_PUBLIC_SITE_URL` – in `app/actions/auth.ts:70`
- `NEXT_PUBLIC_APP_URL` – in `lib/actions/personen.ts` und anderen Actions

Das führt dazu, dass je nach Kontext eine andere URL verwendet wird,
was schwer zu debuggen ist und zu Fehlern wie dem falschen Redirect führt.

## Fix

1. **Eine einzige Variable** definieren (Empfehlung: `NEXT_PUBLIC_SITE_URL`)
2. Alle Referenzen auf `NEXT_PUBLIC_APP_URL` umstellen
3. `.env` Template (`apps/web/.env`) aktualisieren
4. Vercel-Konfiguration dokumentieren

## Betroffene Dateien
- `app/actions/auth.ts:70`
- `lib/actions/personen.ts`
- `lib/actions/helferliste-notifications.ts:88,334,439`
- `lib/actions/external-registration.ts:375`
- `lib/actions/email-sender.ts:151,159,503`
- `lib/actions/warteliste-notification.ts:34`
- `lib/actions/thank-you-emails.ts:50`
- `lib/actions/helfer-status.ts:224`
- `components/admin/helferliste/HelferStatusControl.tsx:38`

## Empfohlene Reihenfolge
1. `NEXT_PUBLIC_SITE_URL` in Vercel setzen (Production + Preview)
2. Code-Referenzen umstellen
3. `.env` Template aktualisieren
4. Fallback-Werte vereinheitlichen (nicht `http://localhost:3000` vs `https://backstagepass.app`)
ISSUE_EOF
)")

echo "   $ISSUE5"

echo ""
echo "================================================"
echo " Fertig!"
echo ""
echo " Milestone: #$MILESTONE_NUMBER – $MILESTONE_TITLE"
echo " Issues erstellt: 5"
echo ""
echo " Empfohlene Reihenfolge:"
echo "  1. SMTP konfigurieren (Vercel)"
echo "  2. Supabase Template anpassen (Dashboard)"
echo "  3. Passwort-Setup-Seite erstellen (Code)"
echo "  4. redirectTo im Code ergänzen (Code)"
echo "  5. URL-Inkonsistenz beheben (Code)"
echo "================================================"
