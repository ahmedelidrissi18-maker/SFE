import bcrypt from "bcryptjs";
import { PrismaClient, Role, StageStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@stagiaires.local" },
    update: {},
    create: {
      nom: "Admin",
      prenom: "Systeme",
      email: "admin@stagiaires.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "rh@stagiaires.local" },
    update: {},
    create: {
      nom: "Ressources",
      prenom: "Humaines",
      email: "rh@stagiaires.local",
      passwordHash,
      role: Role.RH,
    },
  });

  const encadrant = await prisma.user.upsert({
    where: { email: "encadrant@stagiaires.local" },
    update: {},
    create: {
      nom: "Karim",
      prenom: "Bennani",
      email: "encadrant@stagiaires.local",
      passwordHash,
      role: Role.ENCADRANT,
    },
  });

  const stagiaireUser = await prisma.user.upsert({
    where: { email: "stagiaire@stagiaires.local" },
    update: {},
    create: {
      nom: "Amina",
      prenom: "El Idrissi",
      email: "stagiaire@stagiaires.local",
      passwordHash,
      role: Role.STAGIAIRE,
    },
  });

  const stagiaire = await prisma.stagiaire.upsert({
    where: { userId: stagiaireUser.id },
    update: {},
    create: {
      userId: stagiaireUser.id,
      cin: "AB123456",
      telephone: "0600000000",
      etablissement: "ENSA",
      specialite: "Genie logiciel",
      niveau: "Bac+5",
      annee: "2025-2026",
    },
  });

  await prisma.stage.upsert({
    where: { id: "stage-demo-initial" },
    update: {},
    create: {
      id: "stage-demo-initial",
      stagiaireId: stagiaire.id,
      encadrantId: encadrant.id,
      dateDebut: new Date("2026-04-01T00:00:00.000Z"),
      dateFin: new Date("2026-06-30T00:00:00.000Z"),
      departement: "Informatique",
      sujet: "Portail de gestion des stagiaires",
      githubRepo: "https://github.com/example/gestion-stagiaires",
      statut: StageStatus.EN_COURS,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_INITIAL",
      entite: "SYSTEM",
      entiteId: "bootstrap",
      nouvelleValeur: {
        status: "ok",
      },
      ip: "127.0.0.1",
      userAgent: "seed-script",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
