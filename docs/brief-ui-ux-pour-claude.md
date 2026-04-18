# Brief UI/UX Detaille Pour Claude

Date : 2026-04-15

## Objectif du document

Ce document sert de brief complet a transmettre a Claude pour qu il puisse proposer et implementer des ameliorations UI/UX sur l application web de gestion des stagiaires.

L objectif n est pas de refaire l application depuis zero, ni de casser les workflows existants, mais de :

- ameliorer la lisibilite globale
- clarifier les parcours utilisateur
- rendre l interface plus coherente entre modules
- ameliorer l ergonomie sur desktop et mobile
- renforcer les feedbacks visuels et les etats UX
- moderniser la presentation tout en respectant le contexte d un outil interne de gestion

---

## Resume executif a transmettre

L application est une plateforme web interne de gestion du cycle de vie des stagiaires. La V2 est deja tres avancee et couvre la quasi-totalite du coeur fonctionnel.

Modules deja presents :

- authentification par email et mot de passe
- RBAC par role
- gestion des stagiaires
- gestion des stages
- rapports hebdomadaires
- notifications in-app et temps reel
- integration GitHub
- evaluations structurees
- workflow documentaire avance
- generation PDF
- analytics decisionnel
- securite renforcee avec page dediee et socle 2FA

Le besoin UX ne porte donc pas sur un prototype ou une maquette hors sol. Claude doit travailler sur une application existante, reliee a des donnees reelles, avec des contraintes metier, techniques et de securite deja en place.

---

## Contexte produit

### Nature de l application

- application web interne
- usage administratif, RH, encadrement et suivi stagiaire
- outil de gestion operationnelle et de pilotage
- interface orientee efficacite, fiabilite, lisibilite et prise de decision

### Problemes que le produit resout

L application remplace un suivi disperse entre :

- feuilles Excel
- documents manuels
- echanges informels
- validations peu tracees
- suivi technique fragmentaire

### Valeur attendue du point de vue UX

L interface doit :

- reduire la charge cognitive
- rendre les statuts comprehensibles rapidement
- rendre les actions prioritaires evidentes
- faciliter la navigation entre modules
- donner confiance dans les traitements sensibles
- rendre les KPI et donnees plus faciles a lire et exploiter

---

## Roles metier a prendre en compte

Claude doit garder en tete que l interface n a pas les memes attentes selon le role connecte.

### `ADMIN`

Objectif principal :

- vision transverse
- supervision globale
- acces a tous les modules de pilotage

UX attendue :

- lisibilite systemique
- acces rapide aux modules transverses
- sensation de controle et de supervision

### `RH`

Objectif principal :

- gestion des stagiaires et des stages
- validation des rapports, evaluations et documents
- consultation analytics

UX attendue :

- flux clairs
- statuts explicites
- actions prioritaires mises en avant
- parcours administratifs rassurants

### `ENCADRANT`

Objectif principal :

- suivi des stages
- relecture des rapports
- revue des evaluations
- suivi GitHub sur son perimetre

UX attendue :

- vues operationnelles
- acces rapide aux stagiaires suivis
- elements de contexte visibles sans surcharge

### `STAGIAIRE`

Objectif principal :

- consulter son espace
- soumettre ses rapports
- suivre ses evaluations et documents
- recevoir les notifications utiles

UX attendue :

- interface simple
- navigation peu intimidante
- priorites visibles
- comprehension immediate de ce qui est attendu

---

## Etat du projet au moment du brief

### Avancement global

- Sprint 0A : termine
- Sprint 0B : termine
- Sprint 1 : termine
- Sprint 2 : termine
- Sprint 3 : termine
- Sprint 4 : termine
- Sprint 5 : termine
- Sprint 6 : en cours

### Ce qui reste surtout ouvert pour la fin de V2

- suite E2E Playwright partagee
- finalisation de la verification finale
- release / rollback / go-no-go

Cela signifie que les changements UI/UX doivent etre faits avec prudence :

