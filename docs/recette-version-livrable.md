# Recette fonctionnelle version livrable

## Objectif

Valider les parcours critiques avant livraison pilote ou finale.

## Prerequis

- application demarree en mode production ou preproduction ;
- base de donnees migree ;
- comptes de test disponibles pour `ADMIN`, `RH`, `ENCADRANT` et `STAGIAIRE` ;
- Redis disponible si le mode production distribue est active ;
- stockage documentaire accessible en lecture/ecriture.

## Parcours a valider

| Parcours | Role | Statut attendu |
| --- | --- | --- |
| Connexion / deconnexion | Tous | L'utilisateur accede a son espace puis se deconnecte |
| Connexion 2FA | ADMIN/RH | Code TOTP ou code de secours accepte |
| Gestion stagiaire | ADMIN/RH | Creation, consultation, modification, archivage |
| Gestion stage | ADMIN/RH | Creation depuis une fiche stagiaire, consultation liste |
| Rapports | STAGIAIRE/ENCADRANT | Brouillon, soumission, retour, validation |
| Documents | Tous selon role | Depot, revue, rejet, validation, telechargement |
| Evaluations | ENCADRANT/RH/ADMIN | Creation, soumission, validation ou retour |
| Notifications | Tous selon role | Creation, compteur, flux live et page notifications |
| Analytics | ADMIN/RH/ENCADRANT | Dashboard analytics, filtres, export CSV |
| Recherche globale | Utilisateur connecte | Resultats conformes au perimetre du role |
| Securite RBAC | Tous | Acces refuse aux pages hors role |
| Healthcheck | Exploitation | `/api/health` retourne un statut interpretable |

## Anomalies

Chaque anomalie doit indiquer :

- parcours concerne ;
- role utilise ;
- donnees de test ;
- resultat attendu ;
- resultat observe ;
- criticite : bloquante, majeure, mineure.

## Criteres d'acceptation

Go recette pilote si :

- aucun bug bloquant n'est ouvert ;
- les workflows stagiaire, stage, rapport, document et evaluation sont utilisables ;
- les restrictions RBAC principales sont validees ;
- les exports CSV s'ouvrent sans formule executable ;
- les limites restantes sont documentees.

Go livraison finale si :

- la recette pilote est signee ;
- les migrations et le rollback ont ete testes ;
- les guides d'exploitation sont disponibles ;
- le depot Git est propre et tague.

## Validation

Validation metier confirmee par le porteur du projet le 2026-05-08.

Statut : recette acceptee pour passage en pilote controle et preparation de la version livrable finale.

## Etat des smokes automatises

Verifications executees le 2026-05-08 :

- `npm run lint` : OK ;
- `npx tsc --noEmit` : OK ;
- `npm test` : OK, 31 fichiers, 102 tests ;
- `npm run build` : OK ;
- `npx prisma validate` : OK ;
- `npx prisma migrate status` : OK sur PostgreSQL Docker ;
- `npx prisma migrate deploy` : OK sur base propre temporaire ;
- `npm run test:e2e` avec `E2E_DEMO_EMAIL=admin@stagiaires.local` et `E2E_DEMO_PASSWORD=Password123!` : OK, 3 tests passes.
