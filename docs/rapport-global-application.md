# Rapport Global Application Web

Date : 2026-04-15

## Objectif

Donner une vision complete, a la fois fonctionnelle et technique, de l application web de gestion des stagiaires afin de faciliter :

- le pilotage produit
- la comprehension de l architecture
- la preparation du Sprint 6
- la recette, le deploiement et la maintenance

## Resume executif

L application est une plateforme web interne de gestion du cycle de vie des stagiaires. Elle couvre deja le socle V1 et la majeure partie de la V2 :

- authentification par email/mot de passe
- RBAC par role
- gestion des stagiaires
- gestion des stages
- rapports hebdomadaires
- notifications in-app et temps reel
- integration GitHub
- evaluations structurees
- workflow documentaire avance
- generation PDF standard
- analytics decisionnel

Etat courant :

- Sprints 0A a 5 : completes
- Sprint 6 : actif
- objectif du Sprint 6 : securite, qualite, release et rollback V2

## Vision produit

### Probleme adresse

Le produit centralise le suivi administratif, pedagogique et technique des stagiaires dans une seule application. Il remplace un suivi disperse entre feuilles Excel, documents manuels, notifications informelles et controles peu traces.

### Valeur metier

- fiabiliser le suivi RH
- donner de la visibilite aux encadrants
- offrir au stagiaire un parcours clair
- tracer les decisions et actions sensibles
- produire des documents standards
- fournir des KPI fiables aux profils de pilotage

## Roles metier

### `ADMIN`

- vision transverse sur toute l application
- acces a tous les modules de pilotage
- supervision globale des operations et des incidents fonctionnels

### `RH`

- gestion des stagiaires et des stages
- validation des rapports, evaluations et documents
- consultation analytics
- pilotage administratif et qualite de traitement

### `ENCADRANT`

- suivi quotidien des stages et rapports
- revue des evaluations
- suivi GitHub du stagiaire rattache
- consultation analytics sur son perimetre

### `STAGIAIRE`

- consultation de son espace
- soumission des rapports
- consultation des evaluations et documents autorises
- reception de notifications

## Parcours fonctionnels majeurs

### 1. Authentification et controle d acces

- page publique : `/login`
- session JWT via NextAuth
- middleware de protection global dans `proxy.ts`
- refus d acces centralise vers `/acces-refuse`

### 2. Gestion des stagiaires

- creation, edition, consultation
- rattachement a un stage
- fiche detaillee avec synthese du stage courant
- syntheses GitHub et evaluations visibles depuis la fiche

### 3. Gestion des stages

- creation et edition de stage
- affectation d encadrant
- filtrage par statut et departement
- suivi des echeances et des stages actifs

### 4. Rapports hebdomadaires

- creation d un rapport rattache a un stage
- workflow : `BROUILLON` -> `SOUMIS` -> `VALIDE` ou `RETOURNE`
- suivi de l avancement et commentaires encadrant

### 5. Notifications

- notifications persistantes en base
- badge et centre de notifications
- flux SSE temps reel
- preferences par type d evenement
- file de dispatch pour les traitements plus lourds

### 6. Integration GitHub

- liaison d un compte GitHub a un stagiaire
- OAuth GitHub ou fallback manuel par username
- synthese par stagiaire
- journalisation des synchronisations et erreurs

### 7. Evaluations

- types : debut de stage, mi-parcours, fin de stage
- workflow : `BROUILLON`, `SOUMIS`, `VALIDE`, `RETOURNE`
- notation structuree et historique des revisions
- validation RH

### 8. Documents et PDF

- depot documentaire
- workflow : `DEPOSE`, `EN_VERIFICATION`, `VALIDE`, `REJETE`
- audit des actions sensibles
- generation PDF standard : attestation, fiche recapitulative, rapport consolide

### 9. Analytics

- dashboard decisionnel par role
- filtres temporels : hebdo, mensuel, trimestriel
- vues detaillees par departement et vigilance
- export CSV `overview`, `detailed` et `departments`
- observabilite des chargements et exports

## Stack technique

- framework web : Next.js 16 App Router
- langage : TypeScript
- UI : React 19 + Tailwind CSS 4
- auth : NextAuth beta avec credentials
- ORM : Prisma 6
- base de donnees : PostgreSQL
- outillage de dev local : Docker Compose
- tests : Vitest
- charge : Artillery

