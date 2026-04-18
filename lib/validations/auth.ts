import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Veuillez saisir un email valide."),
  password: z.string().min(1, "Veuillez renseigner votre mot de passe."),
  twoFactorCode: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value.length === 0 || /^\d{6}$/.test(value), {
      message: "Le code 2FA doit contenir 6 chiffres.",
    }),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const twoFactorTokenSchema = z.object({
  twoFactorCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code 2FA doit contenir 6 chiffres."),
});
