# Architecture cible V2

Date : 2026-04-13

## Objectif

Decrire l architecture cible pour les modules V2 en limitant le risque de regression sur la V1.

## Principes directeurs

- conserver la separation front/back via App Router et server actions
- centraliser les regles metier dans `lib/` et modules de services dedies
- privilegier une architecture evolutive (interfaces stables, implementation interchangeable)
- ajouter une observabilite minimum par module V2

## Modules cibles V2

### 1. Service GitHub

- role : synchroniser activites techniques (repos, commits, PR, issues)
- points d integration : liaison compte stagiaire, vues dashboard stagiaire, audit
- exigences : gestion des quotas, retry/backoff, mode degrade

### 2. Service Notifications Temps Reel

- role : diffuser les evenements critiques sans rechargement de page
- evenements initiaux : rapports, evaluations, documents, sync GitHub
- exigences : delivery fiable, idempotence, fallback degrade

### 3. Module Evaluations

- role : workflow des evaluations (brouillon/soumis/valide/retourne)
- exigences : transitions strictes cote serveur, historique des revisions, RBAC fort

### 4. Service Documents + PDF

- role : workflow documentaire et generation PDF standards
- exigences : audit des actions sensibles, securisation acces fichiers, execution asynchrone des rendus lourds

### 5. Dashboard Analytics

- role : exposer des KPI fiables par role
- exigences : source de calcul unique, performances stables, export CSV

## Socle qualite et non-regression

- CI obligatoire sur PR : lint + tests unitaires + smoke V1 + build
- smoke test V1 automatise pour login/dashboard/stagiaires/RBAC
- seuils de couverture V2 appliques sprint par sprint

## Strategie de migration base de donnees

- adopter le schema `expand/contract`
- eviter les operations destructives dans la meme release que les ajouts
- preparer scripts et procedure rollback avant mise en production

## Decisions techniques verrouillees pour lancer Sprint 0B

- CI obligatoire sur PR avec gates `lint`, `test`, `test:smoke`, `build`
- smoke V1 base sur Vitest (sans dependance E2E navigateur)
- non-regression V1 maintenue comme prerequis a chaque merge
- branches V2 normalisees (`feature/`, `fix/`, `chore/`)
- versioning pre-release V2 en `2.0.0-alpha.x` puis `2.0.0-beta.x`

## Conventions de branches V2

- `feature/<scope>-<short-description>` pour nouvelles fonctions
- `fix/<scope>-<short-description>` pour corrections
- `chore/<scope>-<short-description>` pour maintenance/outillage

Exemples :

- `feature/github-sync-core`
- `fix/rbac-stagiaire-access`
- `chore/ci-smoke-v1`

## Strategie de versioning V2

- pre-release alpha : `2.0.0-alpha.x`
- pre-release beta : `2.0.0-beta.x`
- release finale : `2.0.0`

Regles :

- breaking change : incremente la version majeure
- ajout retrocompatible : incremente la version mineure
- correctif retrocompatible : incremente la version patch
