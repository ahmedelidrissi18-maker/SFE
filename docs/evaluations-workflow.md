# Evaluations et Workflow de Validation (Sprint 3)

## Objectif

Structurer les evaluations du stagiaire autour d un cycle serveur trace et exploitable :

- types d evaluation : `DEBUT_STAGE`, `MI_PARCOURS`, `FINAL`
- workflow : `BROUILLON` -> `SOUMIS` -> `VALIDE` ou `RETOURNE`
- historique de revisions et journalisation dans `AuditLog`
- synthese visible depuis la fiche stagiaire et le module `/evaluations`

## Schema Prisma

Le Sprint 3 etend `Evaluation` avec :

- `status`
- `gridVersion`
- `criteriaSnapshot`
- `notes`
- `totalScore` et `maxScore`
- `scheduledFor`
- `commentaireEncadrant`
- `commentaireRh`
- marqueurs de workflow (`submittedAt`, `validatedAt`, `returnedAt`, etc.)

Une nouvelle table `EvaluationRevision` historise chaque action metier :

- creation
- mise a jour de brouillon
- soumission
- validation
- retour

Migration associee :

- `prisma/migrations/0005_evaluations_workflow/migration.sql`

## Regles metier

- un stage ne peut avoir qu une evaluation par type
- seules les evaluations `BROUILLON` et `RETOURNE` sont modifiables
- seules les evaluations `SOUMIS` sont validables ou retournables
- les roles `ADMIN` et `RH` peuvent gerer tout le perimetre
- un `ENCADRANT` ne peut modifier que les evaluations des stages qui lui sont affectes
- un `STAGIAIRE` peut consulter uniquement les evaluations de son propre stage

## Grilles d evaluation

Les grilles par defaut sont versionnees en code dans `lib/evaluations.ts`.

Chaque grille embarque :

- un `label`
- une `description`
- une liste de criteres avec `id`, `label`, `description`, `maxScore`

Le snapshot de grille est stocke dans `criteriaSnapshot` afin de figer le referentiel utilise au moment de l evaluation.

## Ecrans livres

- liste des evaluations : `/evaluations`
- creation d evaluation : `/evaluations/nouvelle`
- detail + edition + validation : `/evaluations/[id]`
- synthese par stagiaire dans `/stagiaires/[id]`

## Notifications

Le Sprint 2 preparait l evenement `EVALUATION_SCHEDULED`.

Le Sprint 3 le branche maintenant lors de la planification ou replanification d une evaluation avec date :

- destinataires : encadrant affecte + roles `ADMIN`/`RH` actifs, hors auteur courant
- passage par la file persistante `NotificationDispatchJob`

## Tests couverts

- helpers de score, statuts et droits : `tests/evaluation-helpers.test.ts`
- validations Zod : `tests/evaluation-validation.test.ts`
- RBAC route `/evaluations` : `tests/rbac.test.ts`

## Suites recommandees

1. ajouter un parcours Playwright complet encadrant -> RH -> feedback
2. enrichir le seed avec un lot d evaluations de demonstration
3. mesurer le KPI de completion des evaluations sur un lot pilote
