# Catalogue KPI V2

Date : 2026-04-13

## Regle de gouvernance

Chaque KPI doit contenir :

- definition metier
- formule de calcul
- source de donnees
- valeur cible
- frequence de mesure

## KPI 1 - Temps median de traitement d un rapport

- definition : temps median entre la date de soumission d un rapport et sa premiere decision (valide ou retourne)
- formule : `median(decision_at - submitted_at)` sur les rapports au statut final traite
- source de donnees : table `Rapport` (dates de soumission/decision + statut)
- valeur cible : <= 72 heures
- frequence de mesure : hebdomadaire

## KPI 2 - Taux de completion des evaluations

- definition : part des evaluations attendues qui sont soumises et validees dans la periode
- formule : `(nombre_evaluations_validees / nombre_evaluations_attendues) * 100`
- source de donnees : table `Evaluation` + regles metier de planning
- valeur cible : >= 80%
- frequence de mesure : hebdomadaire et mensuelle

## KPI 3 - Delai median de validation documentaire

- definition : temps median entre depot de document et validation finale
- formule : `median(validated_at - uploaded_at)` pour documents valides
- source de donnees : table `Document` (dates depot/validation + statut)
- valeur cible : < 48 heures
- frequence de mesure : hebdomadaire

## KPI 4 - Latence p95 des notifications temps reel

- definition : latence p95 entre emission serveur d un evenement et affichage client de la notification
- formule : `p95(displayed_at - emitted_at)` sur evenements critiques
- source de donnees : traces applicatives (service notifications + telemetry client)
- valeur cible : < 2 secondes
- frequence de mesure : continue + consolidation journaliere

## KPI 5 - Disponibilite en production

- definition : pourcentage de disponibilite du service sur la fenetre de mesure
- formule : `((temps_total - indisponibilite_non_planifiee) / temps_total) * 100`
- source de donnees : monitoring uptime + alerting infrastructure
- valeur cible : >= 99.5%
- frequence de mesure : mensuelle

