import { z } from "zod";

const githubUsernameRegex = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/;

export const githubLinkSchema = z.object({
  stagiaireId: z.string().trim().min(1, "Le stagiaire est obligatoire."),
  username: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .pipe(
      z
        .string()
        .min(1, "Le nom d utilisateur GitHub est obligatoire.")
        .regex(githubUsernameRegex, "Le nom d utilisateur GitHub est invalide."),
    ),
});

export const githubSyncSchema = z.object({
  stagiaireId: z.string().trim().min(1, "Le stagiaire est obligatoire."),
});

export type GithubLinkValues = z.infer<typeof githubLinkSchema>;
