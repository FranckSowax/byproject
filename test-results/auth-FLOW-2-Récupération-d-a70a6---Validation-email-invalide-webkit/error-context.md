# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "By Project Logo" [ref=e5]
      - generic [ref=e6]: Mot de passe oublié
      - generic [ref=e7]: Entrez votre email pour réinitialiser votre mot de passe
    - generic [ref=e9]:
      - generic [ref=e10]:
        - text: Adresse email
        - textbox "Adresse email" [active] [ref=e11]:
          - /placeholder: votre@email.com
          - text: invalid
      - button "Envoyer le lien" [ref=e12]:
        - img [ref=e13]
        - text: Envoyer le lien
      - link "Retour à la connexion" [ref=e16]:
        - /url: /login
        - button "Retour à la connexion" [ref=e17]:
          - img [ref=e18]
          - text: Retour à la connexion
    - paragraph [ref=e21]:
      - text: Vous n'avez pas de compte ?
      - link "Créer un compte" [ref=e22]:
        - /url: /signup
  - region "Notifications alt+T"
```