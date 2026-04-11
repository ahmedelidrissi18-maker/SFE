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
  z.string().url("Veuillez saisir une URL de photo valide.").optional(),
);

export const stagiaireFormSchema = z.object({
  stagiaireId: optionalTrimmedString,
  userId: optionalTrimmedString,
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres."),
  prenom: z.string().trim().min(2, "Le prenom doit contenir au moins 2 caracteres."),
  email: z.string().trim().email("Veuillez saisir un email valide."),
  cin: z.string().trim().min(4, "Le CIN est obligatoire."),
  telephone: optionalTrimmedString,
  dateNaissance: optionalTrimmedString,
  etablissement: optionalTrimmedString,
  specialite: optionalTrimmedString,
  niveau: optionalTrimmedString,
  annee: optionalTrimmedString,
  photoUrl: optionalUrlString,
});

export type StagiaireFormValues = z.infer<typeof stagiaireFormSchema>;
