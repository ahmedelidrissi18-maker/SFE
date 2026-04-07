# Sprint 1 - Execution Detaillee

## Authentification et RBAC

## Objectif du Sprint

Mettre en place un systeme de connexion fonctionnel avec controle d'acces par role pour securiser les pages principales de l'application.

## Resultat attendu a la fin du sprint

A la fin de ce sprint :

- un utilisateur peut se connecter
- un utilisateur peut se deconnecter
- une session est maintenue correctement
- les pages protegees ne sont accessibles qu'aux utilisateurs autorises
- les roles `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE` sont pris en compte
- les acces importants sont traces dans `AuditLog`

## Perimetre du Sprint

### Inclus

- login
- session utilisateur
- deconnexion
- protection des routes
- controle d'acces par role
- page acces refuse
- journalisation minimale des connexions

### Non inclus dans ce sprint

- 2FA
- reset password par email
- verrouillage apres plusieurs echecs
- gestion avancee des permissions par action

---

## Decoupage Jour par Jour

## Jour 1 - Preparation Technique

### Objectif

Preparer le terrain technique pour integrer proprement l'authentification.

### Taches

- [ ] analyser la structure actuelle du projet
- [ ] identifier les fichiers a creer pour Auth.js
- [ ] verifier la table `User` dans Prisma
- [ ] verifier la compatibilite entre `User` et les besoins de login
- [ ] definir l'emplacement des fichiers auth :
  - `lib/auth`
  - `middleware.ts`
  - `app/api/auth`
- [ ] lister les routes qui doivent etre protegees
- [ ] definir les regles d'acces par role

### Livrables

- cartographie technique du sprint
- regles de protection identifiees
- structure de fichiers auth decidee

---

## Jour 2 - Configuration Auth.js

### Objectif

Mettre en place la base de l'authentification.

### Taches

- [ ] installer ou finaliser la configuration Auth.js / NextAuth
- [ ] creer le fichier principal de configuration auth
- [ ] configurer le provider `credentials`
- [ ] brancher la lecture des utilisateurs depuis PostgreSQL via Prisma
- [ ] comparer les mots de passe avec `bcrypt`
- [ ] definir les callbacks de session
- [ ] injecter dans la session :
  - id utilisateur
  - email
  - role
- [ ] preparer les types TypeScript de session

### Livrables

- configuration auth fonctionnelle
- provider credentials operationnel
- session enrichie avec le role

---

## Jour 3 - Connexion et Deconnexion

### Objectif

Rendre la page `/login` vraiment fonctionnelle.

### Taches

- [ ] connecter le formulaire de login existant
- [ ] implementer la soumission du formulaire
- [ ] afficher les erreurs de connexion
- [ ] gerer les champs invalides
- [ ] rediriger l'utilisateur apres connexion
- [ ] ajouter un bouton ou mecanisme de deconnexion
- [ ] verifier que la session persiste apres navigation
- [ ] verifier que la session est supprimee a la deconnexion

### Livrables

- login operationnel
- deconnexion operationnelle
- messages d'erreur visibles

---

## Jour 4 - Middleware et Protection des Routes

### Objectif

Bloquer l'acces aux pages sensibles pour les utilisateurs non connectes.

### Taches

- [ ] creer `middleware.ts`
- [ ] proteger `/dashboard`
- [ ] proteger `/stagiaires`
- [ ] rediriger les utilisateurs non connectes vers `/login`
- [ ] eviter l'acces a `/login` quand l'utilisateur est deja connecte
- [ ] verifier les redirections automatiques
- [ ] tester les cas anonymes

### Livrables

- routes protegees par middleware
- redirections fonctionnelles

---

## Jour 5 - RBAC

### Objectif

Appliquer les restrictions selon les roles.

### Taches

- [ ] definir les roles supportes dans l'authentification
- [ ] creer une fonction ou un helper `hasRole`
- [ ] limiter l'acces aux pages selon le role
- [ ] definir les premieres regles :
  - `ADMIN` acces global
  - `RH` acces dashboard et stagiaires
  - `ENCADRANT` acces a ses espaces
  - `STAGIAIRE` acces a ses espaces
- [ ] creer une page `acces refuse`
- [ ] verifier les cas de role incorrect
- [ ] verifier les cas de session invalide

### Livrables

- RBAC en place
- page d'acces refuse
- helpers de permissions de base

---

## Jour 6 - Audit et Tracabilite

### Objectif

Commencer la journalisation des actions d'authentification importantes.

### Taches

- [ ] creer une fonction de log pour `AuditLog`
- [ ] enregistrer les connexions reussies
- [ ] enregistrer les connexions refusees
- [ ] enregistrer les deconnexions si possible
- [ ] stocker au minimum :
  - utilisateur
  - action
  - date
  - contexte minimum disponible
- [ ] verifier que les logs sont bien crees en base

### Livrables

- journalisation minimale des connexions
- verification du stockage dans `AuditLog`

---

## Jour 7 - Tests et Stabilisation

### Objectif

Verifier que tout le sprint fonctionne proprement avant cloture.

### Taches

- [ ] tester le login avec les comptes seed
- [ ] tester un mauvais mot de passe
- [ ] tester un utilisateur inexistant
- [ ] tester un acces anonyme a `/dashboard`
- [ ] tester un acces anonyme a `/stagiaires`
- [ ] tester la redirection apres connexion
- [ ] tester la deconnexion
- [ ] tester les droits selon chaque role
- [ ] corriger les bugs detectes
- [ ] nettoyer le code et les fichiers inutiles
- [ ] verifier `npm run lint`
- [ ] verifier `npm run build`

### Livrables

- sprint stable
- bugs critiques corriges
- verification finale du sprint

---

## Backlog Technique du Sprint

### Fichiers probables a creer ou modifier

- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/api/auth/[...nextauth]/route.ts`
- [ ] `lib/auth.ts`
- [ ] `lib/prisma.ts`
- [ ] `middleware.ts`
- [ ] `types/next-auth.d.ts`
- [ ] composants UI lies au login
- [ ] composants de protection de route si necessaire

## Checklist Fonctionnelle

- [ ] login avec email et mot de passe
- [ ] session utilisateur active
- [ ] deconnexion
- [ ] redirection si non connecte
- [ ] redirection si deja connecte
- [ ] controle des roles
- [ ] page acces refuse
- [ ] audit log minimal

## Checklist Technique

- [ ] code propre et structure
- [ ] types TypeScript corrects
- [ ] Prisma utilise pour recuperer l'utilisateur
- [ ] aucun mot de passe en clair
- [ ] erreurs gerees proprement
- [ ] lint valide
- [ ] build valide

## Critere de Validation du Sprint

- [ ] les comptes seed peuvent se connecter
- [ ] l'utilisateur voit uniquement ce qu'il a le droit de voir
- [ ] les routes critiques sont protegees
- [ ] la base enregistre les logs essentiels
- [ ] le projet reste stable apres integration du module auth

## Sortie du Sprint

Si ce sprint est termine, alors le prochain sprint a lancer est :

### Sprint 2 - Gestion des Stagiaires

Objectif suivant :

- connecter la liste stagiaires a la base
- ajouter creation et modification stagiaire
- afficher la fiche detaillee
