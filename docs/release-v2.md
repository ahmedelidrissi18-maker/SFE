# Runbook Release V2

Date : 2026-04-15

## Objectif

Definir le cadre de mise en production controlee de la V2.

## Portee de release

La release V2 couvre :

- integration GitHub
- notifications temps reel
- evaluations
- workflow documentaire et PDF
- analytics decisionnel
- hardening securite du Sprint 6

## Preconditions techniques

- `npm run lint` passe
- `npm test` passe
- `npm run build` passe
- migrations Prisma V2 appliquees
- verification de la base cible et backup disponible
- variables d environnement de production validees

## Preconditions produit

- recette fonctionnelle validee
- parcours critiques RH, encadrant et stagiaire verifies
- anomalies bloqueantes fermees
- anomalies majeures sous seuil du Sprint 6

## Checklist pre-release

- verifier la version a publier
- verifier la presence des migrations V2 necessaires
- verifier la compatibilite schema/code
- verifier les secrets NextAuth et les credentials GitHub
- verifier le secret processeur de notifications si utilise
- verifier la sante de la base et de Redis
- verifier les routes critiques : login, dashboard, stagiaires, rapports, documents, analytics
- verifier l endpoint `/api/health`

## Strategie de rollout

### Option recommandee

- deploiement progressif / canary si disponible
- observation des metriques pendant la fenetre de validation
- ouverture progressive aux utilisateurs

### Alternative minimale

- mise en production directe sur faible trafic
- smoke manuel immediat apres deploiement
- surveillance rapprochee pendant la fenetre de validation

## Verifications post-deploiement

- login admin et RH
- acces dashboard par role
- consultation stagiaires et stages
- creation / revue d un rapport
- consultation notifications
- export analytics CSV
- telechargement d un document autorise
- endpoint `/api/health` en statut `ok` ou `degraded` non critique

## Indicateurs a surveiller

- erreurs auth
- erreurs API GitHub
- latence analytics
- erreurs export analytics
- file de notifications
- erreurs documents/PDF
- signalements utilisateurs RH et encadrants

## Go / No-Go

### Go si

- build valide
- smoke valide
- migrations appliquees sans erreur
- aucun bug bloquant ouvert
- monitoring stable sur la fenetre initiale

### No-Go si

- echec migration
- regression critique sur login/RBAC
- incidents API critiques
- erreurs massives sur parcours rapports/documents/analytics

## Sorties attendues du Sprint 6

- release candidate V2 stable
- checklist d exploitation validee
- plan de rollback teste
