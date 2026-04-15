import { z } from "zod";

export const notificationPreferenceSchema = z.object({
  eventType: z.string().trim().min(1, "Le type de notification est obligatoire."),
  inAppEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
  liveEnabled: z.enum(["true", "false"]).transform((value) => value === "true"),
});
