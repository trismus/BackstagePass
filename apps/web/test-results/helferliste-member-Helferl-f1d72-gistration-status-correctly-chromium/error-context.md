# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - paragraph [ref=e5]: BackstagePass
      - heading "Anmelden" [level=1] [ref=e6]
      - paragraph [ref=e7]: Melde dich mit deinem Account an
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: E-Mail
        - textbox "E-Mail" [ref=e11]:
          - /placeholder: name@beispiel.de
      - generic [ref=e12]:
        - generic [ref=e13]: Passwort
        - textbox "Passwort" [ref=e14]:
          - /placeholder: ••••••••
      - button "Anmelden" [ref=e15] [cursor=pointer]
    - link "Passwort vergessen?" [ref=e17] [cursor=pointer]:
      - /url: /forgot-password
    - paragraph [ref=e18]:
      - text: Noch kein Account?
      - link "Registrieren" [ref=e19] [cursor=pointer]:
        - /url: /signup
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]: Anmelden
```