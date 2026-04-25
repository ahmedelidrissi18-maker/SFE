# Rapport d'analyse technique et fonctionnelle

## Application de gestion des stagiaires

Date d'analyse : 2026-04-25

Nature du document :

- rapport global d'evaluation technique ;
- synthese fonctionnelle ;
- support exploitable pour soutenance, rapport de fin de projet ou dossier de cadrage technique.

Perimetre de l'etude :

- code source applicatif ;
- architecture Next.js ;
- schema Prisma et migrations ;
- documentation projet disponible dans le depot ;
- scripts de verification et etat de sante de l'application.

Commandes executees pour la validation de l'etat courant :

- `npm run lint` : OK
- `npm test` : OK (`84/84` tests)
- `npm run build` : OK

## 1. Introduction generale

Le present rapport a pour objet d'etudier l'application "Gestion des stagiaires", developpee comme une plateforme web centralisee de suivi administratif, pedagogique et technique du cycle de vie des stages. L'analyse porte a la fois sur la finalite du systeme, sur son architecture logicielle, sur son modele de donnees, sur sa couverture fonctionnelle ainsi que sur son niveau de maturite technique.

Dans de nombreuses organisations, la gestion des stagiaires demeure eclatee entre plusieurs supports : feuilles de calcul, echanges par courriel, documents partages, formulaires bureautiques et validations informelles. Cette fragmentation rend difficile le suivi des parcours, la tracabilite des decisions, la coordination entre les differents acteurs et la production d'indicateurs fiables. L'application analysee repond a cette problematique en proposant un point d'entree unique pour la creation, le suivi, l'evaluation et la cloture des stages.

L'etude menee ici poursuit trois objectifs principaux :

- decrire avec rigueur le systeme et son organisation ;
- evaluer son niveau de qualite technique et fonctionnelle ;
- formuler des recommandations realistes en vue d'une exploitation plus robuste et d'une poursuite de la V2.

## 2. Demarche d'analyse

L'approche retenue repose sur une lecture croisee de plusieurs sources internes au projet :

- l'examen du code source dans `app/`, `components/` et `lib/` ;
- l'etude du schema relationnel dans `prisma/schema.prisma` ;
- la lecture de la documentation de reference, notamment `README.md`, le cahier des charges et les documents du dossier `docs/` ;
- l'execution effective des controles techniques disponibles.

Cette demarche permet de produire un rapport qui ne se limite pas a une description theorique, mais qui s'appuie sur l'etat reel du depot au moment de l'analyse.

## 3. Presentation du projet

### 3.1 Finalite generale

Le projet "Gestion des stagiaires" est une application web interne destinee a centraliser le pilotage des stages au sein d'une meme plateforme. L'objectif n'est pas uniquement d'enregistrer des informations administratives ; il s'agit egalement d'organiser les interactions entre les acteurs, de formaliser les workflows et de fournir une vision consolidee du suivi de chaque stagiaire.

Le systeme couvre notamment :

- la creation et la gestion des fiches stagiaires ;
- la gestion des stages et de leur encadrement ;
- la soumission et la validation des rapports hebdomadaires ;
- la planification et la validation des evaluations ;
- la gestion documentaire ;
- les notifications et les rappels ;
- le suivi de l'activite GitHub ;
- la consultation d'indicateurs analytiques.

### 3.2 Acteurs et roles metier

L'application distingue quatre profils principaux, chacun correspondant a un niveau de responsabilite et a un perimetre d'acces bien defini :

| Role | Positionnement metier |
| --- | --- |
| `ADMIN` | gouvernance globale, administration, securite, supervision transverse |
| `RH` | pilotage RH, suivi administratif, evaluations, documents et vision globale |
| `ENCADRANT` | suivi de proximite des stages, rapports et echeances des stagiaires rattaches |
| `STAGIAIRE` | consultation de son espace personnel, soumission des rapports et depot de documents |

Le choix d'un controle d'acces base sur les roles constitue ici un principe structurant du produit.

## 4. Cadre technologique

### 4.1 Technologies principales

| Domaine | Technologies observees |
| --- | --- |
| Framework full-stack | Next.js `16.2.2` |
| Bibliotheque UI | React `19.2.4` |
| Langage | TypeScript `5` |
| Styles | Tailwind CSS `4` |
| Validation | `zod`, `react-hook-form` |
| Authentification | NextAuth `5.0.0-beta.30`, `bcryptjs`, `otplib`, `qrcode` |
| Base de donnees | PostgreSQL via Prisma `6.18.0` |
| Tests | Vitest `3.2.4` |
| Qualite | ESLint `9` |
| Charge et non-regression | Artillery, Playwright present dans les dependances |

### 4.2 Interpretation des choix techniques

