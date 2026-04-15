# Plan des Sprints V2

## Application Web Gestion des Stagiaires

## Objectif

Ce document decoupe la version 2 en sprints pour faire evoluer la V1 vers une plateforme plus complete, plus automatisee et plus robuste.

La V2 doit enrichir les besoins deja couverts en V1 avec :

- integration GitHub (suivi des activites techniques)
- notifications temps reel
- workflow documentaire avance
- evaluations structurees
- exports et PDF
- analytics metier
- securite renforcee

## Hypotheses de planification

- duree d un sprint : 2 semaines
- equipe cible : 2 a 5 developpeurs
- pre-requis : V1 stable deja en production interne
- priorite : valeur metier + fiabilite + observabilite
- base technique existante :
  - Next.js
  - Prisma
  - PostgreSQL
  - Docker
  - module auth/RBAC deja actif

## Rythme de delivery et alertes de capacite

- Avec 2 developpeurs, les sprints `4` et `6` sont a risque de depassement.
- Avec 3 a 5 developpeurs, le plan peut rester en 7 sprints (0A, 0B, 1, 2, 3, 4, 5, 6).
- Recommandation : verrouiller les lots Must de chaque sprint avant de prendre les lots Should.

## Hors perimetre V2 (avec justification)

- application mobile native (iOS/Android)
  - justification : cout de double stack eleve, faible impact immediat face au responsive web existant
  - risque si inclus en V2 : ralentissement majeur de la livraison coeur metier
- moteur IA de scoring automatique avance
  - justification : besoin de donnees historiques stabilisees avant modele fiable
  - risque si inclus en V2 : resultats peu explicables et dette algorithmique
- multi-tenant complet (plusieurs organisations isolees)
  - justification : complexite architecture + securite + exploitation
  - risque si inclus en V2 : risque d isolement incomplet des donnees
- marketplace d integrations tierces
  - justification : priorite actuelle aux integrations internes critiques (GitHub, docs, reporting)
  - risque si inclus en V2 : surface de maintenance et de support trop large
- internationalisation complete multilingue
  - justification : priorite metier locale, ROI limite a court terme
  - risque si inclus en V2 : hausse de charge QA et UX sans gain immediate

## Strategie de tests transverse V2

- outils recommandes :
  - tests unitaires/integration : Vitest
  - tests E2E : Playwright
  - tests de charge : Artillery
- seuils minimaux de couverture (sur code ajoute/modifie du sprint) :
  - Sprint 0A-0B a Sprint 2 : 70% unitaire minimum
  - Sprint 3 a Sprint 5 : 75% unitaire minimum
  - Sprint 6 : 80% unitaire minimum
- exigences minimales communes :
  - 100% des tests d integration des parcours critiques du sprint passent
  - 100% des tests E2E critiques du sprint passent
  - aucune regression bloquante V1 sur le smoke test quotidien

## Jalon de demonstration intermediaire

- Demo 1 (fin Sprint 1) : connexion GitHub + vue de synthese stagiaire
- Demo 2 (fin Sprint 3, mi-parcours V2) : notifications temps reel + module evaluations complet
- Demo 3 (fin Sprint 5) : workflow documentaire + PDF + analytics pre-release

## Sprint 0A - Cadrage metier V2 et KPI

### Objectif

Aligner le perimetre metier V2, figer les KPI de succes et prioriser le backlog realiste.

### Complexite

Moyen

### Dependances

- aucune (point de depart)

### Taches

- confirmer les objectifs metier avec les parties prenantes
- definir les KPI V2 avec valeur cible :
  - temps median de traitement d un rapport
  - taux de completion des evaluations
  - delai median de validation documentaire
- prioriser le backlog en Must/Should/Could
- definir la definition of done (DoD) produit + technique
- valider le plan de demo intermediaire

### Strategie de tests

- non applicable sur fonctionnalites (cadrage), mais obligatoire sur outillage :
  - pipeline CI vert sur tests existants V1
  - smoke test automatise V1 execute quotidiennement

### Risques et mitigation

- risque : backlog V2 trop ambitieux
  - mitigation : gel du perimetre Must avant Sprint 1
- risque : KPI non mesurables
  - mitigation : imposer des formules et sources de donnees des Sprint 0A

### Livrables

- backlog V2 priorise et valide
- catalogue KPI V2 (definition + formule + source)
- compte-rendu de cadrage valide
- documentation continue : README (section roadmap), `docs/architecture-v2.md`, CHANGELOG (entree Sprint 0A)

### Critere de fin de sprint (mesurable)

