# Plan de stabilisation pour une version livrable

## Objectif

Stabiliser l'application "Gestion des stagiaires" afin de passer d'une version de demonstration avancee a une version livrable au client, avec un perimetre clair, des validations reproductibles et une procedure de livraison defendable.

## Verdict actuel

L'application n'est pas encore prete pour une livraison client finale. Elle peut servir de base de recette ou de pilote controle, car le socle applicatif est avance et les tests automatises unitaires passent. Avant livraison, il faut figer le perimetre, nettoyer l'etat Git, valider le build production, executer les parcours E2E critiques et documenter l'exploitation.

## Phase 1 - Figer le perimetre livrable

Priorite : P0

Actions :

1. Lister les fonctionnalites incluses dans la version livrable.
2. Marquer explicitement les fonctionnalites hors perimetre ou prevues en version suivante.
3. Valider les roles cibles : admin, RH, encadrant, stagiaire.
4. Verifier que chaque module visible a un parcours minimal complet.

Criteres de validation :

- le client sait exactement ce qui est livre ;
- aucun ecran incomplet ou experimental n'est expose sans decision ;
- les limites connues sont documentees.

## Phase 2 - Nettoyer et stabiliser le depot

Priorite : P0

Actions :

1. Supprimer les artefacts locaux generes : logs, caches, resultats Playwright, dossiers temporaires.
2. Conserver uniquement les fichiers source, tests, migrations, docs et configuration necessaires.
3. Verifier les fichiers non suivis et decider pour chacun : ajouter, ignorer ou supprimer.
4. Controler la suppression de `RAPPORT.md` racine : `SFE_Docs/RAPPORT.md` est la version officielle.
5. Produire un commit propre de stabilisation.

Criteres de validation :

- `git status` ne contient que des changements intentionnels ;
- aucun cache local ou fichier de log n'est present ;
- le rapport officiel est identifie sans ambiguite.

## Phase 3 - Validation technique

Priorite : P0

Commandes a executer :

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Actions :

1. Corriger toute erreur de lint, typage ou test.
2. Valider le build Next.js en mode production.
3. Verifier que Prisma Client est genere correctement.
4. Tester les migrations sur une base propre.

Criteres de validation :

- lint OK ;
- typage OK ;
- tests unitaires OK ;
- build production OK ;
- migrations applicables depuis zero.

## Phase 4 - Recette fonctionnelle

Priorite : P1

Parcours a valider :

1. Connexion et deconnexion.
2. Connexion avec 2FA pour les roles sensibles.
3. Creation, consultation, modification et archivage d'un stagiaire.
4. Creation et suivi d'un stage.
5. Creation, soumission, retour et validation d'un rapport.
6. Depot, revue, rejet, validation et telechargement d'un document.
7. Creation et validation d'une evaluation.
8. Notifications et compteur temps reel.
9. Dashboard, analytics et export CSV.
10. Recherche globale.

Criteres de validation :

- chaque parcours critique est teste au moins manuellement ;
- les roles n'accedent pas aux donnees non autorisees ;
- les erreurs utilisateur sont comprehensibles ;
- aucun blocage fonctionnel n'est observe.

## Phase 5 - Securite et configuration client

Priorite : P1

Actions :

1. Preparer un `.env.example` complet et coherent.
2. Verifier `NEXTAUTH_SECRET`, `AUTH_SECRET`, OAuth, Redis, base de donnees et stockage documentaire.
3. Activer Redis en production pour le rate limiting et les notifications distribuees.
4. Verifier les headers de securite et les redirections d'acces refuse.
5. Valider la politique de mots de passe et la 2FA.

Criteres de validation :

- aucune valeur secrete n'est versionnee ;
- les variables obligatoires sont documentees ;
- le mode production ne repose pas sur des fallbacks locaux implicites.

## Phase 6 - Exploitation et livraison

Priorite : P1

Livrables :

1. Guide d'installation.
2. Guide de configuration `.env`.
3. Procedure de migration Prisma.
4. Procedure de seed ou creation des comptes initiaux.
5. Procedure de sauvegarde et restauration base de donnees.
6. Runbook d'incident minimal.
7. Checklist de rollback.

Criteres de validation :

- un autre developpeur peut demarrer l'application avec la documentation ;
- le client connait les prerequis techniques ;
- les actions en cas d'echec de deploiement sont definies.

## Checklist Go/No-Go

Go livraison pilote si :

- lint, typage, tests et build passent ;
- les migrations passent sur base propre ;
- les parcours critiques sont valides ;
- l'etat Git est propre ;
- les variables d'environnement client sont preparees ;
- les limites restantes sont documentees.

No-Go livraison finale si :

- le build production echoue ;
- un role peut acceder a des donnees hors perimetre ;
- les workflows rapport, document ou evaluation sont incomplets ;
- les fichiers de livraison contiennent des logs, caches ou secrets ;
- aucune procedure de restauration ou rollback n'est disponible.

## Ordre recommande

1. Nettoyer le depot et clarifier le rapport officiel.
2. Executer lint, typage, tests et build.
3. Corriger les erreurs bloquantes.
4. Lancer une recette manuelle complete.
5. Completer les guides d'exploitation.
6. Figer une version taggee.
7. Livrer en pilote controle.
