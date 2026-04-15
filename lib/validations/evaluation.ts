import { EvaluationType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

const optionalDateString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  },
  z.string().optional(),
);

const notesJsonSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  z.array(
    z.object({
      criterionId: z.string().trim().min(1, "Le critere est obligatoire."),
      score: z.coerce.number().min(0, "La note ne peut pas etre negative."),
      comment: optionalTrimmedString,
    }),
  ),
);

export const evaluationFormSchema = z
  .object({
    evaluationId: optionalTrimmedString,
    stageId: z.string().trim().min(1, "Le stage est obligatoire."),
    type: z.nativeEnum(EvaluationType),
    scheduledFor: optionalDateString,
    commentaire: optionalTrimmedString,
    commentaireEncadrant: optionalTrimmedString,
    notesJson: notesJsonSchema,
    intent: z.enum(["draft", "submit"]),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledFor) {
      const scheduledAt = new Date(`${data.scheduledFor}T00:00:00.000Z`);

      if (Number.isNaN(scheduledAt.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduledFor"],
          message: "La date planifiee de l evaluation est invalide.",
        });
      }
    }

    if (data.notesJson.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notesJson"],
        message: "La grille d evaluation est vide.",
      });
    }
  });

export const evaluationReviewSchema = z
  .object({
    evaluationId: z.string().trim().min(1, "L evaluation est obligatoire."),
    commentaireRh: optionalTrimmedString,
    intent: z.enum(["validate", "return"]),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "return" && !data.commentaireRh) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commentaireRh"],
        message: "Un commentaire RH est obligatoire pour retourner une evaluation.",
      });
    }
  });

export type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;
export type EvaluationReviewValues = z.infer<typeof evaluationReviewSchema>;
