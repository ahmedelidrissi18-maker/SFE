# Plan Rollback V2

Date : 2026-04-15

## Objectif

Definir la marche a suivre si la mise en production V2 introduit une regression critique, une instabilite majeure ou une incoherence de donnees.

## Principes

- privilegier le rollback applicatif avant la restauration base de donnees
- limiter les actions destructives
- conserver une procedure simple, courte et testable
- tracer toute decision et toute action de rollback

## Declencheurs de rollback

- incident bloquant sur login ou RBAC
- incident critique sur les parcours RH centraux
- echec de migration ou incoherence forte de donnees
- taux d erreur anormal et durable apres release
- impossibilite de revenir a un service stable via correctif rapide

## Ordre de priorite des actions

### 1. Stabilisation immediate

- geler les operations non critiques
- informer les parties prenantes internes
- ouvrir un journal d incident

### 2. Rollback applicatif

- revenir a la version V1 stable ou a la derniere version V2 saine
- desactiver les lots V2 si un mecanisme de feature flag existe
- verifier la reprise du trafic

### 3. Verification fonctionnelle rapide

- login
- verification d un compte sensible avec 2FA desactive cote applicatif si la mitigation l exige
- dashboard
- stagiaires
- rapports
- documents
- notifications

### 4. Evaluation base de donnees

- ne restaurer la base que si la coherence est compromise
- sinon conserver la base en l etat et corriger applicativement

## Strategie base de donnees

- schema V2 base sur une approche expand/contract
- la migration `0008_security_hardening` est additive et ne supprime aucune colonne existante
- aucune suppression destructive ne doit accompagner la meme release que les ajouts
- backup complet requis avant release
- restauration DB reservee aux cas de corruption ou perte de coherence

## Checklist rollback

- identifier la version cible de retour
- verifier la disponibilite du package ou de l image precedente
- verifier le backup et la fenetre de restauration
- executer le retour applicatif
- verifier la sante systeme
- executer le smoke post-rollback
- confirmer le retour a un service stable

## Smoke post-rollback

- acces `/login`
- acces `/dashboard`
- acces `/stagiaires`
- verification RBAC de base
- consultation `/rapports`
- consultation `/documents`
- verification `/api/health`

## Communication

- message interne de lancement incident
- message de stabilisation apres rollback
- compte-rendu post-incident
- post-mortem sous 48 h

## Preuves a conserver

- horodatage des actions
- version de depart et version cible
- logs applicatifs
- etat de la base
- resultat du smoke post-rollback

## Cible Sprint 6

- rehearsal de rollback execute en preproduction
- duree cible : moins de 30 minutes
- procedure validee avant go-live V2
