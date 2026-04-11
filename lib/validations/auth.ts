import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().email("Veuillez saisir un email valide."),
  password: z.string().min(1, "Veuillez renseigner votre mot de passe."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
