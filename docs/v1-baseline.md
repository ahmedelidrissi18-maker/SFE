# V1 Baseline - Sprint 0A

Date de reference : 2026-04-13

## Objectif

Capturer l etat de sante de la V1 avant le demarrage des modules V2 afin de detecter toute regression.

## Verification technique executee

- `npm run lint` : passe
- `npm test` : passe
  - 10 fichiers de tests
  - 30 tests
  - 0 echec
- `npm run build` : passe
  - build Next.js production genere sans erreur

## Smoke test V1 - parcours critiques

Parcours cibles :

- login
- dashboard
- stagiaires
- RBAC

Etat :

- smoke test automatise ajoute : `tests/smoke-v1-critical.test.ts`
- execution locale : `npm run test:smoke` passe (1 fichier, 3 tests)

Couverture smoke :

- presence des pages critiques (`/login`, `/dashboard`, `/stagiaires`, `/acces-refuse`)
- verification des frontieres public/auth/protege
- verification RBAC minimale sur `/dashboard` et `/stagiaires`

## Conclusion baseline

- V1 est stable au demarrage du Sprint 0A
- la baseline est maintenant verifiee localement et enforcee en CI
