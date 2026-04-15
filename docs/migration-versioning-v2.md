# Versioning API et migration DB reversible V2 (Sprint 0B)

Date : 2026-04-13

## 1. Strategie de versioning API

## Principe

- version majeure explicite dans les routes API publiques si rupture (`/api/v2/...`)
- evolutions compatibles en mineur (ajout de champs non obligatoires)
- deprecation annoncee avant suppression

## Regles

- breaking change : nouvelle version majeure API
- ajout retrocompatible : conserver compatibilite des contrats existants
- corrections : sans changement de contrat

## Versioning application (SemVer)

- `2.0.0-alpha.x` : increments de developpement internes
- `2.0.0-beta.x` : preproduction/recette
- `2.0.0` : release stable

## 2. Strategie de migration base de donnees (expand/contract)

## Etape Expand

- ajouter tables/colonnes/index sans supprimer l ancien schema
- rendre nouveaux champs optionnels au depart si necessaire
- deployer code compatible ancien + nouveau schema
- exemple lot Sprint 1 :
  - ajout des tables `GithubConnection` et `GithubSyncLog`
  - aucun retrait destructif sur le schema V1

## Etape Migrate

- backfill des donnees
- verification de coherence et controles de qualite

## Etape Contract

- suppression des structures legacy seulement apres validation post-release
- operation planifiee dans un sprint dedie si impact eleve

## 3. Rollback DB

- backup complet avant release V2
- point-in-time recovery active
- rollback applicatif via canary/feature flags en priorite
- restauration DB uniquement en cas de corruption ou perte de coherence

## 4. Definition of done technique Sprint 0B

- versioning API V2 documente
- strategie expand/contract documentee
- preconditions de rollback documentees