Les technologies retenues sont coherentes avec les objectifs du projet. Next.js fournit un cadre de developpement moderne, particulierement adapte a un monolithe applicatif dans lequel presentation, rendu serveur, actions metier et routes API cohabitent. Prisma apporte une couche d'acces aux donnees fortement typee, utile pour un projet riche en relations metier. TypeScript et Zod renforcent la fiabilite des flux de donnees et reduisent le risque d'erreurs sur les parcours sensibles.

L'ensemble traduit une volonte de construire un socle robuste, suffisamment moderne pour evoluer, tout en conservant une maitrise raisonnable de la complexite.

## 5. Architecture du systeme

### 5.1 Nature de l'architecture

L'application peut etre qualifiee de **monolithe modulaire**. Elle ne repose pas sur une separation frontend/backend sous forme de services distincts ; elle integre dans un meme depot :

- les pages et layouts ;
- les composants d'interface ;
- les server actions ;
- les API routes ;
- la logique metier ;
- la persistence.

Ce choix architectural est pertinent dans le contexte d'un produit interne en croissance :

- il accelere le developpement initial ;
- il reduit les couts de coordination ;
- il facilite le lien entre besoins metier et implementation ;
- il permet un durcissement progressif sans sur-architecturer trop tot.

### 5.2 Organisation des repertoires

```text
app/                     Pages App Router, layouts, server actions et API routes
  (dashboard)/           Modules proteges : dashboard, stagiaires, stages, rapports...
  api/                   Endpoints techniques et d'integration
components/              Composants UI, layout et composants metier
lib/                     Regles metier, services, securite, analytics, notifications
prisma/                  Schema, migrations et seed
tests/                   Tests unitaires, fonctionnels et smoke tests
docs/                    Documentation projet et documents de reference
storage/                 Stockage local des documents
public/                  Assets statiques
```

Cette organisation traduit une separation claire entre presentation, logique et donnees. Le projet est lisible et reste accessible pour une equipe de taille moderee.

### 5.3 Circuit de traitement principal

Le cheminement logique du systeme peut etre resume ainsi :

```text
Utilisateur
   |
   v
Pages / layouts / composants
   |
   +--> Server Components pour les lectures
   +--> Client islands pour les interactions locales
   +--> Server Actions pour les mutations metier
   +--> API Routes pour les flux techniques
   |
   v
lib/ (RBAC, services, notifications, audit, analytics, securite)
   |
   +--> Prisma / PostgreSQL
   +--> GitHub API
   +--> SSE temps reel
   +--> storage/documents
```

Cette architecture montre que `lib/` constitue le coeur metier du systeme.

## 6. Analyse du modele de donnees

### 6.1 Entites principales

| Domaine | Entites centrales |
| --- | --- |
| Utilisateurs | `User`, `Stagiaire` |
| Cycle du stage | `Stage`, `Presence`, `Rapport` |
| Evaluation | `Evaluation`, `EvaluationRevision` |
| Documents | `Document`, `PdfGenerationJob` |
| Notifications | `Notification`, `NotificationPreference`, `NotificationDispatchJob` |
| Audit | `AuditLog` |
| Integration externe | `GithubConnection`, `GithubSyncLog` |

### 6.2 Logique relationnelle

Le schema Prisma suit une modelisation metier claire :

- un `User` peut representer differents profils applicatifs ;
- un `Stagiaire` est rattache a un `User` ;
- un `Stage` relie le stagiaire a son sujet, son encadrant et sa temporalite ;
- les `Rapport`, `Evaluation`, `Document` et `Presence` prolongent le `Stage` par specialisation fonctionnelle ;
- les `Notification` et `AuditLog` assurent respectivement la diffusion d'information et la tracabilite ;
- les entites GitHub prolongent le suivi technique des stages.

### 6.3 Contraintes de coherence

Les contraintes definies dans le schema montrent un niveau de maturite satisfaisant :

- unicite de `User.email` ;
- unicite de `Stagiaire.cin` ;
- unicite de `Rapport(stageId, semaine)` ;
- unicite de `Evaluation(stageId, type)` ;
- unicite de `Presence(stageId, date)` ;
- unicite des preferences de notifications par utilisateur et type d'evenement.

Ces contraintes ne relevent pas seulement de la technique ; elles traduisent une comprehension explicite des invariants metier.

### 6.4 Migrations et evolution du schema

Les migrations presentes dans le depot temoignent d'une construction iterative du produit :

- `0001_init`
- `0002_add_rapport_commentaire`
- `0002_github_sync_core`
- `0003_expand_document_types`
- `0003_notification_preferences_realtime`
- `0004_notification_dispatch_queue`
- `0005_evaluations_workflow`
- `0006_documents_workflow_pdf`
- `0007_analytics_performance_indexes`
- `0008_security_hardening`
- `0009_perf_dashboard_notifications`

