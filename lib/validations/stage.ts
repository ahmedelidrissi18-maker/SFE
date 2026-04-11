import { StageStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const optionalUrlString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  },
  z.string().url("Veuillez saisir une URL de depot valide.").optional(),
);

export const stageFormSchema = z
  .object({
    stageId: optionalTrimmedString,
    stagiaireId: z.string().trim().min(1, "Le stagiaire est obligatoire."),
    encadrantId: optionalTrimmedString,
    dateDebut: z.string().trim().min(1, "La date de debut est obligatoire."),
    dateFin: z.string().trim().min(1, "La date de fin est obligatoire."),
    departement: z.string().trim().min(2, "Le departement est obligatoire."),
    sujet: z.string().trim().min(4, "Le sujet doit contenir au moins 4 caracteres."),
    githubRepo: optionalUrlString,
    statut: z.nativeEnum(StageStatus),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.dateDebut);
    const end = new Date(data.dateFin);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les dates du stage sont invalides.",
        path: ["dateDebut"],
      });
      return;
    }

    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin doit etre posterieure a la date de debut.",
        path: ["dateFin"],
      });
    }
  });

export type StageFormValues = z.infer<typeof stageFormSchema>;