- 100% des epics V2 ont une priorite Must/Should/Could
- 100% des KPI V2 ont une formule de calcul et une cible chiffrable
- 0 decision metier critique en attente pour lancer Sprint 1

---

## Sprint 0B - Architecture technique et qualite de base

### Objectif

Figer les contrats techniques, la strategie de migration et le socle de qualite pour limiter les regressions V1/V2.

### Statut actuel

- termine le 2026-04-13
- livrables effectivement poses :
  - documentation architecture/tests/migration/contrats
  - contrats techniques formalises en code
  - pipeline qualite V1/V2 execute avec lint, Vitest, build et baseline Artillery

### Complexite

Complexe

### Dependances

- Sprint 0A termine

### Taches

- definir les contrats techniques des services :
  - service GitHub
  - service notifications
  - service generation PDF
- definir la strategie de migration DB reversible (expand/contract)
- preparer conventions de versioning API
- preparer strategie de tests de non-regression V1/V2
- integrer squelette Artillery dans CI (scenario minimal)

### Strategie de tests

- Vitest : couverture unitaire minimale 70% sur nouveau code infra
- Playwright : smoke E2E login + dashboard + stagiaires
- Artillery : baseline charge (20 utilisateurs simultanes sur 5 min)

### Risques et mitigation

- risque : sprint 0 trop large pour 2 semaines
  - mitigation : decoupage effectif en Sprint 0A + 0B
- risque : migrations irreversibles
  - mitigation : imposer scripts up/down ou plan de restauration documente

### Livrables

- architecture cible V2 documentee
- contrats techniques valides (interfaces + schemas)
- plan de migration reversible valide
- baseline qualite CI (Vitest/Playwright/Artillery)
- documentation continue : README (setup qualite), `docs/testing-strategy-v2.md`, CHANGELOG (entree Sprint 0B)

### Critere de fin de sprint (mesurable)

- 100% des services V2 ont un contrat technique versionne
- 100% des migrations V2 prevues ont une strategie de retour arriere documentee
- pipeline CI execute les 3 familles de tests sans erreur bloquante

---

## Sprint 1 - Integration GitHub et Suivi Technique

### Objectif

Relier les stages techniques a GitHub pour mieux suivre l activite reelle des stagiaires.

### Statut actuel

- termine le 2026-04-13
- lot livre :
  - persistance `GithubConnection` et `GithubSyncLog`
  - service GitHub encapsule avec gestion erreurs/quota
  - liaison OAuth GitHub securisee + fallback manuel
  - synchronisation manuelle et journalisation dans `AuditLog`
  - ecran de synthese GitHub dedie par stagiaire
- points de suite hors Sprint 1 :
  - parcours E2E dedie Playwright
  - optimisation quota/cache/retry
  - support avance multi-depots

### Complexite

Moyen

### Dependances

- Sprint 0A et 0B termines

### Taches

- connecter OAuth GitHub (autorisation securisee)
- lier un compte GitHub a un stagiaire
- recuperer les metadonnees de base :
  - repos associes
  - commits
  - pull requests
  - issues
- creer un ecran de synthese GitHub par stagiaire
- ajouter des garde-fous de permissions par role
- gerer les cas d erreur API GitHub et limites de quota
- journaliser les synchronisations dans `AuditLog`

### Strategie de tests

- unitaires (Vitest) : mapping API GitHub, normalisation, gestion erreurs
- integration (Vitest + DB) : liaison compte GitHub/stagiaire + persistance sync
- E2E (Playwright) : parcours connecter compte + afficher synthese
- couverture minimale : 70% unitaire sur code ajoute/modifie

### Risques et mitigation

- risque : limite de quota API GitHub
  - mitigation : cache des reponses, sync incremental, retry avec backoff, alerting quota
- risque : indisponibilite API externe
  - mitigation : mode degrade avec derniere synchro connue + message utilisateur clair

### Livrables

