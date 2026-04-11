# Backlog V1 par Sprint

## Application Web Gestion des Stagiaires

Ce document sert de backlog operationnel sprint par sprint pour suivre l'avancement de la version 1.

## Regles d'utilisation

- cocher une tache quand elle est terminee
- ajouter une date ou un responsable si necessaire
- deplacer une tache non finie vers le sprint suivant si besoin
- garder ce document a jour a la fin de chaque sprint

---

## Sprint 0 - Stabilisation du Socle

### Objectif

Rendre le socle technique propre, stable et pret pour les premiers developpements metier.

### Backlog

- [ ] verifier la structure du projet Next.js
- [ ] verifier le bon fonctionnement de PostgreSQL via Docker
- [ ] verifier la connexion Prisma
- [ ] verifier le fichier `.env`
- [ ] verifier les scripts npm (`dev`, `build`, `lint`, `prisma`)
- [ ] nettoyer les fichiers temporaires ou inutiles
- [ ] organiser les dossiers `app`, `components`, `lib`, `prisma`, `types`
- [ ] revoir le schema Prisma initial
- [ ] valider les entites principales
- [ ] documenter la procedure de lancement local dans le README
- [ ] verifier que `npm run lint` passe
- [ ] verifier que `npm run build` passe

### Definition of Done

- [ ] le projet demarre localement
- [ ] la base de donnees est connectee
- [ ] Prisma fonctionne sans erreur
- [ ] le README est a jour

---

## Sprint 1 - Authentification et RBAC

### Objectif

Permettre aux utilisateurs de se connecter et securiser les acces selon leur role.

### Backlog

- [ ] installer et configurer Auth.js / NextAuth
- [ ] creer la configuration auth dans `lib/auth`
- [ ] connecter la table `User` a l'authentification
- [ ] implementer le login email + mot de passe
- [ ] verifier les mots de passe haches
- [ ] brancher le formulaire de la page `/login`
- [ ] gerer les erreurs de connexion
- [ ] creer la session utilisateur
- [ ] ajouter la deconnexion
- [ ] creer un middleware de protection des routes
- [ ] proteger `/dashboard`
- [ ] proteger `/stagiaires`
- [ ] bloquer les acces non autorises
- [ ] gerer les roles `ADMIN`, `RH`, `ENCADRANT`, `STAGIAIRE`
- [ ] creer une page d'acces refuse
- [ ] journaliser les connexions importantes dans `AuditLog`
- [ ] tester le login avec les comptes seed

### Definition of Done

- [ ] un utilisateur peut se connecter
- [ ] un utilisateur peut se deconnecter
- [ ] les routes protegees sont inaccessibles sans session
- [ ] les droits changent selon le role

---

## Sprint 2 - Gestion des Stagiaires

### Objectif

Mettre en place le premier module metier complet de la V1.

### Backlog

- [ ] connecter la page `/stagiaires` a Prisma
- [ ] afficher les vrais stagiaires depuis la base
- [ ] ajouter la recherche par nom
- [ ] ajouter les filtres par departement
- [ ] ajouter les filtres par etablissement
- [ ] ajouter les filtres par encadrant
- [ ] ajouter les filtres par statut
- [ ] creer la page de creation d'un stagiaire
- [ ] creer le formulaire de creation
- [ ] creer les validations Zod du formulaire
- [ ] creer la page de modification d'un stagiaire
- [ ] ajouter l'archivage logique d'un stagiaire
- [ ] creer la page detail d'un stagiaire
- [ ] afficher les informations personnelles
- [ ] afficher les informations academiques
- [ ] gerer les messages de succes et d'erreur
- [ ] ajouter des tests sur le CRUD stagiaire

### Definition of Done

- [ ] un admin ou RH peut creer un stagiaire
- [ ] un admin ou RH peut modifier un stagiaire
- [ ] la liste des stagiaires est reliee a la base
- [ ] les validations bloquent les erreurs de saisie

---

## Sprint 3 - Gestion des Stages

### Objectif

Permettre l'affectation et le suivi administratif d'un stage.

### Backlog