- pas de regression sur les parcours existants
- pas de modification inutile des comportements metier
- pas de degradation du Sprint 6 securite

---

## Stack technique et cadre de travail

Claude doit travailler dans ce cadre :

- framework : Next.js 16 App Router
- langage : TypeScript
- UI : React 19 + Tailwind CSS 4
- auth : NextAuth credentials
- ORM : Prisma 6
- base de donnees : PostgreSQL
- temps reel : SSE
- tests existants : Vitest

### Consequences directes pour les choix UI/UX

- il faut respecter le modele App Router
- il faut faire attention a la separation server / client
- il faut conserver la logique metier dans `lib/`
- il faut reutiliser au maximum les composants existants
- il faut eviter une explosion du nombre de composants redondants

---

## Architecture a respecter

### Dossiers principaux

- `app/` : pages, layouts, routes API, server actions
- `components/` : composants UI et composants metier
- `lib/` : logique metier, helpers, RBAC, analytics, audit, securite
- `prisma/` : schema, migrations, seed
- `docs/` : documentation
- `tests/` : tests unitaires et integration legere

### Regle de base

Claude ne doit pas deplacer l architecture ou imposer un nouveau systeme de structure tant que ce n est pas strictement necessaire.

Il doit privilegier :

- amelioration incrmentale
- cohérence
- clarte
- extension du systeme existant

---

## Contraintes fonctionnelles non negociables

### A ne pas casser

- authentification
- RBAC
- pages protegees
- workflows metier
- server actions
- routes API existantes
- analytics
- documents
- rapports
- evaluations
- notifications
- securite

### A respecter absolument

- la langue de l interface est le francais
- le vocabulaire metier doit rester stable
- les libelles de statuts doivent rester comprehensibles
- les actions sensibles doivent conserver une presentation rassurante et claire

### Exemples de vocabulaire a conserver

- stagiaire
- encadrant
- RH
- rapport
- evaluation
- document
- validation
- rejet
- notification
- analytics
- securite

---

## Positionnement UX attendu

Claude ne doit pas traiter l application comme un site marketing. C est un outil interne de gestion.

### Le bon ton UI/UX

- professionnel
- lisible
- fiable
- dense mais bien organise
- moderne sans etre demonstratif
- efficace sans etre austere

### Ce qu il faut eviter

- refonte spectaculaire de type landing page
- decoration excessive
- animations gratuites
- couleurs trop agressives
- composants trop "showcase"
- discontinuites visuelles fortes entre pages

### Ce qu il faut viser

- meilleure hierarchie visuelle
- meilleurs espaces et alignements
- meilleurs etats vides
- meilleurs messages de feedback
- meilleurs filtres et formulaires
- meilleure navigation
- meilleure lisibilite des KPI et cartes de donnees

---

## Modules UI a analyser en priorite

Claude doit inspecter en priorite les pages et composants qui structurent toute l experience.

### Shell global

Fichiers importants :

- `app/(dashboard)/layout.tsx`
- `components/layout/app-sidebar.tsx`
- `components/layout/app-header.tsx`
- `lib/navigation.ts`

Questions UX a se poser :

- la navigation est-elle suffisamment claire ?
- les roles comprennent-ils rapidement ou ils se trouvent ?
- le shell est-il coherent entre desktop et mobile ?
- les informations utilisateur sont-elles bien placees ?
- les actions frequentes sont-elles facilement accessibles ?

### Page de connexion

Fichiers importants :

- `app/(auth)/login/page.tsx`
- `components/auth/login-form.tsx`

Questions UX :

- la page inspire-t-elle confiance ?
- les erreurs sont-elles claires ?
- la presence du 2FA est-elle comprehensible ?
- le parcours d entree est-il simple pour un utilisateur interne ?

### Dashboard

Fichier important :

- `app/(dashboard)/dashboard/page.tsx`

Questions UX :

- les priorites du role courant sont-elles visibles ?
- les cartes de metriques sont-elles lisibles ?
- le dashboard aide-t-il reellement a agir ?
- les sections ont-elles une bonne hierarchie ?