- integration GitHub operationnelle
- liaison stagiaire <-> compte GitHub
- vue de suivi technique initiale
- documentation continue : README (variables OAuth GitHub), `docs/github-integration.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- 95% des synchronisations manuelles se terminent en moins de 10 s
- taux d erreur de synchronisation < 2% hors indisponibilite GitHub
- 100% des roles non autorises recoivent un refus d acces teste

---

## Sprint 2 - Notifications Temps Reel et Automatisations

### Objectif

Passer des notifications statiques a un systeme reactif en temps reel.

### Statut actuel

- termine le 2026-04-13
- lot livre :
  - preferences de notifications par type d evenement
  - flux SSE `/api/notifications/stream`
  - badge header live
  - centre de notifications rafraichi en direct
  - branchement des evenements rapports et GitHub
  - file persistante `NotificationDispatchJob`
  - retry simple sur les notifications lourdes
  - endpoint de traitement `/api/notifications/process`
- points de suite hors Sprint 2 :
  - producteurs metier complets pour `EVALUATION_SCHEDULED` et `DOCUMENT_REJECTED`
  - parcours E2E Playwright dedie aux notifications temps reel
  - strategie multi-instance pour diffusion temps reel

### Complexite

Complexe

### Dependances

- Sprint 0B (contrat service notifications)
- Sprint 1 pour les evenements de synchronisation GitHub

### Taches

- mettre en place un mecanisme push temps reel (WebSocket ou SSE)
- definir les evenements metier prioritaires :
  - rapport soumis
  - rapport retourne
  - evaluation planifiee
  - document rejete
  - synchronisation GitHub terminee/echouee
- creer les preferences de notifications par utilisateur
- ajouter les badges live dans le dashboard
- mettre en place une file de traitement pour les notifications lourdes
- assurer la reprise sur incident (retry simple)

### Strategie de tests

- unitaires (Vitest) : routage d evenements, preferences user, dedup notifications
- integration : emission event -> persistance -> diffusion canal temps reel
- E2E (Playwright) : reception notification sans rechargement
- charge (Artillery) : 100 connexions simultanees pendant 10 min
- couverture minimale : 70% unitaire sur code ajoute/modifie

### Risques et mitigation

- risque : scalabilite WebSocket/SSE sous charge
  - mitigation : tests Artillery, limitation de debit, batching, fallback polling degrade
- risque : perte d evenements
  - mitigation : file persistante + retry idempotent

### Livrables

- centre de notifications temps reel
- evenements metier branches
- preferences utilisateur de notification
- documentation continue : README (config temps reel), `docs/realtime-notifications.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- latence p95 notification < 2 secondes (event serveur -> affichage client)
- taux de livraison des notifications critiques >= 99%
- scenario charge 100 connexions/10 min passe sans erreur critique

---

## Sprint 3 - Evaluations et Workflow de Validation

### Objectif

Structurer l evaluation du stagiaire avec un cycle clair, tracable et exploitable.

### Statut actuel

- termine le 2026-04-13
- lot livre :
  - extension du modele `Evaluation` avec statuts, score, planification et commentaires encadrant/RH
  - historique dedie `EvaluationRevision`
  - module `/evaluations` avec liste, creation, detail, edition et validation RH
  - grilles de notation versionnees en code et calculees cote serveur
  - synthese des evaluations ajoutee sur la fiche stagiaire
  - branchement des notifications `EVALUATION_SCHEDULED`
- points de suite hors Sprint 3 :
  - parcours E2E Playwright encadrant -> RH -> feedback
  - enrichissement du seed avec evaluations de demonstration
  - instrumentation du KPI de completion des evaluations

### Complexite

Moyen

### Dependances

- Sprint 1 (liaison GitHub optionnelle pour contexte technique)
- Sprint 2 (notifications d etats evaluation)

### Taches

- formaliser les types d evaluation :
  - debut de stage
  - mi-parcours
  - fin de stage
- creer les grilles d evaluation (criteres + notation)
- implementer le workflow :
  - brouillon
  - soumis
  - valide
  - retourne
- ajouter les commentaires encadrant et RH
- historiser les revisions et modifications
- afficher la synthese d evaluation dans la fiche stagiaire
- ajouter les controles d acces stricts sur les evaluations

### Strategie de tests

- unitaires (Vitest) : regles de transition de statut + calculs de score
- integration : workflow complet en base + audit trail
- E2E (Playwright) : soumission par encadrant, validation RH, retour feedback
- couverture minimale : 75% unitaire sur code ajoute/modifie

### Risques et mitigation

- risque : divergence des grilles selon departements
  - mitigation : versionner les grilles et gerer un modele parametre
- risque : mauvaise comprehension des statuts
  - mitigation : labels UX explicites + regles bloquees cote serveur

### Livrables

