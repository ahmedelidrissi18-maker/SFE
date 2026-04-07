import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

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
  photoUrl: optionalTrimmedString,
});

export type StagiaireFormValues = z.infer<typeof stagiaireFormSchema>;
