# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "By Project" [ref=e6]
      - generic [ref=e7]: Bon retour
      - generic [ref=e8]: Connectez-vous à votre compte By Project
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - text: Email
          - textbox "Email" [ref=e12]:
            - /placeholder: nom@exemple.com
            - text: wrong@example.com
        - generic [ref=e13]:
          - generic [ref=e14]:
            - text: Mot de passe
            - link "Mot de passe oublié ?" [ref=e15]:
              - /url: /forgot-password
          - textbox "Mot de passe" [active] [ref=e16]: wrongpassword
      - generic [ref=e17]:
        - button "Se connecter" [ref=e18]
        - paragraph [ref=e19]:
          - text: Pas encore de compte ?
          - link "S'inscrire" [ref=e20]:
            - /url: /signup
  - region "Notifications alt+T"
```