## Architecture applicative

### Couches principales

- `app/` : pages, routes API, server actions
- `components/` : UI et composants fonctionnels
- `lib/` : coeur metier, helpers, services, RBAC, audit, analytics
- `prisma/` : schema, migrations, seed
- `docs/` : cadrage, strategie, modules V2 et exploitation
- `tests/` : tests unitaires, integration legere, smoke et observabilite

### Mode de fonctionnement

- rendu majoritairement server-side avec App Router
- logique metier centralisee dans `lib/`
- interactions serveur via routes API et server actions
- separation assez nette entre presentation, validation et logique domaine

### Integrations externes

- GitHub API pour le suivi technique
- PostgreSQL pour la persistence
- Redis provisionne dans `docker-compose.yml`

Inference depuis le code :

- Redis est disponible dans l environnement local, mais le mecanisme temps reel actuellement code est en memoire de process via `lib/realtime-notifications.ts`
- cela reste acceptable pour du mono-process local/interne, mais sera a durcir pour une diffusion multi-instance

## Inventaire des routes UI

### Routes publiques

- `/`
- `/login`
- `/acces-refuse`

### Dashboard et modules proteges

- `/dashboard`
- `/analytics`
- `/stagiaires`
- `/stagiaires/nouveau`
- `/stagiaires/[id]`
- `/stagiaires/[id]/modifier`
- `/stagiaires/[id]/stage/nouveau`
- `/stagiaires/[id]/github`
- `/stages`
- `/stages/[id]/modifier`
- `/rapports`
- `/rapports/nouveau`
- `/rapports/[id]`
- `/evaluations`
- `/evaluations/nouvelle`
- `/evaluations/[id]`
- `/documents`
- `/documents/[id]`
- `/notifications`

## Inventaire des endpoints API

- `/api/auth/[...nextauth]`
- `/api/health`
- `/api/github/connect`
- `/api/github/callback`
- `/api/notifications/stream`
- `/api/notifications/process`
- `/api/documents/[id]`
- `/api/analytics/export`

## RBAC actuel

### Acces par module

- `/dashboard` : `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`
- `/analytics` : `ADMIN`, `RH`, `ENCADRANT`
- `/stagiaires` : `ADMIN`, `RH`
- `/stages` : `ADMIN`, `RH`, `ENCADRANT`
- `/rapports` : `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`
- `/evaluations` : `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`
- `/documents` : `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`
- `/notifications` : `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`

### Point fort

Le controle d acces est defini a la fois :

- au niveau du middleware global
- au niveau des ecrans et actions metier
- au niveau de plusieurs validations et helpers RBAC

## Modele de donnees

### Enums principaux

- `Role`
- `StageStatus`
- `RapportStatus`
- `EvaluationType`
- `EvaluationStatus`
- `DocumentType`
- `DocumentStatus`
- `DocumentSource`
- `SignatureStatus`
- `PdfGenerationStatus`
- `GithubSyncStatus`
- `NotificationDispatchStatus`

### Modeles principaux

- `User`
- `Stagiaire`
- `Stage`
- `Rapport`
- `Evaluation`
- `EvaluationRevision`
- `Document`
- `PdfGenerationJob`
- `Notification`
- `NotificationPreference`
- `NotificationDispatchJob`
- `AuditLog`
- `Presence`
- `GithubConnection`
- `GithubSyncLog`

### Lecture metier du schema

- un `User` porte l identite et le role
- un `Stagiaire` enrichit un utilisateur de type stagiaire
- un `Stage` relie un stagiaire a un encadrant sur une periode
- un `Rapport` suit la progression hebdomadaire du stage
- une `Evaluation` formalise les points d etape
- un `Document` gere la couche administrative et documentaire
- les modeles `Github*`, `Notification*`, `PdfGenerationJob` et `AuditLog` couvrent les besoins V2 transverses

## Jeu de donnees de demonstration

Le seed prepare un environnement deja riche :

- plusieurs utilisateurs pour chaque role
- 8 stagiaires
- plusieurs stages actifs, planifies, termines, annules ou suspendus
- rapports multi-statut
- evaluations avec revisions
- documents
- notifications
- journaux d audit

