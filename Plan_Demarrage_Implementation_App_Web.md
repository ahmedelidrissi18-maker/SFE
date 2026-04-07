# Plan de Demarrage de l'Implementation

## Objectif

Ce document transforme le cahier des charges `Cahier_des_Charges_Gestion_Stagiaires.md` en etapes concretes pour commencer l'implementation de l'application web de gestion des stagiaires.

Le projet part ici d'une base vide. L'objectif initial est de poser une architecture solide, puis de livrer rapidement un premier socle exploitable.

## 1. Relire et cadrer le perimetre reel

Avant de coder, il faut confirmer ce qui sera inclus dans la premiere version.

Actions a realiser :

- Identifier les modules obligatoires pour le MVP :
  - authentification
  - gestion des utilisateurs et roles
  - gestion des stagiaires
  - gestion des stages
  - rapports hebdomadaires
  - tableau de bord de base
- Reporter en phase 2 les modules plus complexes :
  - integration GitHub avancee
  - notifications temps reel
  - signature electronique
  - generation documentaire avancee
  - analytics pousses
- Valider les regles metier critiques :
  - un stagiaire ne doit avoir qu'un seul stage actif
  - les droits doivent etre controles par role
  - les rapports sont hebdomadaires et suivent un statut defini
  - les actions sensibles doivent etre tracees

Livrable :

- Une liste MVP / Hors MVP validee

## 2. Definir l'architecture technique de depart

Le cahier des charges propose deja une stack coherente. Pour commencer, il faut figer une version simple et executable localement.

Stack de depart recommandee :

- Frontend + Backend web : Next.js 14+ avec App Router et TypeScript
- Base de donnees : PostgreSQL
- ORM : Prisma
- Authentification : Auth.js / NextAuth
- UI : Tailwind CSS + shadcn/ui
- Validation : Zod
- Gestion des formulaires : react-hook-form
- Etat client : Zustand
- Data fetching : TanStack Query
- Cache / services futurs : Redis
- Stockage local de developpement : dossier local ou MinIO plus tard

Livrables :

- choix techniques confirmes
- convention de nommage
- conventions de branche Git

## 3. Preparer le repository et l'environnement

Initialiser le projet avec une base propre et industrialisable.

Etapes :

- Creer le projet Next.js avec TypeScript, ESLint et App Router
- Ajouter Tailwind CSS
- Initialiser shadcn/ui
- Installer Prisma et configurer PostgreSQL
- Ajouter un fichier `.env.example`
- Ajouter un `docker-compose.yml` pour PostgreSQL et Redis
- Configurer les scripts `dev`, `build`, `lint`, `test`
- Ajouter un README de lancement local

Livrables :

- application qui demarre en local
- base PostgreSQL accessible
- variables d'environnement documentees

## 4. Concevoir le modele de donnees

Avant les pages, il faut stabiliser le schema Prisma a partir du cahier des charges.

Entites a modeliser en premier :

- `User`
- `Stagiaire`
- `Stage`
- `Rapport`
- `Evaluation`
- `Document`
- `Notification`
- `AuditLog`
- `Presence`

Enums a definir :

- `Role`
- `StageStatus`
- `RapportStatus`
- `EvaluationType`
- `DocumentType`
- `PresenceStatus`

Travail attendu :

- ecrire le schema Prisma
- definir les relations et contraintes
- preparer une premiere migration
- creer un seed minimal :
  - 1 admin
  - 1 RH
  - 1 encadrant
  - 1 stagiaire

Livrables :

- `prisma/schema.prisma`
- premiere migration
- script de seed

## 5. Mettre en place l'authentification et le RBAC

L'authentification est le premier module fonctionnel a implementer, car tout le reste depend des roles.

Etapes :

- Configurer la connexion email + mot de passe
- Stocker les mots de passe avec hash securise
- Mettre en place la gestion de session
- Creer les roles :
  - ADMIN
  - RH
  - ENCADRANT
  - STAGIAIRE
- Proteger les routes via middleware
- Ajouter les pages :
  - `/login`
  - `/dashboard`
  - `/mon-profil`
- Journaliser les connexions importantes

Phase ulterieure :

- 2FA
- reset password par email
- verrouillage apres echecs

Livrables :

- login fonctionnel
- redirection selon le role
- routes protegees