### Stagiaires

Fichiers importants :

- `app/(dashboard)/stagiaires/page.tsx`
- `app/(dashboard)/stagiaires/[id]/page.tsx`
- `app/(dashboard)/stagiaires/nouveau/page.tsx`
- `components/features/stagiaires/stagiaire-form.tsx`

Questions UX :

- les listes sont-elles faciles a parcourir ?
- les filtres sont-ils ergonomiques ?
- la fiche stagiaire aide-t-elle a comprendre rapidement la situation ?
- les formulaires sont-ils simples et rassurants ?

### Stages

Fichiers importants :

- `app/(dashboard)/stages/page.tsx`
- `app/(dashboard)/stages/[id]/modifier/page.tsx`
- `components/features/stages/stage-form.tsx`

Questions UX :

- les stages actifs / planifies / termines sont-ils bien distingues ?
- les informations critiques sont-elles faciles a reperer ?

### Rapports

Fichiers importants :

- `app/(dashboard)/rapports/page.tsx`
- `app/(dashboard)/rapports/[id]/page.tsx`
- `app/(dashboard)/rapports/nouveau/page.tsx`
- `components/features/rapports/rapport-form.tsx`
- `components/features/rapports/rapport-review-form.tsx`

Questions UX :

- le statut d un rapport est-il evident ?
- l utilisateur comprend-il ce qu il doit faire ensuite ?
- la relecture et le feedback sont-ils bien mis en scene ?

### Evaluations

Fichiers importants :

- `app/(dashboard)/evaluations/page.tsx`
- `app/(dashboard)/evaluations/[id]/page.tsx`
- `app/(dashboard)/evaluations/nouvelle/page.tsx`
- `components/features/evaluations/evaluation-form.tsx`
- `components/features/evaluations/evaluation-review-form.tsx`

Questions UX :

- la structure d evaluation est-elle lisible ?
- les transitions de statut sont-elles bien comprises ?
- les notes, commentaires et syntheses sont-ils bien organises ?

### Documents

Fichiers importants :

- `app/(dashboard)/documents/page.tsx`
- `app/(dashboard)/documents/[id]/page.tsx`
- `components/features/documents/document-upload-form.tsx`
- `components/features/documents/document-review-form.tsx`
- `components/features/documents/pdf-generation-form.tsx`

Questions UX :

- les documents sensibles sont-ils presentes avec assez de clarte ?
- les statuts de depot / verification / validation / rejet sont-ils evidents ?
- les actions disponibles sont-elles faciles a comprendre ?

### Notifications

Fichiers importants :

- `app/(dashboard)/notifications/page.tsx`
- `components/features/notifications/live-notification-link.tsx`
- `components/features/notifications/live-notifications-listener.tsx`

Questions UX :

- la lecture rapide des notifications est-elle bonne ?
- le lien entre evenement, urgence et action est-il clair ?

### Analytics

Fichier important :

- `app/(dashboard)/analytics/page.tsx`

Questions UX :

- les KPI sont-ils bien hierarchises ?
- les filtres sont-ils clairs ?
- la densite d information reste-t-elle maitrisable ?

### Securite

Fichier important :

- `app/(dashboard)/securite/page.tsx`

Questions UX :

- la page est-elle rassurante ?
- le 2FA est-il explique clairement ?
- les actions sensibles sont-elles suffisamment encadrees visuellement ?

---

## Composants UI existants a reutiliser ou etendre

Claude doit partir des composants deja presents et les etendre proprement avant d en introduire de nouveaux.

Fichiers importants :

- `components/ui/page-header.tsx`
- `components/ui/card.tsx`
- `components/ui/metric-card.tsx`
- `components/ui/status-badge.tsx`
- `components/ui/empty-state.tsx`
- `components/ui/feedback-banner.tsx`

### Intention

Le but est de construire une meilleure coherence systeme :

- memes patterns de titre
- memes patterns de cartes
- memes badges de statut
- memes styles pour les etats vides
- memes conventions de feedback

