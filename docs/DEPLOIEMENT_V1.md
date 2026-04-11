# Deploiement V1

## Objectif

Ce guide deploie la V1 de l application de gestion des stagiaires dans un environnement de recette ou de production simple.

## Pre-requis

- Node.js 20+
- npm 10+
- PostgreSQL 15+
- variables d environnement configurees
- acces reseau a la base PostgreSQL

## Variables d environnement

Verifier au minimum les variables suivantes :

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `DEFAULT_USER_PASSWORD` (pour les comptes de demonstration et la creation initiale des comptes stagiaires)

## Preparation

1. Installer les dependances

```bash
npm install
```

2. Generer Prisma

```bash
npx prisma generate
```

3. Synchroniser la base

```bash
npx prisma db push
```

4. Charger les donnees de demonstration si l environnement est une recette

```bash
npm run db:seed
```

## Verification avant mise en ligne

Executer les controles suivants :

```bash
npm run lint
npm test
npm run build
```

## Lancement

### Recette

```bash
npm run dev
```

### Production simple

```bash
npm run build
npm run start
```

## Controles post-deploiement

- verifier l ecran `/login`
- verifier l acces au dashboard
- verifier la liste des stagiaires
- verifier la creation d un rapport
- verifier l ajout d un document
- verifier le centre de notifications

## Donnees stockees localement

Les documents televerses sont stockes dans :

```text
storage/documents/
```

Sur un environnement partage ou durable, prevoir un volume persistant ou un stockage externe.
