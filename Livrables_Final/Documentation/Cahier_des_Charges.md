# CAHIER DES CHARGES

## Système de Gestion de Stagiaires

### Application Web Full-Stack

**Next.js · Node.js · PostgreSQL**

| | |
|---|---|
| **Version** | 2.0 — Amélioré & Détaillé |
| **Date** | Avril 2026 |
| **Statut** | Document de Référence |

## Table des Matières

1. Présentation du Projet
2. Acteurs et Rôles
3. Fonctionnalités Détaillées
4. Exigences Techniques
5. Modèle de Données
6. Détail des Interfaces Next.js
7. Planning de Réalisation
8. Livrables et Critères d'Acceptation
9. Contraintes et Risques
10. Glossaire

---

## 1. Présentation du Projet

### 1.1 Contexte et Enjeux

Les organisations accueillant des stagiaires font face à une gestion administrative complexe impliquant de multiples acteurs : administrateurs, responsables RH, encadrants et stagiaires eux-mêmes. La gestion manuelle ou morcelée de ces informations engendre des inefficacités, des pertes de données et un suivi insuffisant des parcours.

Ce projet vise à concevoir et développer une application web centralisée, performante et sécurisée, permettant la gestion intégrale du cycle de vie des stages, depuis l'inscription jusqu'à la délivrance de l'attestation finale.

### 1.2 Objectifs Généraux

- Centraliser toutes les informations relatives aux stagiaires et aux stages dans une seule plateforme
- Automatiser les processus administratifs répétitifs (génération de documents, notifications, rappels)
- Faciliter le suivi de l'avancement, des présences et des évaluations en temps réel
- Intégrer l'API GitHub pour le suivi des projets techniques et de l'activité de code
- Générer automatiquement les documents officiels conformes (conventions, attestations, rapports)
- Fournir des tableaux de bord adaptés et analytiques pour chaque profil d'utilisateur
- Garantir la conformité RGPD pour la protection des données personnelles

### 1.3 Périmètre Fonctionnel

L'application couvre l'ensemble du cycle de vie d'un stage au sein de l'organisation :

- Gestion administrative complète des stagiaires et des stages
- Suivi pédagogique et technique via l'intégration GitHub
- Évaluation des compétences techniques et transversales
- Système de notifications et d'alertes multi-canaux automatisé
- Stockage sécurisé et gestion documentaire centralisée
- Tableau de bord analytique avec exports de données

---

## 2. Acteurs et Rôles

Le système distingue quatre profils d'utilisateurs avec des droits, des interfaces et des responsabilités différenciés selon le principe du moindre privilège (RBAC).

| **Acteur** | **Niveau d'Accès** | **Responsabilités Principales** | **Interfaces Principales** |
|------------|--------------------|--------------------------------|----------------------------|
| **Administrateur** | Total | Gestion globale, configuration système, création des comptes, accès à toutes les données, audit | Dashboard global, gestion utilisateurs, configuration, logs système |
| **Responsable RH** | Élevé | Validation des stages, génération des documents officiels, suivi RH global, rapports analytics | Dashboard RH, validation des candidatures, gestion documentaire, exports |
| **Encadrant** | Partiel | Suivi de ses stagiaires assignés, saisie des évaluations, validation des rapports hebdomadaires | Dashboard encadrant, fiche stagiaire, évaluations, suivi GitHub |
| **Stagiaire** | Limité | Accès à son propre profil, soumission des rapports hebdomadaires, téléversement de documents | Mon profil, mes rapports, mes documents, mon espace GitHub |

---

## 3. Fonctionnalités Détaillées

### 3.1 Module Authentification & Sécurité

Point d'entrée unique du système, garantissant la sécurité des accès et la traçabilité des actions.

#### 3.1.1 Authentification

- Authentification par email et mot de passe avec politique de complexité configurable (min. 8 caractères, majuscules, chiffres, symboles)
- Authentification à deux facteurs (2FA) obligatoire pour les profils Administrateur et RH (TOTP via application Authenticator)
- Connexion sécurisée via JWT (Access Token 15min + Refresh Token 7 jours)
- Réinitialisation de mot de passe par lien email sécurisé à usage unique (expiration 1h)
- Verrouillage du compte après 5 tentatives échouées avec notification à l'administrateur
- Sessions avec expiration configurable et déconnexion automatique après inactivité (configurable, défaut 30min)