---

## Attentes UX detaillees

### 1. Hierarchie visuelle

Claude doit verifier :

- les titres de page
- les sous-titres
- les zones prioritaires
- les CTA
- les sections secondaires
- les contrastes de lecture

Objectif :

- comprendre une page en quelques secondes

### 2. Navigation

Claude doit verifier :

- lisibilite de la sidebar
- ordre des items
- comprehension des libelles
- signaux de position courante
- fluidite entre liste / detail / edition

Objectif :

- reduire la sensation de dispersion

### 3. Formulaires

Claude doit verifier :

- taille et alignement des champs
- lisibilite des labels
- aide contextuelle
- feedback d erreur
- clarté des boutons d action

Objectif :

- rendre la saisie plus simple, moins anxiogene et plus fiable

### 4. Etats et feedback utilisateur

Claude doit verifier :

- etats vides
- etats d erreur
- messages de succes
- badges de statut
- transitions d action

Objectif :

- l utilisateur doit toujours savoir ce qui vient de se passer et quoi faire ensuite

### 5. Densite informationnelle

Claude doit ajuster :

- l espacement
- les regroupements
- les cartes trop chargees
- les blocs denses
- les listes longues

Objectif :

- mieux respirer sans appauvrir l information

### 6. Responsive

Claude doit inspecter :

- sidebar sur petits ecrans
- formulaires longs
- tableaux et cartes denses
- actions secondaires sur mobile

Objectif :

- garder une application utilisable sur laptop compact et tablette, pas seulement sur grand ecran

### 7. Accessibilite de base

Claude doit verifier au minimum :

- contrastes
- focus visibles
- labels
- messages d erreur comprensibles
- taille de cible cliquable
- lecture des statuts

Objectif :

- ameliorer la robustesse d usage sans engager une refonte accessibilite complete

---

## Hypotheses UX prioritaires que Claude peut challenger

Voici des angles d amelioration probables qu il peut investiguer :

- le shell global peut etre plus clair et plus stable
- le dashboard peut mieux reflecter les priorites metier selon le role
- les listes de stagiaires, rapports, documents et evaluations peuvent gagner en lisibilite
- les formulaires peuvent etre plus guides
- les badges et libelles de statuts peuvent etre plus explicites
- les pages analytics peuvent gagner en structure et en respiration
- les etats vides et feedbacks peuvent etre renforces

---

## Comptes de test a fournir a Claude

Utiliser ces comptes pour verifier l experience par role :

- `admin@stagiaires.local` / `Password123!`
- `rh1@stagiaires.local` / `Password123!`
- `encadrant1@stagiaires.local` / `Password123!`
- `stagiaire1@stagiaires.local` / `Password123!`

Point important :

- le 2FA admin n est pas active actuellement en base locale

---

## Fichiers a lire en premier

Ordre recommande pour qu il monte vite en contexte :

1. `docs/rapport-global-application.md`
2. `README.md`
3. `app/(dashboard)/layout.tsx`
4. `components/layout/app-sidebar.tsx`
5. `components/layout/app-header.tsx`
6. `components/ui/page-header.tsx`
7. `components/ui/card.tsx`
8. `components/ui/metric-card.tsx`
9. `components/ui/status-badge.tsx`
10. `components/ui/empty-state.tsx`
11. `components/ui/feedback-banner.tsx`
12. `app/(auth)/login/page.tsx`
13. `components/auth/login-form.tsx`
14. `app/(dashboard)/dashboard/page.tsx`
15. `app/(dashboard)/stagiaires/page.tsx`
16. `app/(dashboard)/stages/page.tsx`
17. `app/(dashboard)/rapports/page.tsx`
18. `app/(dashboard)/evaluations/page.tsx`
19. `app/(dashboard)/documents/page.tsx`
20. `app/(dashboard)/notifications/page.tsx`
21. `app/(dashboard)/analytics/page.tsx`
22. `app/(dashboard)/securite/page.tsx`

---

## Ce qui est attendu de Claude