Ce seed rend l application directement exploitable pour la recette, les demos et le test fonctionnel manuel.

## Observabilite et audit

### Audit

Les actions sensibles sont journalisees dans `AuditLog`, notamment :

- login
- operations GitHub
- operations sur documents
- operations sur stages, stagiaires, rapports et evaluations

### Observabilite

Le module analytics dispose d une premiere couche d observabilite :

- suivi des temps de chargement
- suivi des exports
- p95 et alertes de budget
- endpoint `/api/health`

## Qualite logicielle et verification

### Outils

- lint : ESLint
- tests : Vitest
- smoke V1 critique : Vitest
- charge baseline : Artillery

### Etat actuel constate

Le depot contient des tests pour :

- RBAC
- helpers metier stagiaires, stages, rapports, documents, evaluations
- validations Zod
- routes GitHub
- notifications temps reel
- route de traitement des notifications
- analytics
- observabilite
- smoke critique V1

### Gap qualite encore ouvert pour Sprint 6

Le plan V2 cible aussi :

- E2E Playwright sur parcours critiques
- couverture Sprint 6 a >= 80%
- campagne de non-regression plus large

Inference depuis le depot :

- la strategie mentionne Playwright, mais aucune suite E2E partagee n est encore visible dans le code source

## Securite actuelle

### Deja present

- authentification par credentials
- session JWT NextAuth
- RBAC centralise
- audit des actions sensibles
- protection des routes par middleware
- controle d acces sur plusieurs parcours documents/evaluations/GitHub

### Prepare mais non finalise

- champ `twoFactorEnabled` deja present dans `User`
- backlog V2 et Sprint 6 mentionnent 2FA, brute-force, hardening session et rollback

### A finaliser dans le Sprint 6

- 2FA pour profils sensibles
- protection brute-force / rate limiting login et endpoints sensibles
- durcissement session
- revue des surfaces d exposition API
- eventuelle strategie multi-instance pour le temps reel

## Variables d environnement et configuration

### Requises

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Utiles selon modules

- `DEFAULT_USER_PASSWORD`
- `NOTIFICATIONS_PROCESSOR_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_API_BASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `REDIS_URL`

## Exploitation et deploiement

### Local / integration

- Postgres et Redis via Docker Compose
- Prisma pour migrations et seed
- build production valide

### Docs existantes

- `docs/DEPLOIEMENT_V1.md`
- `docs/RECETTE_V1.md`
- `docs/migration-versioning-v2.md`

### Docs ouvertes pour Sprint 6

- `docs/release-v2.md`
- `docs/rollback-v2.md`

## Avancement global par sprint

- Sprint 0A : cadrage metier, KPI, backlog
- Sprint 0B : architecture, contrats, qualite de base
- Sprint 1 : integration GitHub
- Sprint 2 : notifications temps reel
- Sprint 3 : evaluations
- Sprint 4 : documents avances et PDF
- Sprint 5 : analytics et performance
- Sprint 6 : securite, qualite finale et release V2

## Forces actuelles de l application

- bonne couverture fonctionnelle end-to-end sur le coeur metier
- architecture claire pour un produit Next.js interne
- centralisation reussie des regles metier dans `lib/`
- seed riche et utile pour demonstrations/recette
- observabilite deja amorcee
- documentation V2 deja bien structuree

## Points d attention

- 2FA non branchee fonctionnellement a ce stade
- absence visible d une suite E2E Playwright partagee
- transport temps reel encore en memoire de process
- Sprint 6 encore a realiser sur les axes hardening/release/rollback

## Priorites recommandees pour le Sprint 6

### Priorite 1

- finaliser la securite auth : 2FA, brute-force, durcissement session

### Priorite 2

- completer la verification finale : E2E, non-regression, charge ciblee

### Priorite 3

- finaliser le runbook release, le plan rollback et le go/no-go de mise en production V2

## Conclusion

L application est deja une plateforme web tres avancee et exploitable. Le coeur produit est en place, les modules V2 majeurs sont livres, et le Sprint 6 doit maintenant transformer cet ensemble fonctionnel en release V2 robuste, securisee et industrialisable.