#### 3.1.2 Gestion des Sessions & Audit

- Journal des connexions avec IP, User-Agent, date/heure et statut (succès/échec)
- Audit log exhaustif de toutes les actions sensibles (modifications, suppressions, exports)
- Possibilité de révoquer toutes les sessions actives d'un utilisateur depuis l'interface admin
- Historique des activités consultable par l'administrateur avec filtres avancés

### 3.2 Module Gestion des Stagiaires

Cœur du système, ce module permet la gestion complète du cycle de vie du stagiaire, de son inscription à sa clôture de stage.

#### 3.2.1 Gestion du Profil Stagiaire

- Création, modification et archivage des fiches stagiaires avec workflow de validation
- Informations personnelles : nom, prénom, CIN, date de naissance, nationalité, téléphone, adresse email
- Informations académiques : établissement, filière, niveau d'études, spécialité, année universitaire
- Informations du stage : dates de début/fin, département d'affectation, projet assigné, encadrant
- Photo de profil et documents d'identité avec validation de format et taille
- Historique complet des modifications avec auteur, horodatage et justification
- Recherche avancée et filtrage multicritères (département, statut, période, encadrant, établissement)
- Export des listes en CSV, Excel ou PDF

#### 3.2.2 Gestion du Stage

- Définition détaillée des objectifs, des livrables attendus et du plan de travail initial
- Affectation de l'encadrant avec notification automatique par email
- Liaison avec le dépôt GitHub du projet (URL, branche principale)
- Suivi des présences et des absences avec justificatifs
- Renouvellement du stage avec génération d'un avenant à la convention
- Clôture anticipée avec motif obligatoire et archivage automatique
- Statuts du stage : Planifié, En cours, Suspendu, Terminé, Annulé

### 3.3 Module Suivi & Rapports

Vision en temps réel de l'avancement de chaque stage avec tableaux de bord adaptés à chaque rôle.

#### 3.3.1 Tableaux de Bord

- Dashboard Administrateur : KPIs globaux (nombre de stagiaires actifs, taux de complétion des rapports, alertes en cours, statistiques par département)
- Dashboard RH : suivi de validation, documents en attente, échéances imminentes, graphiques d'activité
- Dashboard Encadrant : liste de ses stagiaires, derniers rapports soumis, activité GitHub, évaluations à remplir
- Dashboard Stagiaire : état du stage, prochaines échéances, tâches à réaliser, activité GitHub

#### 3.3.2 Rapports Hebdomadaires

