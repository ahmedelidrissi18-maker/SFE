# Fiche de configuration client

## Objectif

Centraliser les parametres a confirmer avant livraison finale ou deploiement pilote.

## Environnement cible

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| URL publique application | A completer | A valider |
| Environnement | preproduction / production | A valider |
| Nom de domaine | A completer | A valider |
| HTTPS actif | oui / non | A valider |

## Base de donnees

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `DATABASE_URL` | Secret client | A valider |
| PostgreSQL version | 16 recommandee | A valider |
| Backup automatique | oui / non | A valider |
| Retention backups | A completer | A valider |

## Authentification

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `NEXTAUTH_URL` | URL publique | A valider |
| `NEXTAUTH_SECRET` ou `AUTH_SECRET` | Secret client | A valider |
| `TWO_FACTOR_ENCRYPTION_SECRET` | Secret client | A valider |
| Politique 2FA roles sensibles | ADMIN/RH recommande | A valider |

## Redis

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `REDIS_ENABLED` | `true` en production | A valider |
| `REDIS_URL` | Secret client | A valider |
| Usage | rate limiting + notifications distribuees | A valider |

## Stockage documentaire

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `DOCUMENT_STORAGE_DRIVER` | `local` actuellement | A valider |
| `DOCUMENT_STORAGE_LOCAL_ROOT` | Chemin serveur | A valider |
| Sauvegarde fichiers | oui / non | A valider |
| Retention documentaire | A completer | A valider |

## Integrations

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `GITHUB_TOKEN` | Optionnel | A valider |
| `GITHUB_CLIENT_ID` | Optionnel | A valider |
| `GITHUB_CLIENT_SECRET` | Optionnel | A valider |
| `AUTH_GOOGLE_CLIENT_ID` | Optionnel | A valider |
| `AUTH_GOOGLE_CLIENT_SECRET` | Optionnel | A valider |
| `AUTH_GITHUB_CLIENT_ID` | Optionnel | A valider |
| `AUTH_GITHUB_CLIENT_SECRET` | Optionnel | A valider |

## Jobs internes

| Parametre | Valeur client | Statut |
| --- | --- | --- |
| `NOTIFICATIONS_PROCESSOR_SECRET` | Secret client si route appelee hors session | A valider |
| Strategie de declenchement | cron / appel manuel / plateforme | A valider |

## Validation finale

La livraison finale peut etre validee lorsque :

- toutes les valeurs obligatoires sont renseignees hors depot Git ;
- les secrets ne sont jamais commits ;
- `/api/health` retourne un statut exploitable ;
- un backup base et documents est disponible ;
- un responsable client a valide les parametres ci-dessus.

## Validation projet

Validation des parametres de livraison confirmee par le porteur du projet le 2026-05-08.
