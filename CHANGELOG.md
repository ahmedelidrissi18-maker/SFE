# Changelog

Toutes les evolutions notables du projet sont documentees dans ce fichier.

Le format suit Keep a Changelog et SemVer.

## [Unreleased]

## [Sprint 6 - 2026-04-15]

### Added

- rapport global de l application : `docs/rapport-global-application.md`
- runbook release V2 initial : `docs/release-v2.md`
- plan rollback V2 initial : `docs/rollback-v2.md`
- migration SQL Sprint 6 : `prisma/migrations/0008_security_hardening/migration.sql`
- module de securite compte : `app/(dashboard)/securite/page.tsx`
- actions serveur 2FA : `app/(dashboard)/securite/actions.ts`
- helpers securite Sprint 6 : `lib/security/password-policy.ts`, `lib/security/rate-limit.ts`, `lib/security/request.ts`, `lib/security/two-factor.ts`
- tests Sprint 6 : `tests/auth-validation.test.ts`, `tests/password-policy.test.ts`, `tests/rate-limit.test.ts`, `tests/two-factor.test.ts`

### Changed

- README complete avec l ouverture du Sprint 6
- plan V2 complete avec le statut courant du Sprint 6
- authentification credentials durcie avec 2FA TOTP optionnel pour `ADMIN` et `RH`
- session NextAuth reduite a 8 h avec rotation plus frequente
- endpoints sensibles proteges par limitation de debit cote serveur
- dashboard et navigation enrichis avec le module `/securite`

## [Sprint 5 - 2026-04-13]

### Added

- module analytics initial : `lib/analytics.ts`
- page decisionnelle `/analytics` avec filtre de periode
- export CSV dedie : `app/api/analytics/export/route.ts`
- export CSV departements et filtres detail supplementaires
- migration SQL de performance analytics : `prisma/migrations/0007_analytics_performance_indexes/migration.sql`
- couverture Vitest Sprint 5 : `tests/analytics-helpers.test.ts`, `tests/observability.test.ts`, `tests/analytics-export-route.test.ts`

### Changed

- navigation et RBAC enrichis avec le module `/analytics`
- page `/analytics` enrichie avec filtres departement, vigilance et volume
- observabilite analytics completee avec telemetry des exports et alertes associees
- README complete avec la cloture du Sprint 5

## [Sprint 4 - 2026-04-13]

### Added

- workflow documentaire avance sur `Document` avec statuts, source, revue et signature
- migration SQL : `prisma/migrations/0006_documents_workflow_pdf/migration.sql`
- service PDF initial : `lib/pdf-service.ts`
- validations workflow/PDF : `lib/validations/document.ts`
- pages documents : `app/(dashboard)/documents/page.tsx`, `app/(dashboard)/documents/[id]/page.tsx`
- composants workflow documents : `components/features/documents/document-review-form.tsx`, `components/features/documents/pdf-generation-form.tsx`
- documentation Sprint 4 : `docs/document-workflow-v2.md`, `docs/pdf-service-v2.md`
- tests Sprint 4 : `tests/document-validation.test.ts`

### Changed

- fiche stagiaire relie maintenant les documents vers leur detail et expose leur statut
- navigation et RBAC enrichis avec le module `/documents`
- l endpoint `/api/documents/[id]` audite les telechargements sensibles
- `DOCUMENT_REJECTED` pointe maintenant vers le detail du document concerne

## [Sprint 3 - 2026-04-13]

### Added

- extension Prisma du module evaluations avec statuts, planification, score et historique
- migration SQL : `prisma/migrations/0005_evaluations_workflow/migration.sql`
- helpers metier du workflow evaluations : `lib/evaluations.ts`
- validations Zod des evaluations : `lib/validations/evaluation.ts`
- actions serveur : `app/(dashboard)/evaluations/actions.ts`
- pages dediees : `app/(dashboard)/evaluations/page.tsx`, `app/(dashboard)/evaluations/nouvelle/page.tsx`, `app/(dashboard)/evaluations/[id]/page.tsx`
- composants formulaire et validation RH : `components/features/evaluations/evaluation-form.tsx`, `components/features/evaluations/evaluation-review-form.tsx`
- documentation Sprint 3 : `docs/evaluations-workflow.md`
- tests Sprint 3 : `tests/evaluation-helpers.test.ts`, `tests/evaluation-validation.test.ts`