Cette chronologie montre une progression par lots fonctionnels. Elle confirme que l'application a deja connu plusieurs cycles d'enrichissement, en particulier autour de GitHub, des notifications, des evaluations, des documents, de l'analytics et de la securite.

## 7. Analyse fonctionnelle de l'application

### 7.1 Authentification et securite

Le systeme integre un ensemble de mecanismes significatifs :

- authentification par identifiants ;
- OAuth en option ;
- sessions JWT ;
- 2FA TOTP pour les roles sensibles ;
- audit des connexions ;
- rate limiting sur les routes sensibles.

Le controle d'acces est applique a plusieurs niveaux :

- via `proxy.ts` ;
- dans les pages ;
- dans les server actions ;
- dans les API routes ;
- dans les filtres de visibilite metier.

Cette redondance maitrisee renforce la securite applicative.

### 7.2 Dashboard

Le dashboard constitue le point d'entree principal pour les utilisateurs authentifies. Il propose :

- des indicateurs adaptes au role ;
- des alertes et priorites ;
- des raccourcis d'action ;
- une vue des rapports recents ;
- une vue sur les echeances proches ;
- un compteur de notifications ;
- une alerte 2FA si necessaire.

La recentralisation du shell du dashboard cote serveur renforce a la fois la performance et la sobriete de l'interface.

### 7.3 Gestion des stagiaires et des stages

Le tandem `stagiaires` / `stages` constitue le socle metier du produit. Il permet :

- la creation des profils ;
- l'organisation du suivi administratif ;
- l'affectation d'un encadrant ;
- la definition du sujet, du departement et des dates ;
- la consultation de fiches detaillees.

Cette partie structure l'ensemble des autres modules, qui viennent ensuite se brancher sur le stage.

### 7.4 Rapports hebdomadaires

Le workflow des rapports est bien formalise :

- creation en brouillon ;
- soumission ;
- validation ;
- retour pour correction.

Le module traduit une logique pedagogique utile, dans laquelle le rapport n'est pas un simple document archive, mais un objet de dialogue entre le stagiaire et son encadrant.

### 7.5 Evaluations

Le module evaluations apporte une formalisation plus institutionnelle du suivi :

- planification d'evaluations ;
- grilles structurees ;
- notes et commentaires ;
- historique des revisions ;
- validation RH ou administrative.

Cette partie contribue a professionnaliser le dispositif de suivi.

### 7.6 Gestion documentaire

Le module documentaire couvre :

- le depot de documents ;
- la revue ;
- la validation ou le rejet ;
- le telechargement securise ;
- la generation de PDF metier.

Le systeme repond deja a un besoin administratif concret, meme si son mode de stockage local montre qu'il reste a faire pour une exploitation distribuee.

### 7.7 Notifications

Le systeme de notifications est a la fois persistant et reactif :

- centre de notifications ;
- compteur de non lues ;
- preferences par type d'evenement ;
- diffusion live via SSE ;
- file de dispatch pour les cas plus lourds.

Les optimisations recentes ont ameliore ce sous-systeme :

- store client unique ;
- reduction des ecoutes en double ;
- diminution des remounts inutiles ;
- reponse plus rapide du processeur de notifications.

### 7.8 Integration GitHub

L'integration GitHub constitue une valeur ajoutee forte pour les stages techniques. Elle permet :

- la liaison d'un compte GitHub ;
- l'association d'un depot au stage ;
- la synchronisation des commits, pull requests et issues ;
- l'alimentation de notifications et d'une lecture plus objective de l'activite.

Cette integration renforce la dimension professionnalisante du produit.

### 7.9 Analytics

Le module analytics propose :

- des KPI adaptes au role ;
- des vues de synthese et de detail ;
- des filtres de periode ;
- des exports CSV ;
- des alertes ;
- des mecanismes d'observabilite metier.

Ce niveau de pilotage depasse le simple tableau de bord de consultation et s'inscrit dans une logique d'aide a la decision.

## 8. Performance et experience utilisateur

L'analyse recente du dashboard montre une attention explicite portee a la performance :

- reduction de l'hydratation globale ;
- shell serveur pour les composants de layout ;
- ilots client limites aux interactions necessaires ;
- store unique pour les notifications ;
- streaming progressif de certaines sections ;
- suppression de remounts evitables.

Ces evolutions sont positives a plusieurs titres :

- elles ameliorent la reactivite percue ;
- elles reduisent le volume de JavaScript hydrate ;
- elles structurent mieux la frontiere entre rendu serveur et interactions client.

L'application ne se contente donc pas d'etre fonctionnelle ; elle engage egalement un travail de rationalisation technique.

## 9. Evaluation de la qualite logicielle

