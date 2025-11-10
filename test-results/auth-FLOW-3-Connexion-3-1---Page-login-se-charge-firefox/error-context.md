# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "By Project" [ref=e6]
      - generic [ref=e7]: Bon retour
      - generic [ref=e8]: Connectez-vous à votre compte By Project
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Email
          - textbox "Email" [ref=e13]:
            - /placeholder: nom@exemple.com
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Mot de passe
            - link "Mot de passe oublié ?" [ref=e17] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Mot de passe" [ref=e18]
      - generic [ref=e19]:
        - button "Se connecter" [ref=e20]
        - paragraph [ref=e21]:
          - text: Pas encore de compte ?
          - link "S'inscrire" [ref=e22] [cursor=pointer]:
            - /url: /signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e33]
```