### Phase 1 : audit

Il doit commencer par :

- un audit UI/UX concret
- une liste priorisee des problemes
- une analyse par impact utilisateur
- une distinction entre quick wins et chantiers plus larges

### Phase 2 : plan d amelioration

Il doit ensuite proposer :

- un plan d amelioration realiste
- un ordre d execution
- des changements compatibles avec l architecture existante

### Phase 3 : implementation

Il doit ensuite implementer directement les changements les plus utiles, en veillant a :

- garder la coherence globale
- ne pas casser les parcours
- ne pas multiplier inutilement les patterns visuels

---

## Format de livrable ideal de la part de Claude

On peut lui demander de structurer sa reponse ainsi :

- audit priorise
- hypothese de direction UX
- plan d amelioration
- modifications implementees
- points de vigilance ou risques

---

## Prompt detaille pret a transmettre a Claude

```text
Tu travailles sur une application web interne de gestion des stagiaires.

Contexte produit :
- Application V2 deja fonctionnelle
- Modules presents : authentification, RBAC, stagiaires, stages, rapports, notifications temps reel, GitHub, evaluations, documents/PDF, analytics, securite
- Roles : ADMIN, RH, ENCADRANT, STAGIAIRE
- Langue : francais
- Il faut conserver le vocabulaire metier et ne pas casser les workflows existants

Stack :
- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Prisma
- PostgreSQL
- NextAuth

Contraintes :
- Preserver l architecture existante
- Respecter les server components et server actions
- Ne pas casser auth, RBAC, securite, routes protegees, workflows metier
- Reutiliser et etendre les composants UI existants avant d en recreer de nouveaux
- L application est un outil interne de gestion, donc viser une UX claire, fiable, lisible et efficace, pas une refonte marketing

Contexte UX :
- L application est deja riche fonctionnellement
- Le besoin n est pas de reinventer le produit, mais de l ameliorer
- Il faut clarifier la hierarchie visuelle, la navigation, les formulaires, les feedbacks, les etats vides, le responsive et l accessibilite de base
- Il faut faire attention a la coherence entre les roles et entre les modules

Comptes de test :
- admin@stagiaires.local / Password123!
- rh1@stagiaires.local / Password123!
- encadrant1@stagiaires.local / Password123!
- stagiaire1@stagiaires.local / Password123!

Le 2FA admin n est pas active actuellement.

Lis d abord ces fichiers :
- C:/Users/User/SFE/docs/rapport-global-application.md
- C:/Users/User/SFE/README.md
- C:/Users/User/SFE/app/(dashboard)/layout.tsx
- C:/Users/User/SFE/components/layout/app-sidebar.tsx
- C:/Users/User/SFE/components/layout/app-header.tsx
- C:/Users/User/SFE/components/ui/page-header.tsx
- C:/Users/User/SFE/components/ui/card.tsx
- C:/Users/User/SFE/components/ui/metric-card.tsx
- C:/Users/User/SFE/components/ui/status-badge.tsx
- C:/Users/User/SFE/components/ui/empty-state.tsx
- C:/Users/User/SFE/components/ui/feedback-banner.tsx
- C:/Users/User/SFE/app/(auth)/login/page.tsx
- C:/Users/User/SFE/components/auth/login-form.tsx
- C:/Users/User/SFE/app/(dashboard)/dashboard/page.tsx
- C:/Users/User/SFE/app/(dashboard)/stagiaires/page.tsx
- C:/Users/User/SFE/app/(dashboard)/stages/page.tsx
- C:/Users/User/SFE/app/(dashboard)/rapports/page.tsx
- C:/Users/User/SFE/app/(dashboard)/evaluations/page.tsx
- C:/Users/User/SFE/app/(dashboard)/documents/page.tsx
- C:/Users/User/SFE/app/(dashboard)/notifications/page.tsx
- C:/Users/User/SFE/app/(dashboard)/analytics/page.tsx
- C:/Users/User/SFE/app/(dashboard)/securite/page.tsx

Ce que j attends :
1. Fais un audit UI/UX concret et priorise
2. Identifie les problemes de hierarchie visuelle, navigation, densite, feedback utilisateur, etats vides, formulaires, mobile et accessibilite
3. Propose des ameliorations realistes et coherentes avec l application existante
4. Implemente directement les ameliorations les plus importantes
5. Garde une coherence entre les pages et entre les roles
6. Ne touche pas au metier si ce n est pas necessaire pour l UX
7. Si tu modifies le shell global, assure-toi que toutes les pages restent coherentes

Objectifs UX :
- meilleure lisibilite
- meilleure clarte des parcours
- meilleure comprehension des statuts
- meilleure ergonomie des formulaires
- meilleur responsive
- meilleure coherence visuelle
- meilleure experience de navigation

Commence par me donner :
- un audit priorise
- un plan d amelioration concret
- puis implemente les changements les plus utiles
```