- module d evaluations fonctionnel
- historique des evaluations
- vue de synthese par stagiaire
- documentation continue : README (workflow evaluation), `docs/evaluations-workflow.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- 100% des transitions de statut hors-regle sont bloquees cote serveur
- temps median de creation+soumission d evaluation < 6 minutes (panel pilote)
- taux de completion evaluations >= 80% sur lot pilote

---

## Sprint 4 - Documents Avances, Signature et Exports PDF

### Objectif

Industrialiser la gestion documentaire pour couvrir les besoins administratifs reels.

### Statut actuel

- termine le 2026-04-13
- lot livre :
  - extension du modele `Document` avec statuts de workflow, source, revue et socle de signature
  - module `/documents` avec liste, detail, transitions et telechargement securise
  - notifications `DOCUMENT_REJECTED` branchees sur le workflow reel
  - generation PDF standard initiale pour attestation, fiche recapitulative et rapport consolide
  - journalisation des actions documentaires sensibles dans `AuditLog`
- points de suite hors Sprint 4 :
  - parcours E2E Playwright complet RH/encadrant/stagiaire
  - charge sur generations PDF simultanees
  - integration signature electronique tierce

### Complexite

Complexe (tres eleve avec equipe de 2)

### Dependances

- Sprint 0B (contrat service PDF et migration reversible)
- Sprint 2 (notifications documentaires)
- Sprint 3 (liaison evaluations/documents)

### Taches

- enrichir les types de documents et statuts de validation
- implementer un workflow documentaire :
  - depose
  - en verification
  - valide
  - rejete
- generer automatiquement des PDF standards :
  - attestation
  - fiche recapitulative
  - rapport consolide
- preparer integration signature electronique (socle + interfaces)
- securiser acces et telechargement des documents sensibles
- tracer chaque action documentaire sensible dans `AuditLog`

### Decoupage recommande (si equipe de 2 developpeurs)

- Sous-lot 4A (Sprint 4) : workflow documentaire + droits + audit
- Sous-lot 4B (Sprint 5 partiel) : generation PDF standard + pre-integration signature

### Strategie de tests

- unitaires (Vitest) : transitions documentaires + generateurs PDF
- integration : upload -> validation -> export PDF -> audit
- E2E (Playwright) : parcours complet RH/encadrant/stagiaire
- charge (Artillery) : 30 generations PDF simultanees
- couverture minimale : 75% unitaire sur code ajoute/modifie

### Risques et mitigation

- risque : conformite RGPD et donnees sensibles dans documents/signature
  - mitigation : minimisation des donnees, retention explicite, journal d acces, revue DPO
- risque : performance generation PDF
  - mitigation : file asynchrone, pre-generation des modeles frequents, monitoring temps de rendu

### Livrables

- workflow documentaire avance
- generation PDF initiale en production
- socle technique signature electronique pret
- documentation continue : README (documents/PDF), `docs/document-workflow-v2.md`, `docs/pdf-service-v2.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- delai median validation documentaire < 48 h (sur lot pilote)
- 95% des PDF standards generes en moins de 5 s
- 100% des actions documentaires sensibles sont auditees

---

## Sprint 5 - Analytics, Dashboard Decisionnel et Performance

### Objectif

Fournir une vision decisionnelle utile pour RH, encadrants et administration.

### Statut actuel

- termine le 2026-04-15
- lot livre :
  - page `/analytics` avec filtres hebdo, mensuel et trimestriel
  - KPI centralises sur rapports, evaluations, documents et stages
  - controles d acces par role pour `ADMIN`, `RH` et `ENCADRANT`
  - vues detaillees filtrables par departement, vigilance et volume
  - exports CSV `overview`, `detailed` et `departments`
  - observabilite analytics avec alertes de budget sur chargements et exports
  - indexes SQL dedies aux requetes Sprint 5
  - couverture Vitest Sprint 5 sur analytics, observabilite et route d export

### Complexite

Moyen a complexe

### Dependances

- Sprint 3 (donnees evaluations)
- Sprint 4 (donnees documentaires)

### Taches

- definir indicateurs metier V2 :
  - taux de rapports valides
  - retards de soumission
  - progression moyenne par departement
  - taux de completion des stages
- creer dashboard decisionnel par role
- ajouter filtres temporels (hebdo, mensuel, trimestriel)
- implementer export CSV des indicateurs
- optimiser requetes lentes (index SQL, pagination, cache)
- mesurer performances serveur et front
- ajouter alertes de surveillance sur erreurs critiques

### Strategie de tests

- unitaires (Vitest) : agregations KPI, calcul des deltas, formats export
- integration : coherence donnees dashboard vs donnees source
- E2E (Playwright) : consultation KPI par role + export CSV
- charge (Artillery) : 50 utilisateurs simultanes sur pages analytics
- couverture minimale : 75% unitaire sur code ajoute/modifie

### Risques et mitigation

- risque : KPI incoherents entre vues
  - mitigation : source unique des calculs + tests de coherence automatise
- risque : degradation performances dashboard
  - mitigation : indexation, cache cible, budget de performance par page

