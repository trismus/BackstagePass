# BackstagePass Update: Die Aufführungs-Logistik ist da!

**Was bisher geschah:** Unsere Theater-App konnte bereits Mitglieder verwalten und Helfereinsätze planen. Was fehlte? Die Kernfunktion für jede Theatergruppe – die Organisation von Aufführungen.

## Was ist neu?

### Aufführungen im Griff

Jede Vorstellung besteht aus mehr als nur "Vorhang auf". Es gibt Aufbau, Einlass, Pausen, Abbau – alles mit eigenem Zeitplan. Ab sofort lassen sich diese Zeitblöcke direkt in der App anlegen und verwalten. Eine Kalenderansicht zeigt alle kommenden Aufführungen auf einen Blick.

### Wer macht was?

Für jeden Zeitblock können Schichten definiert werden: 2 Personen an der Kasse, 3 beim Einlass, 1 in der Technik. Die App zeigt live an, wie viele Helfer noch fehlen – so sieht man sofort, wo noch Lücken sind.

### Räume und Equipment

Bühne, Foyer, Garderobe – welcher Raum wird wann gebraucht? Scheinwerfer, Mikrofone, Requisiten – was muss reserviert werden? Die App prüft automatisch auf Konflikte. Wenn der Proberaum schon belegt ist, gibt's eine Warnung.

### Templates für Routinen

Jede Premiere läuft ähnlich ab? Einmal ein Template erstellen, bei der nächsten Aufführung anwenden – fertig. Zeitblöcke, Schichten und Ressourcen werden automatisch übernommen. Das spart Zeit und verhindert, dass etwas vergessen wird.

## Unter der Haube

- 4 neue Datenbank-Migrationen
- 6 Server-Actions für alle CRUD-Operationen
- Konfliktprüfung für Raum- und Ressourcen-Reservierungen
- Bedarfsübersicht mit Live-Berechnung
- Vollständig typisiert mit TypeScript

## Abgeschlossene Issues

- #96 Epic: Operative Aufführungslogistik effizient planen
- #97 Aufführungen mit Zeitblöcken planen
- #98 Ressourcen & Räume verwalten
- #99 Einsatz-Templates für wiederkehrende Abläufe

## Nächste Schritte

Die Grundlage steht. Als nächstes kommen Benachrichtigungen bei Änderungen und eine Checkliste vor jeder Aufführung.

---

*BackstagePass – Damit hinter den Kulissen alles klappt.*