---

## Variante courte du prompt

Si vous voulez un prompt plus compact a transmettre rapidement :

```text
Travaille sur l UI/UX de cette application web interne de gestion des stagiaires en conservant le metier, le RBAC, l architecture Next.js App Router et les composants existants.

Lis d abord :
- C:/Users/User/SFE/docs/rapport-global-application.md
- C:/Users/User/SFE/README.md
- C:/Users/User/SFE/app/(dashboard)/layout.tsx
- C:/Users/User/SFE/components/layout/app-sidebar.tsx
- C:/Users/User/SFE/components/layout/app-header.tsx
- C:/Users/User/SFE/components/ui/page-header.tsx
- C:/Users/User/SFE/components/ui/card.tsx
- C:/Users/User/SFE/components/ui/metric-card.tsx
- C:/Users/User/SFE/components/ui/status-badge.tsx
- C:/Users/User/SFE/components/ui/empty-state.tsx
- C:/Users/User/SFE/components/ui/feedback-banner.tsx
- C:/Users/User/SFE/app/(auth)/login/page.tsx
- C:/Users/User/SFE/components/auth/login-form.tsx
- C:/Users/User/SFE/app/(dashboard)/dashboard/page.tsx
- C:/Users/User/SFE/app/(dashboard)/stagiaires/page.tsx
- C:/Users/User/SFE/app/(dashboard)/stages/page.tsx
- C:/Users/User/SFE/app/(dashboard)/rapports/page.tsx
- C:/Users/User/SFE/app/(dashboard)/evaluations/page.tsx
- C:/Users/User/SFE/app/(dashboard)/documents/page.tsx
- C:/Users/User/SFE/app/(dashboard)/notifications/page.tsx
- C:/Users/User/SFE/app/(dashboard)/analytics/page.tsx
- C:/Users/User/SFE/app/(dashboard)/securite/page.tsx

Comptes de test :
- admin@stagiaires.local / Password123!
- rh1@stagiaires.local / Password123!
- encadrant1@stagiaires.local / Password123!
- stagiaire1@stagiaires.local / Password123!

Donne-moi d abord un audit UI/UX priorise, puis un plan d amelioration concret, puis implemente les changements les plus utiles sans casser les workflows existants.
```

---

## Recommandation pratique d utilisation

La meilleure facon d utiliser ce brief avec Claude est :

1. lui envoyer ce document
2. lui demander d abord un audit priorise
3. valider avec lui la direction visuelle et ergonomique
4. lui demander ensuite d implementer par lots

### Lots recommandes

- lot 1 : shell global + navigation + dashboard
- lot 2 : formulaires et feedbacks
- lot 3 : listes, statuts et pages detail
- lot 4 : responsive + accessibilite de base

---

## Conclusion

Claude doit intervenir comme un partenaire d amelioration sur un produit deja en production interne, pas comme un outil de refonte aveugle.

Le bon resultat attendu est :

- une interface plus lisible
- une navigation plus simple
- des workflows plus clairs
- une meilleure coherence visuelle
- une meilleure experience pour chaque role
- sans regression metier ni destabilisation du socle V2