### Livrables

- dashboard analytics V2
- exports de donnees metier
- ameliorations de performance mesurees
- documentation continue : README (analytics), `docs/kpi-catalog-v2.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- 95% des pages analytics se chargent en moins de 2 secondes sous 50 utilisateurs simultanes
- ecart KPI dashboard vs requete source <= 1%
- export CSV disponible en moins de 10 s pour 10 000 lignes

---

## Sprint 6 - Hardening Securite, Qualite et Release V2

### Objectif

Finaliser une version 2 robuste, securisee et prete au deploiement controle.

### Statut actuel

- lance le 2026-04-15
- lot de cadrage livre :
  - rapport global application : `docs/rapport-global-application.md`
  - runbook release initial : `docs/release-v2.md`
  - plan rollback initial : `docs/rollback-v2.md`
- priorites ouvertes :
  - hardening auth/session
  - protection brute-force
  - campagne de non-regression finale
  - rehearsal de rollback en preproduction

### Complexite

Complexe (tres eleve avec equipe de 2)

### Dependances

- Sprints 1 a 5 termines

### Taches

- renforcer securite :
  - politique mots de passe
  - durcissement sessions
  - protection brute-force
- finaliser module 2FA (optionnel par role sensible)
- completer tests : unitaires, integration, E2E des parcours critiques V2
- executer campagne de non-regression V1
- corriger anomalies bloqueantes et majeures
- finaliser documentation technique et fonctionnelle
- preparer rollout (canary ou progressive release)
- executer rehearsal de rollback en preproduction

### Decoupage recommande (si equipe de 2 developpeurs)

- Sous-lot 6A : securite + 2FA + correction majeurs
- Sous-lot 6B : non-regression complete + release engineering + rollback rehearsal

### Strategie de tests

- unitaires (Vitest) : modules securite, politiques d acces, verification 2FA
- integration : chaines auth/session/RBAC/2FA
- E2E (Playwright) : parcours critiques V2 + non-regression V1
- charge (Artillery) : tests sur endpoints sensibles (auth, notifications, analytics)
- couverture minimale : 80% unitaire sur code ajoute/modifie

### Plan de rollback detaille

- strategie applicative :
  - deployment blue/green ou canary
  - feature flags pour desactiver modules V2 sans rollback global
- strategie base de donnees (reversible) :
  - migrations de type expand/contract
  - aucune suppression destructive avant validation post-release
  - sauvegarde complete pre-release + point-in-time recovery active
- procedure en cas d echec production :
  1. geler les ecritures V2 non critiques
  2. basculer trafic sur version V1 stable
  3. desactiver feature flags V2
  4. restaurer donnees uniquement si corruption constatee
  5. publier post-mortem sous 48 h

### Risques et mitigation

- risque : durcissement securite casse des parcours existants
  - mitigation : rollout progressif + non-regression automatique sur parcours V1
- risque : rollback incomplet en cas de migration DB sensible
  - mitigation : rehearsal obligatoire en preprod + checklist go/no-go

### Livrables

- version 2 stable
- dossier de recette complet
- plan de deploiement et rollback teste
- documentation continue : README (runbook prod), `docs/release-v2.md`, `docs/rollback-v2.md`, CHANGELOG

### Critere de fin de sprint (mesurable)

- 0 bug bloquant et <= 5 bugs majeurs ouverts
- taux de succes non-regression V1 >= 98% sur suite automatisee
- rollback rehearsal execute en preprod en moins de 30 minutes
- disponibilite en canary >= 99.5% sur fenetre de validation

---

## Resume de la V2

### Modules inclus dans la V2

- integration GitHub
- notifications temps reel
- evaluations structurees
- workflow documentaire avance
- exports PDF standards
- dashboard analytics metier
- securite renforcee (incluant 2FA optionnelle)

### Modules apres la V2

- application mobile native
- IA de scoring automatique avancee
- multi-tenant complet
- integration tierce etendue
- multilingue complet

## Ordre de priorite global

1. cadrage+architecture (0A/0B)
2. integration GitHub
3. notifications temps reel
4. evaluations metier
5. workflow documentaire + PDF
6. analytics et performance
7. hardening securite et release

## Recommandation pratique

Si la V1 est stable et l equipe est de 2 developpeurs :

- conserver les Must de chaque sprint
- appliquer le decoupage 4A/4B et 6A/6B
- declencher la demo mi-parcours apres Sprint 3 pour revalidation metier

Si l equipe est de 4 a 5 developpeurs, les lots Should peuvent etre tenus sans allonger la timeline.
