# Integration GitHub (Sprint 1)

Date : 2026-04-13

## Objectif du sprint

Relier les stages techniques a GitHub sans casser la V1 :

- lier un compte GitHub a un stagiaire
- exploiter le depot GitHub deja renseigne sur le stage
- synchroniser les activites techniques recentes
- journaliser les actions et erreurs de synchronisation

## Perimetre implemente

### 1. Persistance

- `GithubConnection`
  - liaison unique stagiaire <-> compte GitHub
  - metadonnees du profil GitHub
  - etat de la derniere synchronisation
- `GithubSyncLog`
  - historisation de chaque synchronisation
  - compteurs : repositories, commits, pull requests, issues
  - payload technique recent pour alimenter la vue stagiaire

### 2. Service GitHub

Le service est centralise dans `lib/github/service.ts` et respecte le contrat code suivant :

- `connectAccount(stagiaireId, username, linkedByUserId)`
- `syncActivity(stagiaireId, actorUserId)`
- `getSummary(stagiaireId)`

Le contrat transverse des services V2 est regroupe dans `lib/services/contracts.ts`.

### 3. Flux OAuth GitHub

Le Sprint 1 inclut maintenant un flux OAuth dedie pour la liaison securisee :

- point d entree : `/api/github/connect?stagiaireId=...`
- callback : `/api/github/callback`
- controles :
  - session applicative requise
  - roles autorises : `ADMIN`, `RH`
  - verification `state`
  - nettoyage du cookie temporaire apres callback

Si l OAuth n est pas configure, un fallback manuel par username reste disponible dans l interface.

### 4. Experience utilisateur

La fiche stagiaire expose une carte GitHub pour les roles `ADMIN` et `RH` :

- liaison OAuth GitHub
- liaison fallback par username
- affichage du profil lie
- lancement manuel d une synchronisation
- affichage des compteurs recents
- affichage des derniers commits remontes
- acces a une page dediee `/stagiaires/[id]/github`

La page dediee GitHub par stagiaire affiche :

- etat de la connexion
- depot de reference
- derniers commits, pull requests et issues
- historique des synchronisations

### 5. Audit et traçabilite

Chaque action est tracee dans `AuditLog` :

- `GITHUB_ACCOUNT_LINKED`
- `GITHUB_OAUTH_STARTED`
- `GITHUB_OAUTH_COMPLETED`
- `GITHUB_OAUTH_FAILED`
- `GITHUB_SYNC_SUCCESS`
- `GITHUB_SYNC_FAILED`

## Mode de fonctionnement actuel

### Synchronisation

- source : API REST GitHub
- depot cible : URL `githubRepo` du stage le plus recent
- authentification :
  - OAuth : verification securisee du compte GitHub a l instant de la liaison
  - sans token serveur : depots publics uniquement, quota bas
  - avec `GITHUB_TOKEN` : quota releve et meilleurs resultats

### Gestion des erreurs

- depot introuvable : erreur metier retournee a l utilisateur
- quota depasse : statut `RATE_LIMITED`
- indisponibilite API : statut `ERROR`

## Variables d environnement

- `GITHUB_TOKEN`
- `GITHUB_API_BASE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Limites connues de cette premiere iteration

- la synchronisation est manuelle et cible le depot principal du stage
- les compteurs remontent la fenetre recente interrogee par l API, pas un historique exhaustif
- le token OAuth utilisateur n est pas persiste ; la synchronisation continue donc a s appuyer sur l acces public ou le token serveur `GITHUB_TOKEN`

## Suites recommandees apres Sprint 1

1. gerer plusieurs depots par stagiaire/stage
2. ajouter backoff, cache et relance incrementale
3. exposer une synthese GitHub consolidee cote dashboard/encadrant
4. etudier la persistence securisee d un token GitHub applicatif ou utilisateur si les depots prives deviennent un besoin fort
