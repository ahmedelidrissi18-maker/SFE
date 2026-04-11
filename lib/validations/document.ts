import { DocumentType } from "@prisma/client";
import { z } from "zod";

const redirectPathSchema = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/"), "Le chemin de retour est invalide.");

export const documentUploadSchema = z.object({
  stageId: z.string().trim().min(1, "Le stage est obligatoire."),
  type: z.nativeEnum(DocumentType, {
    error: "Le type de document est invalide.",
  }),
  file: z.custom<File>((value) => value instanceof File, {
    message: "Veuillez selectionner un fichier a televerser.",
  }),
});

export const notificationActionSchema = z.object({
  notificationId: z.string().trim().min(1, "La notification est invalide."),
});

export const stagiaireArchiveSchema = z.object({
  userId: z.string().trim().min(1, "L utilisateur est invalide."),
  stagiaireId: z.string().trim().min(1, "Le stagiaire est invalide."),
  nextActiveValue: z.enum(["true", "false"]).transform((value) => value === "true"),
  returnTo: redirectPathSchema,
});

export type DocumentUploadValues = z.infer<typeof documentUploadSchema>;
