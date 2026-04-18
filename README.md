# Gestion des Stagiaires

Socle initial d'une application web de gestion des stagiaires basee sur :

- Next.js (App Router)
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS

## Demarrage rapide

1. Installer les dependances

```bash
npm install
```

2. Copier le fichier d'environnement

```bash
copy .env.example .env
```

3. Demarrer PostgreSQL et Redis avec Docker Compose

```bash
docker compose up -d
```

4. Generer le client Prisma

```bash
npm run prisma:generate
```

5. Appliquer la premiere migration

```bash
npm run prisma:migrate
```

6. Inserer les donnees de demo

```bash
npm run db:seed
```

7. Lancer l'application

```bash
npm run dev
```

Configuration GitHub optionnelle pour le debut du Sprint 1 :

- `GITHUB_TOKEN` : augmente le quota API GitHub pour les synchronisations
- `GITHUB_API_BASE_URL` : utile si vous ciblez un GitHub Enterprise
- `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` : reserves au branchement OAuth complet

Configuration securite Sprint 6 :

- `TWO_FACTOR_ISSUER` : libelle affiche dans l application d authentification
- `TWO_FACTOR_ENCRYPTION_SECRET` : secret dedie au chiffrement des secrets 2FA
  - si vide, `NEXTAUTH_SECRET` est reutilise

Application :

- Frontend : `http://localhost:3000`
- PostgreSQL : `localhost:5432`
- Redis : `localhost:6379`

## Scripts utiles

- `npm run dev` : lance Next.js en developpement
- `npm run build` : build de production
- `npm run lint` : verifie le code
- `npm test` : lance la suite Vitest
- `npm run test:smoke` : lance le smoke test V1 (login/dashboard/stagiaires/RBAC)
- `npm run test:load:baseline` : lance le scenario de charge baseline Artillery
- `npm run prisma:generate` : genere le client Prisma
- `npm run prisma:migrate` : cree/applique les migrations
- `npm run prisma:studio` : ouvre Prisma Studio
- `npm run db:seed` : charge les donnees de demonstration
- `npm run db:up` : demarre PostgreSQL et Redis
- `npm run db:down` : arrete PostgreSQL et Redis

## Structure initiale

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  layout/
  ui/
