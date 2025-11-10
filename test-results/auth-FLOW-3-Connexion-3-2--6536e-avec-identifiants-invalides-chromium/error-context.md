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
          - generic [ref=e12]: Email
          - textbox "Email" [ref=e13]:
            - /placeholder: nom@exemple.com
            - text: wrong@example.com
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Mot de passe
            - link "Mot de passe oublié ?" [ref=e17] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Mot de passe" [active] [ref=e18]: wrongpassword
      - generic [ref=e19]:
        - button "Se connecter" [ref=e20]
        - paragraph [ref=e21]:
          - text: Pas encore de compte ?
          - link "S'inscrire" [ref=e22] [cursor=pointer]:
            - /url: /signup
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - generic [ref=e31]:
      - text: Compiling
      - generic [ref=e32]:
        - generic [ref=e33]: .
        - generic [ref=e34]: .
        - generic [ref=e35]: .
  - alert [ref=e36]
```