### 9.1 Lisibilite et organisation

Le code est globalement bien organise. Les responsabilites sont identifiables et les conventions de nommage sont coherentes avec le domaine fonctionnel. La logique metier n'est pas excesivement diluee dans les composants de presentation, ce qui facilite la comprehension et la maintenance.

### 9.2 Validation et typage

L'usage combine de TypeScript, Prisma et Zod constitue un point fort significatif. Cette combinaison permet :

- de typer les contrats de donnees ;
- de valider les entrees utilisateur ;
- de fiabiliser les parcours de mutation ;
- de reduire les erreurs de raccord entre UI, logique et persistence.

### 9.3 Tests et verification

L'etat courant de la verification est satisfaisant.

| Controle | Resultat |
| --- | --- |
| `npm run lint` | OK |
| `npm test` | OK (`84/84` tests) |
| `npm run build` | OK |

Ce point est important dans une perspective academique et professionnelle : le projet ne repose pas uniquement sur une demonstration visuelle, mais sur une base validee par des verifications concretes.

### 9.4 Conclusion sur la qualite du code

Le niveau de qualite peut etre considere comme bon pour un projet applicatif de cette envergure. Le depot presente :

- une structure saine ;
- une logique metier explicite ;
- une base de donnees solide ;
- une verification technique effective ;
- une trajectoire d'amelioration visible.

## 10. Limites et points de vigilance

Malgre ses qualites, le projet presente encore certaines limites structurelles qu'il convient de signaler avec objectivite.

### 10.1 Temps reel en memoire

Le mecanisme de diffusion temps reel repose encore sur des structures en memoire de processus. Cette solution est acceptable pour :

- le developpement local ;
- la demonstration ;
- une exploitation simple sur une seule instance.

En revanche, elle devient insuffisante dans un contexte distribue ou multi-instance.

### 10.2 Stockage documentaire local

Les documents sont conserves dans `storage/`. Cette approche simplifie le developpement mais pose plusieurs limites :

- dependance au serveur hebergeant le processus ;
- fragilite en cas de redemarrage ou de deploiement multi-noeuds ;
- difficulte de gestion de la retention et de la scalabilite.

### 10.3 Heterogeneite historique

Comme dans de nombreux projets iteratifs, certaines traces d'evolution subsistent :

- dependances preparees pour des usages futurs ;
- conventions historiques encore visibles ;
- numerotation Prisma devenue moins lisible.

Il ne s'agit pas d'un symptome critique, mais d'un sujet de rationalisation a moyen terme.

## 11. Recommandations

### 11.1 Recommandations prioritaires

1. Externaliser les mecanismes distribues, en particulier les notifications temps reel et certains etats techniques, vers Redis ou une solution equivalente.
2. Faire evoluer le stockage documentaire vers un object storage avec gestion d'acces securisee.
3. Ajouter une validation centralisee des variables d'environnement au demarrage de l'application.
4. Consolider la couche de tests E2E afin de completer les tests deja presents.
5. Maintenir la coherence documentaire entre `README.md`, `RAPPORT.md`, le cahier des charges et les documents techniques.
6. Poursuivre l'effort de performance sur le dashboard et les pages a forte charge.

### 11.2 Recommandations de moyen terme

- mettre en place une journalisation structuree exploitable en supervision ;
- renforcer la strategie de monitoring et d'alerting ;
- formaliser une politique de retention documentaire ;
- envisager, a terme, l'extraction de certains sous-systemes si la charge ou le perimetre continue d'augmenter.

## 12. Conclusion generale

Au terme de cette analyse, l'application "Gestion des stagiaires" apparait comme un projet solide, bien avance et techniquement credible. Elle ne se limite pas a un prototype demonstratif : elle presente deja les caracteristiques d'un veritable systeme d'information metier, avec une couverture fonctionnelle etendue, une architecture lisible, une base de donnees coherente, des mecanismes de securite serieux et un etat de verification satisfaisant.

Son interet principal reside dans sa capacite a unifier plusieurs dimensions souvent traitees separement :

- le suivi administratif ;
- le suivi pedagogique ;
- le suivi technique ;
- le pilotage analytique ;
- la tracabilite et la securite.

D'un point de vue academique, le projet constitue donc un cas pertinent de conception et d'implementation d'une application web metier moderne, dans laquelle les choix techniques sont globalement alignes sur les besoins fonctionnels. D'un point de vue professionnel, il fournit une base exploitable et evolutive, a condition de poursuivre l'effort d'industrialisation sur les aspects distribues, documentaires et d'exploitation.

En consequence, ce projet peut etre qualifie de **coherent, mature a l'echelle de son perimetre actuel, et tout a fait defendable dans le cadre d'une soutenance ou d'un rapport de fin de projet**.
