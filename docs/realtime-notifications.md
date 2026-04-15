# Notifications Temps Reel (Sprint 2)

Date : 2026-04-13

## Objectif du sprint

Fournir un socle temps reel exploitable et robuste pour la V2 :

- diffusion temps reel des notifications in-app
- preferences utilisateur par type d evenement
- rafraichissement live du badge notifications et du centre de notifications
- branchement des evenements metier prioritaires disponibles
- file persistante pour les notifications lourdes
- reprise sur incident avec retry simple

## Composants implementes

### 1. Persistance des preferences

- table `NotificationPreference`
- unicite par `userId + eventType`
- options gerees :
  - `inAppEnabled`
  - `liveEnabled`

### 2. Transport temps reel

- endpoint SSE : `/api/notifications/stream`
- gestion des abonnements en memoire via `lib/realtime-notifications.ts`
- heartbeat periodique pour garder la connexion ouverte

### 3. Service de notifications

- centralisation des mises a jour de lecture dans `lib/notification-service.ts`
- emission d evenements live apres creation ou lecture
- respect des preferences utilisateur avant creation/push live
- support de dispatch differe pour fan-out lourd

### 4. File de dispatch

- table `NotificationDispatchJob`
- traitement des jobs en attente via `processPendingNotificationDispatchJobs`
- endpoint de traitement manuel/interne : `/api/notifications/process`
- retry simple :
  - incrementation des tentatives
  - replanification avec delai croissant
  - marquage `FAILED` apres depassement du nombre max de tentatives

### 5. Experience utilisateur

- badge header mis a jour en direct
- centre de notifications rafraichi automatiquement
- dashboard rafraichi sur les evenements live
- formulaire de preferences sur `/notifications`

## Evenements branches

- `STAGIAIRE_CREATED`
- `RAPPORT_SUBMITTED`
- `RAPPORT_RETURNED`
- `STAGE_ENDING_SOON`
- `GITHUB_SYNC_SUCCESS`
- `GITHUB_SYNC_FAILED`
- `EVALUATION_SCHEDULED` (pret pour Sprint 3)
- `DOCUMENT_REJECTED` (pret pour Sprint 4)

## Exploitation

- le transport SSE est en memoire et convient surtout a une instance applicative unique
- l endpoint `/api/notifications/process` peut etre appele :
  - par un utilisateur `ADMIN` ou `RH`
  - ou par un appel interne avec `x-notifications-secret`

Variable associee :

- `NOTIFICATIONS_PROCESSOR_SECRET`

## Limites connues

- les parcours E2E Playwright dedies aux notifications temps reel restent a ajouter
- le bus SSE en memoire doit evoluer si l application passe en multi-instance
- les producteurs metier complets pour `EVALUATION_SCHEDULED` et `DOCUMENT_REJECTED` arriveront avec les modules Sprint 3 et Sprint 4

## Suites recommandees apres Sprint 2

1. ajouter les preferences au dashboard utilisateur
2. brancher les producteurs metier evaluation/document
3. ajouter une strategie multi-instance si deploiement distribue
4. completer la couverture E2E Playwright temps reel
