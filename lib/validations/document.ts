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

export const documentWorkflowSchema = z
  .object({
    documentId: z.string().trim().min(1, "Le document est invalide."),
    commentaire: z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),
    intent: z.enum(["submit", "validate", "reject", "prepare-signature", "mark-signed"]),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "reject" && !data.commentaire) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commentaire"],
        message: "Un motif est obligatoire pour rejeter un document.",
      });
    }
  });

export const pdfGenerationRequestSchema = z.object({
  stageId: z.string().trim().min(1, "Le stage est obligatoire."),
  template: z.enum(["ATTESTATION_STAGE", "FICHE_RECAP_STAGE", "RAPPORT_CONSOLIDE_STAGE"]),
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
export type DocumentWorkflowValues = z.infer<typeof documentWorkflowSchema>;
export type PdfGenerationRequestValues = z.infer<typeof pdfGenerationRequestSchema>;
