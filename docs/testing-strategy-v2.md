# Strategie de tests V2 (Sprint 0B)

Date : 2026-04-13

## Objectif

Assurer la non-regression de la V1 pendant l implementation des modules V2, puis couvrir les nouveaux flux V2 par paliers.

## Pyramide de tests

- unitaires : Vitest
- integration : Vitest (couche metier, persistence, adaptateurs de services)
- smoke non-regression V1 : Vitest (`tests/smoke-v1-critical.test.ts`)
- E2E (progressif Sprint 1+) : Playwright
- charge baseline : Artillery

## Gates CI obligatoires sur PR

Le workflow CI execute et doit rester vert :

- `npm run lint`
- `npm test`
- `npm run test:smoke`
- `npm run build`
- `npm run test:load:baseline`

## Seuils minimaux Sprint 0B

- 100% des tests existants V1 passent
- smoke V1 critique passe a 100%
- build production passe a 100%
- baseline charge Artillery executee sans erreur critique

## Evolution des seuils (rappel plan V2)

- Sprint 1-2 : >= 70% couverture unitaire sur code ajoute/modifie
- Sprint 3-5 : >= 75%
- Sprint 6 : >= 80%

## Parcours V1 surveilles en continu

- login
- dashboard
- stagiaires
- frontieres RBAC

## Kickoff Sprint 1 - lots deja couverts

- tests unitaires helper GitHub : parsing depot, normalisation username, mapping statuts
- tests validations GitHub : liaison compte et lancement de synchronisation
- tests helper OAuth GitHub : cookie/state/url d autorisation
- tests routes GitHub : refus login/role non autorise + callback OAuth valide/invalide
- verification locale executee :
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npm run test:load:baseline`

## Sprint 2 - premier lot deja couvert

- tests helpers notifications : labels + catalogue d evenements
- tests realtime : publication SSE vers le bon utilisateur
- tests route processeur de file : acces non autorise + traitement admin
- verification locale executee :
  - `npm run lint`
  - `npm test`
  - `npm run build`

## Regle d arret

Aucun merge vers `main` si une gate CI echoue.