- Soumission obligatoire chaque semaine via formulaire structuré
- Champs requis : tâches réalisées, difficultés rencontrées, plan de la semaine suivante, estimation d'avancement (%)
- Pièces jointes possibles (captures d'écran, documents, liens)
- Statuts de rapport : Brouillon, Soumis, Validé, Retourné pour correction
- Commentaires et retours de l'encadrant directement dans l'interface
- Rappels automatiques 72h et 24h avant l'échéance hebdomadaire

#### 3.3.3 Intégration GitHub API

- Connexion via OAuth GitHub ou token d'accès personnel (PAT) pour les stagiaires
- Affichage des dépôts liés au stage avec description, langage principal et dernière activité
- Visualisation des commits avec message, auteur, date et diff summary
- Suivi des branches actives et des pull requests (ouvertes, fusionnées, refusées)
- Indicateur d'activité de code hebdomadaire (nombre de commits, lignes ajoutées/supprimées)
- Graphique de contribution de type heatmap (inspiré du profil GitHub)
- Gestion du rate limiting API avec mise en cache Redis (TTL configurable, défaut 15min)

#### 3.3.4 Analytics & Exports

- Graphiques d'avancement par stagiaire, par département et par période
- Taux de complétion des rapports hebdomadaires par encadrant
- Analyse comparative des activités GitHub entre stagiaires
- Export des rapports en PDF (rapport complet formaté) ou Excel (données tabulaires)
- Rapport mensuel automatique envoyé au RH par email (PDF récapitulatif)

### 3.4 Module Évaluation

Évaluation structurée, tracée et signée numériquement des compétences des stagiaires.

#### 3.4.1 Configuration des Grilles

- Grilles d'évaluation entièrement configurables par l'administrateur
- Création de critères d'évaluation personnalisés avec pondération
- Deux types d'évaluation : Mi-parcours (fin de semaine 4) et Finale (dernière semaine)
- Échelle de notation configurable (ex : 0-20, 1-5 étoiles, Insuffisant/Satisfaisant/Excellent)

#### 3.4.2 Compétences Évaluées

- Compétences techniques : maîtrise des outils/technologies, qualité du code (revue GitHub), autonomie, respect des bonnes pratiques
- Compétences transversales : communication écrite et orale, ponctualité et assiduité, initiative et proactivité, travail en équipe, capacité d'adaptation
- Commentaires libres obligatoires par critère pour justifier la note
- Auto-évaluation optionnelle du stagiaire pour comparaison

#### 3.4.3 Validation & Signature

- Signature électronique de l'évaluateur avec authentification renforcée (confirmation par mot de passe)
- Workflow de validation : Évaluateur saisie → RH valide → Document généré et archivé
- Notification automatique au stagiaire lors de la disponibilité de son évaluation
- Génération automatique du rapport final d'évaluation en PDF (modèle officiel paramétrable)

### 3.5 Module Notifications

Système d'alertes multi-canaux maintenant tous les acteurs informés en temps réel et anticipant les échéances.

#### 3.5.1 Notifications In-App

- Centre de notifications en temps réel avec badge counter sur l'icône cloche
- Catégorisation des notifications : Informations, Rappels, Alertes, Actions requises
- Marquage lu/non-lu individuel et collectif
- Historique des notifications consultable sur 90 jours
- Préférences de notification personnalisables par l'utilisateur

#### 3.5.2 Emails Automatisés

- Email de bienvenue à l'arrivée du stagiaire avec identifiants d'accès et guide de démarrage
- Rappel de rapport hebdomadaire : J-3 (72h) et J-1 (24h) avant l'échéance
- Alertes d'échéance de stage : J-15, J-7 et J-1 pour l'encadrant et le RH
- Notification d'évaluation disponible avec lien direct vers la fiche
- Alerte d'absence non justifiée après 2 jours consécutifs
- Rapport mensuel récapitulatif automatique pour les responsables RH

#### 3.5.3 Gestion des Templates

- Templates d'emails entièrement personnalisables (HTML) via interface d'administration
- Support des variables dynamiques dans les templates (nom, prénom, dates, liens, etc.)
- Prévisualisation des emails avant envoi depuis l'interface admin
- Journal des emails envoyés avec statut de livraison (delivré, ouvert, bounced)

### 3.6 Gestion Documentaire

Stockage centralisé, sécurisé et versionné de tous les documents liés aux stages.

#### 3.6.1 Génération Automatique

- Convention de stage : générée automatiquement depuis les données du profil, basée sur un modèle Word personnalisable
- Avenant de renouvellement : généré lors du renouvellement du stage
- Attestation de stage : émise à la clôture du stage avec QR code de vérification d'authenticité
- Rapport d'évaluation final : consolidation automatique des notes et commentaires au format PDF
- Fiche de présence mensuelle : export automatique en fin de mois

#### 3.6.2 Gestion des Fichiers Utilisateurs

- Téléversement sécurisé avec validation de type (PDF, JPG, PNG, DOCX) et de taille (max 10 Mo)
- Organisation par catégories : Documents d'identité, Lettres, CV, Rapports, Justificatifs
- Prévisualisation en ligne des PDF et images sans téléchargement
- Gestion des versions avec conservation des 3 dernières versions de chaque document
- Accès sécurisé par rôle avec URLs signées temporaires (expiration 1h)
- Corbeille avec rétention de 30 jours avant suppression définitive

---

## 4. Exigences Techniques

### 4.1 Architecture Système

L'application suit une architecture moderne découplée avec des responsabilités clairement séparées entre les couches frontend et backend, communiquant via une API REST sécurisée.

| **Composant** | **Technologie** | **Version Recommandée** | **Justification** |
|---------------|----------------|-------------------------|-------------------|
| **Frontend** | Next.js + TypeScript | Next.js 14+ (App Router) | SSR/SSG, SEO, performance, routing avancé, Server Components |
| **UI & Styles** | TailwindCSS + shadcn/ui | Tailwind 3.x | Design système cohérent, composants accessibles, personnalisables |
| **State Management** | Zustand + React Query | Zustand 4.x / TanStack Query 5.x | Légèreté, cache serveur automatique, synchronisation en temps réel |
| **Backend** | Node.js + Express.js | Node.js 20 LTS | Performances, écosystème riche, async/await natif |
| **ORM** | Prisma ORM | Prisma 5.x | Type-safety, migrations, relations complexes, prisma studio |
| **Base de Données** | PostgreSQL | PostgreSQL 15+ | ACID, relations complexes, JSON natif, robustesse, performance |
| **Cache** | Redis | Redis 7.x | Cache API GitHub, sessions, rate limiting, queues de notifications |
| **Authentification** | NextAuth.js + JWT + bcrypt | NextAuth.js 5.x | Intégration Next.js native, OAuth, sessions, CSRF protection |
| **Stockage Fichiers** | AWS S3 ou MinIO | SDK AWS v3 | Scalable, URLs signées, accès sécurisé, lifecycle policies |
| **Emails** | React Email + Resend | Resend API | Templates React composables, délivrabilité élevée, analytics d'emails |
| **PDF Generation** | Puppeteer / pdfmake | Puppeteer 21+ | Rendu fidèle HTML→PDF, templates complexes, headers/footers |
| **Déploiement** | Docker + Nginx + Vercel | Docker 24+ | Portabilité, CI/CD, facilité de maintenance et mise à l'échelle |
| **Temps Réel** | Socket.io ou Server-Sent Events | Socket.io 4.x | Notifications push en temps réel, mise à jour des dashboards |

### 4.2 Architecture Next.js — Structure du Projet

L'application Next.js sera organisée selon les conventions de l'App Router (Next.js 14+) :

| **Dossier / Fichier** | **Rôle** |
|-----------------------|----------|
| **app/** | Racine de l'App Router — toutes les pages et layouts Next.js 14 |
| **app/(auth)/** | Pages publiques : login, reset-password, register |
| **app/(dashboard)/** | Pages protégées par layout commun avec sidebar et header |
| **app/api/** | Route Handlers Next.js (API REST interne — /api/**) |
| **components/ui/** | Composants atomiques réutilisables (shadcn/ui + custom) |
| **components/features/** | Composants métier par module (stagiaires, évaluations, etc.) |
| **lib/** | Utilitaires : prisma client, auth config, api helpers, validators |
| **hooks/** | Custom React hooks (useAuth, useStagiaires, useNotifications...) |
| **store/** | Stores Zustand pour l'état global (ui, notifications) |
| **types/** | Types et interfaces TypeScript globaux |
| **prisma/** | Schéma Prisma, migrations et seed de base de données |
| **public/** | Assets statiques : images, icônes, fonts locaux |

### 4.3 Sécurité

- Chiffrement HTTPS obligatoire (TLS 1.3) sur toutes les communications
- Contrôle d'accès basé sur les rôles (RBAC) vérifié côté serveur sur chaque route API
- Protection contre les attaques OWASP Top 10 : injection SQL (via Prisma), XSS, CSRF, IDOR
- Validation et sanitisation de toutes les entrées avec Zod (schémas TypeScript)
- Headers de sécurité HTTP configurés via Next.js (Content-Security-Policy, HSTS, X-Frame-Options)
- Rate limiting sur les endpoints sensibles (auth : 5 req/min, API : 100 req/min)
- Audit log de toutes les actions sensibles stocké en base de données
- Sauvegarde automatique quotidienne chiffrée avec rétention 30 jours
- Scan des fichiers uploadés (antivirus via ClamAV en option)

### 4.4 Performances

- Temps de chargement initial < 2 secondes (LCP) grâce au SSR Next.js et à l'optimisation des images
- Score Lighthouse Performance > 90 sur les pages principales
- Capacité à gérer 200+ stagiaires et 50+ utilisateurs simultanément
- Pagination côté serveur pour toutes les listes (défaut 20 éléments/page)
- Mise en cache Redis des requêtes GitHub API (TTL 15min) et des agrégations BD
- Lazy loading des composants lourds (graphiques, éditeurs de texte riche)
- Optimisation des images avec next/image (WebP automatique, responsive)

### 4.5 Compatibilité & Accessibilité

- Application entièrement responsive : mobile (320px+), tablette, desktop
- Compatible navigateurs modernes : Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- Conformité WCAG 2.1 niveau AA (contrastes, navigation clavier, lecteurs d'écran, aria-labels)
- Interface disponible en français (multilingue i18n prévu en version 2.0 avec next-intl)
- Support du mode sombre (dark mode) via CSS variables et next-themes

---

## 5. Modèle de Données

Schéma Prisma détaillé — Entités principales et leurs attributs avec types de données :

| **Entité** | **Attributs Principaux** | **Notes / Contraintes** |
|------------|--------------------------|-------------------------|
| **User** | id (UUID), nom, prénom, email (unique), passwordHash, role (enum), isActive, twoFactorEnabled, createdAt, updatedAt | Rôle : ADMIN \| RH \| ENCADRANT \| STAGIAIRE. Email vérifié obligatoire. |
| **Stagiaire** | id, userId (FK), cin (unique), dateNaissance, telephone, etablissement, specialite, niveau, annee, photoUrl | Relation 1-1 avec User. CIN unique et validé. |
| **Stage** | id, stagiaireId (FK), encadrantId (FK), dateDebut, dateFin, departement, sujet, githubRepo, statut (enum), createdAt | Statut : PLANIFIE \| EN_COURS \| SUSPENDU \| TERMINE \| ANNULE. Un stagiaire = un stage actif max. |
| **Rapport** | id, stageId (FK), semaine (Int), tachesRealisees, difficultes, planSuivant, avancement (Int 0-100), statut, datesoumission | Statut : BROUILLON \| SOUMIS \| VALIDE \| RETOURNE. Un rapport par semaine par stage. |
| **Evaluation** | id, stageId (FK), type (MI_PARCOURS \| FINAL), notes (JSON), commentaire, signature, isSigned, createdAt | Notes stockées en JSON pour flexibilité des critères. Signature = hash + timestamp. |
| **Document** | id, stageId (FK), auteurId (FK), type (enum), nom, url, tailleOctets, version, isDeleted, createdAt | Type : CONVENTION \| ATTESTATION \| CV \| RAPPORT_EVAL \| AUTRE. Soft delete. |
| **Notification** | id, destinataireId (FK), type (enum), titre, message, lien, isRead, createdAt | Archivage automatique après 90 jours. |
| **AuditLog** | id, userId (FK), action, entite, entiteId, ancienneValeur (JSON), nouvelleValeur (JSON), ip, userAgent, createdAt | Immutable — aucune modification ou suppression autorisée. |
| **Presence** | id, stageId (FK), date, statut (PRESENT \| ABSENT \| JUSTIFIE), justificatifUrl, notes | Une entrée par jour travaillé. Justificatif requis si ABSENT. |

---

## 6. Détail des Interfaces Next.js

### 6.1 Pages & Routes Principales

| **Route Next.js** | **Accès** | **Description** |
|-------------------|-----------|-----------------|
| **/login** | Public | Page de connexion avec formulaire email/mot de passe et option 2FA |
| **/reset-password** | Public | Formulaire de réinitialisation de mot de passe via token email |
| **/dashboard** | Authentifié | Dashboard principal adapté au rôle (KPIs, alertes, raccourcis) |
| **/stagiaires** | Admin / RH | Liste complète avec recherche, filtres et pagination côté serveur |
| **/stagiaires/[id]** | Partiel | Fiche détaillée du stagiaire avec onglets (profil, stage, rapports, docs) |
| **/stagiaires/nouveau** | Admin / RH | Formulaire multi-étapes de création d'un nouveau stagiaire |
| **/rapports** | Authentifié | Vue des rapports selon le rôle (mes rapports / rapports de mes stagiaires) |
| **/rapports/[id]/soumettre** | Stagiaire | Formulaire de saisie et soumission du rapport hebdomadaire |
| **/evaluations/[id]** | Encadrant / RH | Grille d'évaluation interactive avec critères configurables et signature |
| **/documents** | Authentifié | Bibliothèque documentaire avec prévisualisation et téléchargement |
| **/notifications** | Authentifié | Centre de notifications avec filtres par type et marquage lu/non-lu |
| **/admin/utilisateurs** | Admin | CRUD complet des utilisateurs avec gestion des rôles et statuts |
| **/admin/configuration** | Admin | Configuration globale : grilles d'évaluation, templates emails, paramètres |
| **/mon-profil** | Authentifié | Page de profil personnel avec modification des informations et sécurité |

### 6.2 Composants Clés

- Sidebar responsive avec navigation adaptée au rôle et badge de notifications
- DataTable générique avec tri, filtres, pagination et export (basé sur TanStack Table)
- Formulaires avec validation Zod + react-hook-form et gestion d'erreurs inline
- RichTextEditor basé sur Tiptap pour la saisie des rapports
- GitHubActivityWidget : composant de visualisation de l'activité du dépôt
- EvaluationGrid : grille de notation interactive avec calcul automatique des moyennes
- DocumentViewer : prévisualisation in-browser des PDF et images
- NotificationBell : composant temps réel avec WebSocket et badge animé
- ConfirmDialog : dialogue de confirmation pour les actions critiques (suppression, signature)

---

## 7. Planning de Réalisation

Découpage en 8 sprints de 2 semaines sur une durée totale estimée à 4 mois, selon la méthodologie Agile/Scrum avec revue de sprint et démo client à chaque itération.

| **Sprint** | **Période** | **Contenu** | **Livrable** |
|------------|-------------|-------------|---------------|
| **Sprint 1** | Sem. 1-2 | Analyse approfondie, choix d'architecture, maquettes UI (Figma), schéma BD Prisma, setup monorepo, CI/CD de base | Dossier technique + Maquettes validées |
| **Sprint 2** | Sem. 3-4 | Setup Next.js 14 + TypeScript + TailwindCSS + shadcn/ui, module authentification complet (login, 2FA, reset), RBAC middleware | Module Auth + layout dashboard |
| **Sprint 3** | Sem. 5-6 | CRUD Stagiaires et Stages, dashboard admin avec KPIs, recherche/filtres avancés, upload de photos et documents d'identité | Module Stagiaires fonctionnel |
| **Sprint 4** | Sem. 7-8 | Rapports hebdomadaires (formulaire RichText, workflow validation), intégration GitHub API + cache Redis, dashboard encadrant | Module Suivi + GitHub intégré |
| **Sprint 5** | Sem. 9-10 | Module évaluation (grilles configurables, calcul notes, commentaires), signature électronique, génération PDF rapports d'évaluation | Module Évaluation + PDF |
| **Sprint 6** | Sem. 11-12 | Système de notifications in-app (WebSocket/SSE), emails automatisés (React Email + Resend), gestion documentaire complète, génération conventions/attestations | Notifications + Documents officiels |
| **Sprint 7** | Sem. 13-14 | Tests unitaires (Jest + Testing Library), tests E2E (Playwright), audit sécurité, optimisations performances (Lighthouse 90+), corrections bugs | Application stable et testée |
| **Sprint 8** | Sem. 15-16 | Déploiement production (Docker + Nginx), configuration HTTPS, monitoring (Sentry), formation utilisateurs, documentation finale (Swagger + guides) | Mise en production + Documentation |

---

## 8. Livrables et Critères d'Acceptation

### 8.1 Livrables Attendus

- Code source versionné sur dépôt Git (GitHub/GitLab) avec README complet, instructions d'installation et de déploiement
- Application déployée et fonctionnelle sur serveur de production avec HTTPS et monitoring
- Documentation technique : spécification API (Swagger/OpenAPI 3.0), diagramme d'architecture, schéma BD
- Guides utilisateurs par profil au format PDF (Administrateur, RH, Encadrant, Stagiaire)
- Rapport de tests : couverture unitaire (>80%), rapport E2E Playwright, rapport de charge (k6)
- Scripts de migration Prisma, script de seed de données de démonstration
- Configuration Docker Compose pour déploiement local et production
- Configuration CI/CD (GitHub Actions) avec lint, tests, build et déploiement automatisé

### 8.2 Critères d'Acceptation

- Tous les modules fonctionnent sans erreurs bloquantes sur les navigateurs cibles
- Les 4 profils utilisateurs accèdent exclusivement à leurs données autorisées (tests RBAC)
- Les documents générés (convention, attestation) sont conformes aux modèles officiels validés
- L'intégration GitHub affiche correctement les données des dépôts en moins de 3 secondes
- Les notifications email sont reçues dans les délais configurés (test en environnement staging)
- Les tests de charge valident 200 utilisateurs simultanés sans dégradation significative des performances
- Score Lighthouse Performance > 90, Accessibility > 90 sur les pages principales
- Aucune vulnérabilité critique ou haute dans le rapport de sécurité OWASP ZAP

---

## 9. Contraintes et Risques

### 9.1 Contraintes

- Conformité RGPD obligatoire : consentement éclairé, droit à l'oubli, portabilité des données, DPO désigné
- Compatibilité avec l'infrastructure existante de l'organisation (réseau, SSO éventuel)
- Interface entièrement disponible en français ; architecture i18n préparée pour la v2 (arabe, anglais)
- Sauvegarde garantie sans perte de données : RPO < 24h, RTO < 4h
- Données hébergées obligatoirement sur serveurs locaux ou dans un datacenter conforme à la réglementation nationale
- Respect des politiques de sécurité interne de l'organisation (politique de mot de passe, VPN, etc.)

### 9.2 Risques et Mitigations

| **Risque** | **Probabilité** | **Impact** | **Plan de Mitigation** |
|------------|-----------------|------------|------------------------|
| Modifications des exigences en cours | Moyenne | Élevé | Validation formelle à chaque fin de sprint. Backlog priorisé avec le Product Owner. |
| Rate limiting GitHub API (5000 req/h) | Faible | Moyen | Cache Redis TTL 15min + webhooks GitHub pour les mises à jour en temps réel. |
| Retards de livraison | Moyenne | Moyen | Buffer de 2 semaines en fin de planning. Priorisation MoSCoW des features. |
| Failles de sécurité | Faible | Critique | Audit de sécurité dédié au Sprint 7, dépendances scrutées avec Snyk, OWASP ZAP. |
| Mauvaise adoption par les utilisateurs | Faible | Élevé | Tests utilisateurs dès le Sprint 3. Guides vidéo. Session de formation en Sprint 8. |
| Panne du service de stockage fichiers | Très faible | Élevé | Réplication S3 multi-zones ou failover vers MinIO local. Alertes monitoring. |

---

## 10. Glossaire

| **Terme** | **Définition** |
|-----------|----------------|
| **App Router** | Nouveau système de routage de Next.js 13+ basé sur le dossier /app, supportant les Server Components React. |
| **RBAC** | Role-Based Access Control : contrôle d'accès basé sur les rôles attribués à chaque utilisateur. |
| **JWT** | JSON Web Token : mécanisme d'authentification stateless. Access Token de courte durée + Refresh Token longue durée. |
| **2FA / TOTP** | Authentification à deux facteurs par mot de passe temporaire (Google Authenticator, Authy). |
| **SSR** | Server-Side Rendering : rendu des pages côté serveur à chaque requête. Améliore le SEO et le temps de chargement initial. |
| **ORM / Prisma** | Object-Relational Mapper : couche d'abstraction entre le code TypeScript et la base de données PostgreSQL. |
| **Redis** | Base de données clé-valeur en mémoire utilisée pour le cache, les sessions et les files de messages. |
| **RGPD** | Règlement Général sur la Protection des Données : cadre légal européen encadrant le traitement des données personnelles. |
| **RPO / RTO** | Recovery Point Objective (perte de données max tolérée) / Recovery Time Objective (délai max de reprise d'activité). |
| **Webhook** | Mécanisme de notification HTTP push : GitHub envoie automatiquement un appel à notre serveur lors d'un commit ou PR. |
| **Sprint** | Itération de développement de 2 semaines en méthode Agile/Scrum avec planning, développement, revue et rétrospective. |
| **MoSCoW** | Méthode de priorisation : Must have, Should have, Could have, Won't have. Permet de gérer le périmètre en cas de contraintes. |

---

*Cahier des Charges — Système de Gestion de Stagiaires | Version 2.0 — Amélioré & Détaillé*