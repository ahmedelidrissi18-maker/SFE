# Workflow Documentaire V2 (Sprint 4)

## Objectif

Industrialiser la gestion documentaire autour d un vrai cycle serveur :

- depot
- en verification
- valide
- rejete

Le lot Sprint 4 couvre aussi :

- la vue dediee `/documents`
- la revue documentaire avec audit
- le rejet notifie via `DOCUMENT_REJECTED`
- le telechargement securise des documents sensibles
- le socle de signature electronique prepare en interne

## Schema Prisma

Le modele `Document` a ete enrichi avec :

- `statut`
- `source`
- `generatedTemplate`
- `validationRequestedAt`
- `reviewedAt`
- `validatedAt`
- `rejectedAt`
- `rejectionReason`
- `signatureStatus`
- `signatureProvider`
- `signatureReference`
- `signaturePreparedAt`
- `signedAt`

Nouveaux enums :

- `DocumentStatus`
- `DocumentSource`
- `SignatureStatus`
- `PdfGenerationStatus`

Nouveaux types documentaires :

- `FICHE_RECAPITULATIVE`
- `RAPPORT_CONSOLIDE`

## Regles metier

- un document charge arrive en statut `DEPOSE`
- seuls les documents `DEPOSE` ou `REJETE` peuvent repartir en revue
- seuls les documents `EN_VERIFICATION` peuvent etre valides ou rejetes
- `ADMIN` et `RH` peuvent traiter tous les documents
- un `ENCADRANT` peut traiter les documents des stages qui lui sont affectes
- un `STAGIAIRE` peut consulter les documents de son stage et re-soumettre ses pieces
- les telechargements sensibles sont traces dans `AuditLog`

## Ecrans livres

- liste documentaire : `/documents`
- detail d un document : `/documents/[id]`
- synthese documentaire mise a jour dans `/stagiaires/[id]`

## Notifications

Le rejet d un document declenche l evenement `DOCUMENT_REJECTED` :

- destinataires : auteur du document et stagiaire rattache, hors acteur courant
- lien direct vers `/documents/[id]`

## Signature

Le Sprint 4 prepare un socle interne sans integration tierce :

- statut `NOT_REQUESTED`, `READY`, `SIGNED`, `FAILED`
- action de preparation de signature
- reference interne `signatureReference`

Cette couche sert de point d integration pour une solution de signature electronique future.