### Changed

- navigation et RBAC enrichis avec le module `/evaluations`
- fiche stagiaire enrichie avec la synthese des evaluations du stage courant
- notifications `EVALUATION_SCHEDULED` desormais branchees sur la planification d evaluation

## [Sprint 2 - 2026-04-13]

### Added

- preferences de notifications : `NotificationPreference`
- migration SQL : `prisma/migrations/0003_notification_preferences_realtime/migration.sql`
- file persistante de dispatch : `NotificationDispatchJob`
- migration SQL : `prisma/migrations/0004_notification_dispatch_queue/migration.sql`
- endpoint SSE : `app/api/notifications/stream/route.ts`
- endpoint de traitement de file : `app/api/notifications/process/route.ts`
- bus temps reel en memoire : `lib/realtime-notifications.ts`
- service notifications temps reel : `lib/notification-service.ts`
- composants live : `components/features/notifications/live-notification-link.tsx`, `components/features/notifications/live-notifications-listener.tsx`
- documentation Sprint 2 : `docs/realtime-notifications.md`
- tests realtime : `tests/realtime-notifications.test.ts`
- tests route processeur de notifications : `tests/notifications-process-route.test.ts`

### Changed

- centre de notifications enrichi avec preferences utilisateur et rafraichissement live
- badge header branche sur le flux SSE
- synchronisation GitHub publie maintenant des notifications temps reel
- contrats services V2 et strategie de tests completes pour Sprint 2
- fan-out lourd route via une file persistante avec retry simple

## [Sprint 1 - 2026-04-13]

### Added

- schema Prisma initial GitHub : `GithubConnection` et `GithubSyncLog`
- migration SQL : `prisma/migrations/0002_github_sync_core/migration.sql`
- contrat technique V2 en code : `lib/services/contracts.ts`
- service GitHub encapsule : `lib/github/service.ts`
- validations GitHub : `lib/validations/github.ts`
- actions serveur liaison/synchronisation GitHub : `app/(dashboard)/stagiaires/github-actions.ts`
- carte GitHub sur la fiche stagiaire : `components/features/github/github-integration-card.tsx`
- documentation Sprint 1 : `docs/github-integration.md`
- tests GitHub : `tests/github-service.test.ts`, `tests/github-validation.test.ts`
- routes OAuth GitHub : `app/api/github/connect/route.ts`, `app/api/github/callback/route.ts`
- page dediee synthese GitHub : `app/(dashboard)/stagiaires/[id]/github/page.tsx`
- tests OAuth GitHub : `tests/github-oauth.test.ts`
- tests de routes GitHub et refus RBAC : `tests/github-connect-route.test.ts`, `tests/github-callback-route.test.ts`

### Changed

- fiche stagiaire enrichie avec liaison GitHub, synthese de synchronisation et feedback utilisateur
- README complete avec variables GitHub et etat du kickoff Sprint 1
- flux GitHub complete avec OAuth securise, fallback manuel et synthese dediee par stagiaire

## [Sprint 0B - 2026-04-13]

### Added

- scenario Artillery baseline : `tests/load/baseline.yml`
- script npm `test:load:baseline`
- documentation strategie de tests V2 : `docs/testing-strategy-v2.md`
- documentation contrats techniques V2 : `docs/service-contracts-v2.md`
- documentation migration/versioning V2 : `docs/migration-versioning-v2.md`
- contrats techniques V2 formalises en code : `lib/services/contracts.ts`

### Changed

- pipeline CI enrichi avec demarrage local de l app et execution Artillery baseline
- README complete avec les livrables Sprint 0B
- verification locale executee : lint, tests, build, baseline Artillery

## [Sprint 0A - 2026-04-13]

### Added

- pipeline CI GitHub Actions (`.github/workflows/ci.yml`) avec lint, tests, smoke, build
- smoke test automatise V1 : `tests/smoke-v1-critical.test.ts`
- script npm `test:smoke`
- documentation baseline V1 : `docs/v1-baseline.md`
- catalogue KPI V2 : `docs/kpi-catalog-v2.md`
- backlog V2 priorise : `docs/backlog-v2.md`
- architecture cible V2 : `docs/architecture-v2.md`

### Changed

- README mis a jour avec roadmap V2, CI non-regression, conventions de branches et versioning V2
