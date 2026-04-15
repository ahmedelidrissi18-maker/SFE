# Contrats techniques des services V2 (Sprint 0B)

Date : 2026-04-13

## Objectif

Definir des interfaces stables pour les services V2 afin de separer les regles metier des integrations externes.

Les contrats sont maintenant aussi formalises en code dans `lib/services/contracts.ts`.

## 1. Contrat Service GitHub

### Responsabilites

- lier un compte GitHub a un stagiaire
- synchroniser activites (repos, commits, pull requests, issues)
- exposer un resume de synchronisation pour le dashboard

### Interface cible (logique)

- `connectAccount(stagiaireId, oauthCode): GitHubLinkResult`
- `syncActivity(stagiaireId): GitHubSyncResult`
- `getSummary(stagiaireId): GitHubSummary`

### Contraintes

- idempotence sur `syncActivity`
- gestion des quotas API (backoff + cache)
- journalisation des erreurs et des synchronisations
- lot initial implemente en Sprint 1 :
  - `connectAccount` via OAuth GitHub ou fallback manuel par username
  - `syncActivity` sur depot stage GitHub
  - `getSummary` pour la fiche stagiaire

## 2. Contrat Service Notifications Temps Reel

### Responsabilites

- publier des evenements metier
- router les evenements vers les utilisateurs concernes
- gerer les preferences de diffusion

### Interface cible (logique)

- `publish(event): NotificationDispatchResult`
- `subscribe(userId, channel): SubscriptionResult`
- `updatePreferences(userId, eventType, inAppEnabled, liveEnabled): PreferenceResult`
- `markAsRead(notificationId, userId): void`

### Contraintes

- livraison at-least-once avec deduplication
- persistence minimale des notifications critiques
- fallback degrade si transport temps reel indisponible
- lot initial implemente en Sprint 2 :
  - endpoint SSE pour diffusion live
  - `markAsRead` centralise
  - `updatePreferences` par type d evenement
  - file persistante `NotificationDispatchJob`
  - traitement interne via `/api/notifications/process`

## 3. Contrat Service PDF

### Responsabilites

- generer des PDF standards (attestation, fiche recapitulative, rapport consolide)
- gerer une file asynchrone pour rendus lourds
- retourner metadonnees de generation

### Interface cible (logique)

- `requestGeneration(payload): JobId`
- `getJobStatus(jobId): PdfJobStatus`
- `download(jobId, actor): Stream | SignedUrl`

### Contraintes

- templates versionnes
- audit des telechargements sensibles
- controle d acces RBAC avant remise du document
