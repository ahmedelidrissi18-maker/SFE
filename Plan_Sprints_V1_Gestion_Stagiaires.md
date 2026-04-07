# Plan des Sprints V1

## Application Web Gestion des Stagiaires

## Objectif

Ce document decoupe le projet en sprints afin de livrer une version 1 utilisable de l'application web de gestion des stagiaires.

La V1 doit permettre de couvrir les besoins essentiels :

- authentification
- gestion des roles
- gestion des stagiaires
- gestion des stages
- suivi des rapports hebdomadaires
- gestion documentaire de base
- tableau de bord simple

## Hypotheses de planification

- duree d'un sprint : 2 semaines
- equipe : 1 a 3 developpeurs
- priorite : livrer un MVP stable avant les fonctions avancees
- base technique deja posee :
  - Next.js
  - Prisma
  - PostgreSQL
  - Docker

## Hors perimetre V1

Ces elements sont volontairement repousses apres la V1 :

- integration GitHub avancee
- notifications temps reel
- 2FA
- signature electronique
- analytics avances
- export PDF complexe
- multilingue complet

## Sprint 0 - Cadrage et Stabilisation du Socle

### Objectif

Stabiliser le socle technique deja cree et preparer le projet pour les premiers modules metier.

### Taches

- verifier la structure du projet Next.js
- valider la connexion Prisma avec PostgreSQL
- nettoyer et organiser les dossiers techniques
- definir les conventions de code :
  - nommage
  - architecture des fichiers
  - gestion des erreurs
- completer le schema Prisma si necessaire
- verifier les scripts npm
- documenter le lancement local dans le README

### Livrables

- socle technique stable
- base PostgreSQL fonctionnelle
- schema Prisma valide
- documentation de lancement local

### Critere de fin de sprint

- le projet demarre localement sans erreur
- la base de donnees est accessible
- Prisma genere et synchronise correctement

---

## Sprint 1 - Authentification et RBAC

### Objectif

Permettre aux utilisateurs de se connecter et d'acceder uniquement aux pages autorisees selon leur role.

### Taches

- integrer Auth.js / NextAuth
- implementer le login email + mot de passe
- verifier les mots de passe haches en base
- brancher la page `/login`
- creer la session utilisateur
- ajouter la deconnexion
- implementer la protection des routes
- gerer les roles :
  - ADMIN
  - RH
  - ENCADRANT
  - STAGIAIRE
- proteger :
  - `/dashboard`
  - `/stagiaires`
  - futures routes metier
- preparer une page d'acces refuse
- enregistrer les connexions importantes dans `AuditLog`

### Livrables

- login fonctionnel
- session active
- routes protegees
- controle d'acces par role

### Critere de fin de sprint

- un utilisateur peut se connecter
- un utilisateur non autorise ne peut pas acceder a une page protegee
- la session est correctement maintenue

---

## Sprint 2 - Gestion des Utilisateurs et des Stagiaires

### Objectif

Mettre en place le premier vrai module metier de la V1 : la gestion des stagiaires.

### Taches

- creer la liste des stagiaires connectee a Prisma
- implementer la recherche de stagiaires
- ajouter les filtres :
  - statut
  - departement
  - encadrant
  - etablissement
- creer le formulaire d'ajout d'un stagiaire
- creer le formulaire de modification d'un stagiaire
- gerer l'archivage logique d'un stagiaire
- afficher la fiche detaillee d'un stagiaire
- creer les validations Zod
- gerer les messages d'erreur utilisateur
- tester les operations CRUD principales

### Livrables

- page liste des stagiaires fonctionnelle
- page fiche stagiaire fonctionnelle
- creation et modification d'un stagiaire

### Critere de fin de sprint

- un admin ou RH peut creer, modifier et consulter un stagiaire
- les donnees s'enregistrent bien en base
- les validations empechent les donnees invalides

---

## Sprint 3 - Gestion des Stages et Affectation

### Objectif

Associer un stage a un stagiaire et permettre le suivi administratif du cycle de stage.

### Taches

- creer le modele de creation d'un stage
- lier un stage a un stagiaire
- affecter un encadrant a un stage
- definir les informations de stage :
  - date de debut
  - date de fin
  - departement
  - sujet
  - statut