## 6. Construire le squelette UI de l'application

Il faut rapidement disposer d'une interface navigable, meme si toutes les fonctions ne sont pas encore branchees.

A creer :

- layout principal dashboard
- sidebar selon le role
- header
- page dashboard
- page liste des stagiaires
- page fiche stagiaire
- page rapports
- page documents
- composants generiques :
  - table
  - formulaire
  - dialog de confirmation
  - badge de statut
  - cartes KPI

Livrables :

- navigation complete
- design system de base reutilisable

## 7. Implementer le premier module metier prioritaire

Le meilleur premier lot fonctionnel est :

1. CRUD Stagiaires
2. CRUD Stages
3. Affectation Encadrant
4. Liste + filtres + detail stagiaire

Fonctions minimales attendues :

- creer un stagiaire
- modifier un stagiaire
- archiver un stagiaire
- creer un stage
- associer un encadrant
- visualiser le statut du stage
- filtrer par departement, statut, encadrant

Livrables :

- module de gestion des stagiaires utilisable

## 8. Ajouter les rapports hebdomadaires

Une fois le module stagiaires/stages stable, implementer le suivi.

Etapes :

- formulaire de rapport hebdomadaire
- brouillon / soumission / validation / retour
- commentaire de l'encadrant
- affichage de l'avancement
- vue differenciee stagiaire / encadrant / RH

Livrables :

- cycle complet d'un rapport hebdomadaire

## 9. Preparer les fondations des modules avances

Sans tout livrer au debut, il faut preparer l'architecture pour eviter une refonte plus tard.

Fondations a anticiper :

- service GitHub separe
- couche de notifications
- service de generation PDF
- service de stockage de documents
- audit log centralise
- politique de permissions centralisee

Livrables :

- dossiers `lib/`, `services/` ou equivalent bien structures
- interfaces claires pour les integrations futures

## 10. Qualite, securite et outillage

A integrer des le debut :

- validation Zod sur les formulaires et API
- gestion des erreurs standardisee
- logs serveur
- audit des actions sensibles
- lint + format
- tests unitaires des fonctions critiques
- tests E2E sur les parcours principaux

Parcours critiques a tester en premier :

- connexion
- creation d'un stagiaire
- creation d'un stage
- soumission d'un rapport
- controle d'acces par role

## 11. Ordre de realisation recommande

Ordre pratique pour commencer :

1. Initialisation du repo et des outils
2. Schema Prisma + migrations + seed
3. Authentification + RBAC
4. Layout dashboard + navigation
5. CRUD Stagiaires
6. CRUD Stages
7. Rapports hebdomadaires
8. Documents
9. Notifications
10. GitHub API
11. Evaluations
12. Exports, PDF, analytics, optimisation

## 12. Decoupage du premier sprint

### Sprint 0 / Lancement technique

- initialiser Next.js
- configurer Tailwind, shadcn/ui, Prisma
- brancher PostgreSQL
- creer schema initial
- ajouter migration + seed
- preparer structure des dossiers

### Sprint 1 / Socle fonctionnel

- login
- roles
- middleware de protection
- layout dashboard
- gestion utilisateurs minimale
- page liste stagiaires vide reliee a la base

### Sprint 2 / Premier vertical slice utile

- creation stagiaire
- creation stage
- fiche stagiaire
- filtres et tableau

## 13. Structure de dossiers recommandee

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  features/
lib/
  auth/
  db/
  validations/
  permissions/
hooks/
store/
types/
prisma/
emails/
tests/
```

## 14. Premiere checklist executable

Checklist immediate pour commencer l'implementation :

- Creer le projet Next.js
- Installer Tailwind, shadcn/ui, Prisma, Zod, Auth.js
- Lancer PostgreSQL en local
- Ecrire le schema Prisma initial
- Generer la premiere migration
- Inserer les comptes de demo
- Creer la page `/login`
- Creer le layout `/dashboard`
- Mettre en place le middleware RBAC
- Creer la liste des stagiaires branchee a la base

## Conclusion

Le meilleur point de depart n'est pas de coder tous les modules a la fois, mais de construire un socle solide :

- base projet
- base de donnees
- authentification
- roles
- premier module metier

Une fois ces elements en place, le reste du cahier des charges peut etre implemente de maniere iterative sprint par sprint.
