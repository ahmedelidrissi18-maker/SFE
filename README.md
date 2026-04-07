# Gestion des Stagiaires

Socle initial d'une application web de gestion des stagiaires basee sur :

- Next.js (App Router)
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS

## Demarrage rapide

1. Installer les dependances

```bash
npm install
```

2. Copier le fichier d'environnement

```bash
copy .env.example .env
```

3. Demarrer PostgreSQL et Redis avec Docker Compose

```bash
docker compose up -d
```

4. Generer le client Prisma

```bash
npm run prisma:generate
```

5. Appliquer la premiere migration

```bash
npm run prisma:migrate
```

6. Inserer les donnees de demo

```bash
npm run db:seed
```

7. Lancer l'application

```bash
npm run dev
```

Application :

- Frontend : `http://localhost:3000`
- PostgreSQL : `localhost:5432`
- Redis : `localhost:6379`

## Scripts utiles

- `npm run dev` : lance Next.js en developpement
- `npm run build` : build de production
- `npm run lint` : verifie le code
- `npm run prisma:generate` : genere le client Prisma
- `npm run prisma:migrate` : cree/applique les migrations
- `npm run prisma:studio` : ouvre Prisma Studio
- `npm run db:seed` : charge les donnees de demonstration
- `npm run db:up` : demarre PostgreSQL et Redis
- `npm run db:down` : arrete PostgreSQL et Redis

## Structure initiale

```text
app/
  (auth)/
  (dashboard)/
  api/
components/
  layout/
  ui/
lib/
prisma/
public/
types/
```

## Comptes de demonstration

Le seed cree ces utilisateurs :

- `admin@stagiaires.local`
- `rh@stagiaires.local`
- `encadrant@stagiaires.local`
- `stagiaire@stagiaires.local`

Mot de passe de demo :

```text
Password123!
```

## Prochaines etapes recommandees

- brancher Auth.js / NextAuth
- proteger les routes par role
- implementer le CRUD stagiaires
- ajouter les formulaires avec Zod + react-hook-form
- creer les premieres migrations metier