- empecher plusieurs stages actifs pour un meme stagiaire
- ajouter l'ecran de detail du stage dans la fiche stagiaire
- gerer les statuts :
  - planifie
  - en cours
  - suspendu
  - termine
  - annule
- preparer une vue de base pour les encadrants
- afficher un dashboard simple avec quelques indicateurs reels

### Livrables

- creation de stage
- affectation encadrant
- gestion des statuts
- dashboard de base relie a la base

### Critere de fin de sprint

- un stage peut etre cree et modifie
- un stagiaire ne peut pas avoir plusieurs stages actifs
- les informations du stage apparaissent correctement dans l'interface

---

## Sprint 4 - Rapports Hebdomadaires et Suivi

### Objectif

Permettre au stagiaire de soumettre ses rapports et a l'encadrant de les suivre.

### Taches

- creer le formulaire de rapport hebdomadaire
- gerer les champs :
  - taches realisees
  - difficultes
  - plan suivant
  - avancement
- gerer les statuts du rapport :
  - brouillon
  - soumis
  - valide
  - retourne
- creer la vue "mes rapports" pour le stagiaire
- creer la vue "rapports de mes stagiaires" pour l'encadrant
- ajouter les commentaires de l'encadrant
- empecher plusieurs rapports pour une meme semaine
- afficher l'historique des rapports
- ajouter des indicateurs simples d'avancement

### Livrables

- cycle complet d'un rapport hebdomadaire
- suivi encadrant/stagiaire

### Critere de fin de sprint

- un stagiaire peut soumettre son rapport
- un encadrant peut le valider ou le retourner
- les rapports sont historises correctement

---

## Sprint 5 - Documents et Notifications de Base

### Objectif

Ajouter la gestion documentaire minimale et les notifications essentielles de la V1.

### Taches

- creer le module de televersement de documents
- gerer les categories minimales :
  - CV
  - CIN
  - convention
  - rapport
  - justificatif
- enregistrer les metadonnees en base
- afficher la liste des documents sur la fiche stagiaire
- gerer les droits d'acces aux documents selon le role
- creer les notifications in-app de base
- creer les notifications sur actions critiques :
  - nouveau stagiaire
  - rapport soumis
  - rapport retourne
  - stage proche de la fin
- ajouter la page `/notifications`

### Livrables

- module de documents simple
- centre de notifications minimal

### Critere de fin de sprint

- un fichier peut etre ajoute et relie a un stagiaire ou un stage
- les notifications importantes sont visibles dans l'application

---

## Sprint 6 - Stabilisation, Tests et Mise en Production V1

### Objectif

Finaliser la V1 et la rendre prete pour une utilisation reelle.

### Taches

- tester les parcours principaux
- corriger les bugs fonctionnels
- verifier les droits d'acces sur toutes les routes
- ajouter des tests unitaires sur les fonctions critiques
- ajouter quelques tests E2E sur les parcours essentiels
- ameliorer les messages d'erreur
- verifier les performances de base
- nettoyer l'UI et les incoherences visuelles
- preparer la configuration de production
- documenter la procedure de deploiement
- preparer un jeu de donnees de demonstration

### Parcours a valider

- connexion
- creation stagiaire
- creation stage
- soumission rapport
- validation rapport
- ajout document
- controle des roles

### Livrables

- version 1 stable
- documentation de deploiement
- jeu de test minimum

### Critere de fin de sprint

- les parcours critiques fonctionnent sans erreur bloquante
- la V1 peut etre montree a un utilisateur final
- le projet est deployable en environnement de recette

---

## Resume de la V1

### Modules inclus dans la V1

- authentification
- gestion des roles
- gestion des stagiaires
- gestion des stages
- rapports hebdomadaires
- documents de base
- notifications in-app simples
- dashboard simple

### Modules apres la V1

- GitHub API
- evaluation avancee
- PDF officiels complexes
- emails automatiques complets
- analytics avances
- audit securite pousse

## Ordre de priorite global

1. securite et acces
2. gestion des stagiaires
3. gestion des stages
4. suivi des rapports
5. documents
6. stabilisation

## Recommandation pratique

Comme le socle technique existe deja, le prochain sprint a lancer en implementation est :

### Sprint 1 - Authentification et RBAC

Puis :

### Sprint 2 - Gestion des Utilisateurs et des Stagiaires

Ce sont les deux sprints qui debloquent toute la suite du projet.