- [x] creer le formulaire de creation d'un stage
- [x] lier un stage a un stagiaire
- [x] affecter un encadrant a un stage
- [x] gerer les dates de debut et de fin
- [x] enregistrer le departement
- [x] enregistrer le sujet
- [x] gerer le statut du stage
- [x] empecher plusieurs stages actifs pour un meme stagiaire
- [x] afficher les informations de stage dans la fiche stagiaire
- [x] permettre la modification d'un stage
- [x] afficher une liste simple des stages
- [x] ajouter quelques indicateurs reels au dashboard
- [x] afficher les stages de l'encadrant connecte
- [x] ajouter des tests sur les regles metier du stage

### Definition of Done

- [x] un stage peut etre cree
- [x] un stage peut etre modifie
- [x] un encadrant peut etre affecte
- [x] un stagiaire ne peut pas avoir plusieurs stages actifs

---

## Sprint 4 - Rapports Hebdomadaires

### Objectif

Suivre l'avancement du stage via les rapports hebdomadaires.

### Backlog

- [x] creer la page `mes rapports`
- [x] creer la page `rapports de mes stagiaires`
- [x] creer le formulaire de rapport hebdomadaire
- [x] ajouter les champs obligatoires
- [x] gerer le statut `BROUILLON`
- [x] gerer le statut `SOUMIS`
- [x] gerer le statut `VALIDE`
- [x] gerer le statut `RETOURNE`
- [x] empecher plusieurs rapports pour la meme semaine
- [x] ajouter le commentaire de l'encadrant
- [x] afficher l'historique des rapports
- [x] afficher l'avancement du stage
- [x] verifier les droits d'acces sur les rapports
- [x] ajouter des tests fonctionnels sur le workflow rapport

### Definition of Done

- [x] un stagiaire peut creer et soumettre un rapport
- [x] un encadrant peut consulter et commenter
- [x] un encadrant peut valider ou retourner un rapport
- [x] les statuts evoluent correctement

---

## Sprint 5 - Documents et Notifications Simples

### Objectif

Ajouter les fonctions complementaires indispensables a la V1.

### Backlog

- [x] creer un module de televersement de documents
- [x] valider les types de fichiers autorises
- [x] valider la taille des fichiers
- [x] enregistrer les metadonnees dans la table `Document`
- [x] afficher les documents dans la fiche stagiaire
- [x] gerer les categories de documents
- [x] securiser l'acces aux documents selon les roles
- [x] creer la page `/notifications`
- [x] creer un centre de notifications simple
- [x] creer une notification lors d'un nouveau rapport soumis
- [x] creer une notification lors d'un rapport retourne
- [x] creer une notification lors d'une creation de stagiaire
- [x] creer une notification de fin de stage proche
- [x] ajouter des tests sur l'upload et les notifications

### Definition of Done

- [x] un document peut etre ajoute et consulte
- [x] les notifications importantes sont visibles
- [x] les droits d'acces sont respectes

---

## Sprint 6 - Stabilisation et Livraison V1

### Objectif

Corriger, tester, finaliser et rendre la V1 presentable et deployable.

### Backlog

- [ ] tester tout le parcours de connexion
- [ ] tester le parcours creation stagiaire
- [ ] tester le parcours creation stage
- [ ] tester le parcours soumission rapport
- [ ] tester le parcours validation rapport
- [ ] tester le parcours ajout document
- [x] tester les restrictions par role
- [ ] corriger les bugs detectes
- [ ] harmoniser les messages d'erreur
- [x] ameliorer l'interface si necessaire
- [ ] nettoyer le code mort
- [ ] verifier les performances de base
- [x] finaliser le README
- [x] documenter la procedure de deploiement
- [x] preparer un jeu de demonstration
- [ ] valider la V1 avec une recette manuelle

### Definition of Done

- [ ] les parcours critiques fonctionnent sans erreur bloquante
- [ ] la V1 peut etre demontree
- [ ] la V1 est prete pour un environnement de recette

---

## Liste de Priorite Immediate

### A lancer maintenant

- [ ] Sprint 1 - Authentification et RBAC
- [ ] Sprint 2 - Gestion des Stagiaires

### A lancer juste apres

- [x] Sprint 3 - Gestion des Stages
- [x] Sprint 4 - Rapports Hebdomadaires

### A lancer maintenant

- [ ] Sprint 6 - Stabilisation et Livraison V1

---

## Suivi Global

- [ ] Sprint 0 termine
- [ ] Sprint 1 termine
- [ ] Sprint 2 termine
- [ ] Sprint 3 termine
- [ ] Sprint 4 termine
- [ ] Sprint 5 termine
- [ ] Sprint 6 termine
- [ ] V1 livree
