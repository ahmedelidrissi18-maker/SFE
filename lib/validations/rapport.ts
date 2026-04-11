import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

export const rapportFormSchema = z.object({
  rapportId: optionalTrimmedString,
  stageId: z.string().trim().min(1, "Le stage est obligatoire."),
  semaine: z.coerce
    .number()
    .int()
    .min(1, "La semaine doit etre superieure ou egale a 1.")
    .max(52, "La semaine doit rester comprise entre 1 et 52."),
  tachesRealisees: z
    .string()
    .trim()
    .min(10, "Les taches realisees doivent contenir au moins 10 caracteres."),
  difficultes: optionalTrimmedString,
  planSuivant: optionalTrimmedString,
  avancement: z.coerce
    .number()
    .int()
    .min(0, "L avancement doit etre compris entre 0 et 100.")
    .max(100, "L avancement doit etre compris entre 0 et 100."),
  intent: z.enum(["draft", "submit"]),
});

export const rapportReviewSchema = z
  .object({
    rapportId: z.string().trim().min(1, "Le rapport est obligatoire."),
    commentaireEncadrant: optionalTrimmedString,
    intent: z.enum(["validate", "return"]),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "return" && !data.commentaireEncadrant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commentaireEncadrant"],
        message: "Un commentaire est obligatoire pour retourner un rapport.",
      });
    }
  });

export type RapportFormValues = z.infer<typeof rapportFormSchema>;
export type RapportReviewValues = z.infer<typeof rapportReviewSchema>;
