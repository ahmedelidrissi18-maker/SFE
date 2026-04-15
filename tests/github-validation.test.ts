import { describe, expect, it } from "vitest";
import { githubLinkSchema, githubSyncSchema } from "@/lib/validations/github";

describe("github validations", () => {
  it("accepte un username GitHub valide et retire @", () => {
    const parsed = githubLinkSchema.parse({
      stagiaireId: "stagiaire-1",
      username: "@octocat",
    });

    expect(parsed.username).toBe("octocat");
  });

  it("rejette un username GitHub invalide", () => {
    const result = githubLinkSchema.safeParse({
      stagiaireId: "stagiaire-1",
      username: "bad user",
    });

    expect(result.success).toBe(false);
  });

  it("valide la demande de synchronisation", () => {
    const result = githubSyncSchema.safeParse({
      stagiaireId: "stagiaire-1",
    });

    expect(result.success).toBe(true);
  });
});