lib/
prisma/
public/
types/
```

## Comptes de demonstration

Le seed cree ces utilisateurs :

- `admin@stagiaires.local`
- `rh@stagiaires.local`
- `encadrant@stagiaires.local`
- `stagiaire@stagiaires.local`

Mot de passe de demo :

```text
valeur de DEFAULT_USER_PASSWORD
```

## Etat actuel

Le socle V1 couvre deja :

- authentification par email et mot de passe
- protection des routes par role
- gestion des stagiaires
- gestion des stages avec affectation d encadrant
- rapports hebdomadaires avec workflow brouillon / soumis / valide / retourne
- documents de stage avec televersement et telechargement securises
- notifications in-app avec badge et centre de lecture
- dashboard relie aux donnees reelles
- validations metier et premiers tests Vitest

## Roadmap V2

La V1 est stabilisee. Le cycle actif est la V2, demarree par `Sprint 0A`.
Le sprint en cours est maintenant `Sprint 6 - Hardening Securite, Qualite et Release V2`.

Priorites V2 :

- integration GitHub
- notifications temps reel
- evaluations structurees
- workflow documentaire avance + PDF
- analytics metier et performance
- securite renforcee

Livrables de cadrage disponibles :

- baseline V1 : `docs/v1-baseline.md`
- backlog V2 : `docs/backlog-v2.md`
- catalogue KPI V2 : `docs/kpi-catalog-v2.md`
- architecture cible V2 : `docs/architecture-v2.md`
- contrats services V2 : `docs/service-contracts-v2.md`
- migration/versioning V2 : `docs/migration-versioning-v2.md`
- strategie de tests V2 : `docs/testing-strategy-v2.md`
- integration GitHub (Sprint 1) : `docs/github-integration.md`
- notifications temps reel (Sprint 2) : `docs/realtime-notifications.md`
- evaluations et workflow (Sprint 3) : `docs/evaluations-workflow.md`
- workflow documentaire (Sprint 4) : `docs/document-workflow-v2.md`
- service PDF (Sprint 4) : `docs/pdf-service-v2.md`
- rapport global application : `docs/rapport-global-application.md`
- runbook release V2 : `docs/release-v2.md`
- plan rollback V2 : `docs/rollback-v2.md`

## CI non-regression

Un pipeline GitHub Actions est configure dans `.github/workflows/ci.yml` et execute automatiquement :

- `npm run lint`
- `npm test`
- `npm run test:smoke`
- `npm run build`
- `npm run test:load:baseline`

Le pipeline doit etre vert avant tout merge vers `main` (via regle de protection de branche GitHub).

## Avancement Sprint 1

Le Sprint 1 est termine avec :

- persistance dediee : `GithubConnection` et `GithubSyncLog`
- contrat technique en code : `lib/services/contracts.ts`
- service GitHub encapsule : `lib/github/service.ts`
- liaison GitHub securisee via OAuth : `/api/github/connect` et `/api/github/callback`
- fallback manuel par username si l OAuth n est pas encore disponible
- synthese GitHub sur la fiche stagiaire et page dediee `/stagiaires/[id]/github`
- journalisation des liaisons, flux OAuth et synchronisations dans `AuditLog`
- gestion des erreurs de quota et d indisponibilite API

Pour activer l OAuth GitHub :

- renseigner `GITHUB_CLIENT_ID`
- renseigner `GITHUB_CLIENT_SECRET`
- appliquer la migration Prisma `0002_github_sync_core`

Pour de meilleurs quotas de synchronisation serveur, ajouter aussi `GITHUB_TOKEN`.

## Avancement Sprint 2

Le Sprint 2 est termine avec :

- preferences de notifications par type d evenement
- endpoint SSE `/api/notifications/stream`
- badge notifications live dans le header
- centre de notifications et dashboard rafraichis sur evenement live
- branchement des evenements rapports et GitHub
- file persistante de dispatch : `NotificationDispatchJob`
- retry simple pour les notifications lourdes
- endpoint de traitement de file : `/api/notifications/process`
- types d evenements prepares pour `evaluation planifiee` et `document rejete`

Pour activer ce lot completement :

- appliquer la migration Prisma `0003_notification_preferences_realtime`
- appliquer la migration Prisma `0004_notification_dispatch_queue`

Pour piloter le traitement de file hors session admin/RH :

- renseigner `NOTIFICATIONS_PROCESSOR_SECRET`

## Avancement Sprint 3

Le Sprint 3 est termine avec :

- extension du schema Prisma des evaluations avec statuts, score, planification et historique
- migration `0005_evaluations_workflow`
- module `/evaluations` avec liste, creation, detail, edition et validation RH
- grilles de notation versionnees en code et calculees cote serveur
- historique des revisions via `EvaluationRevision`
- synthese des evaluations sur la fiche stagiaire
- branchement des notifications `EVALUATION_SCHEDULED`
- couverture Vitest sur helpers, validations et RBAC du module

Pour activer ce lot completement :

- appliquer la migration Prisma `0005_evaluations_workflow`

## Avancement Sprint 4

Le Sprint 4 est termine avec :

- workflow documentaire avance sur `Document` avec statuts de depot, verification, validation et rejet
- vue dediee `/documents` et detail `/documents/[id]`
- revue documentaire avec audit et notification `DOCUMENT_REJECTED`
- telechargement securise avec audit des documents sensibles
- generation PDF standard initiale : attestation, fiche recapitulative, rapport consolide
- socle de signature electronique avec statuts internes et reference de signature

Pour activer ce lot completement :

- appliquer la migration Prisma `0006_documents_workflow_pdf`

## Avancement Sprint 5

Le Sprint 5 est termine avec :

- page decisionnelle `/analytics` avec filtre hebdo, mensuel et trimestriel
- KPI centralises cote serveur pour rapports, evaluations, documents et stages
- vue par role pour `ADMIN`, `RH` et `ENCADRANT`
- progression moyenne par departement sur la fenetre selectionnee
- vues detaillees filtrables par departement, vigilance et volume
- exports CSV `overview`, `detailed` et `departments` via `/api/analytics/export`
- observabilite analytics sur chargements et exports avec alertes de budget
- index SQL dedies aux requetes Sprint 5
- couverture Vitest Sprint 5 sur analytics, observabilite et route d export

Pour activer le lot completement :

- appliquer la migration Prisma `0007_analytics_performance_indexes`

## Avancement Sprint 6

Le Sprint 6 couvre maintenant un lot fonctionnel de hardening securite :

- rapport global centralise de l application : `docs/rapport-global-application.md`
- runbook release V2 : `docs/release-v2.md`
- plan rollback V2 : `docs/rollback-v2.md`
- page securite `/securite` pour `ADMIN` et `RH`
- 2FA TOTP active pour les profils sensibles quand configuree
- protection anti brute-force sur le login et plusieurs routes sensibles
- durcissement de session NextAuth avec fenetre reduite et rotation plus frequente
- couverture Vitest Sprint 6 sur 2FA, rate limit, validation auth et route sensible

Priorites Sprint 6 restantes :

- finalisation de la non-regression et des tests critiques V2
- rehearsal de rollback et validation go/no-go

Pour activer ce lot completement :

- appliquer la migration Prisma `0008_security_hardening`
- definir `NEXTAUTH_SECRET` en production
- definir `TWO_FACTOR_ENCRYPTION_SECRET` en production si vous ne souhaitez pas reutiliser `NEXTAUTH_SECRET`

## Branching et versioning V2

- prefixes de branches :
  - `feature/`
  - `fix/`
  - `chore/`
- versioning semantique :
  - `2.0.0-alpha.x`
  - `2.0.0-beta.x`
  - `2.0.0`

## Documentation de livraison

- recette manuelle : `docs/RECETTE_V1.md`
- procedure de deploiement : `docs/DEPLOIEMENT_V1.md`
