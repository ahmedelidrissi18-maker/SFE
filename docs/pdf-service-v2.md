# Service PDF V2 (Sprint 4)

## Objectif

Fournir une premiere generation PDF standard exploitable en production interne.

Le service couvre :

- attestation
- fiche recapitulative
- rapport consolide

## Interface implementee

Le service est centralise dans `lib/pdf-service.ts`.

Fonctions disponibles :

- `requestGeneration({ stageId, template, requestedByUserId })`
- `getJobStatus(jobId)`
- `processPendingPdfGenerationJobs(limit?)`
- `download(jobId, actorId)`

## Mode de fonctionnement

1. creation d un `PdfGenerationJob`
2. traitement immediate du job via `processPendingPdfGenerationJobs`
3. production d un PDF minimal
4. stockage dans `storage/documents/<stageId>/generated`
5. creation d un `Document` de source `GENERATED` et statut `VALIDE`

## Limites actuelles

- rendu PDF minimaliste
- traitement de file immediate dans le process applicatif
- pas encore de worker dedie ni de retry avance
- pas encore de signature externe branchee

## Suites recommandees

1. externaliser le traitement de file PDF
2. enrichir les templates avec charte officielle
3. brancher une solution de signature electronique
4. ajouter des tests E2E et de charge sur les generations simultanees
