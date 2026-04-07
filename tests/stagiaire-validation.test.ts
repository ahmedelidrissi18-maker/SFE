import { describe, expect, it } from "vitest";
import { stagiaireFormSchema } from "@/lib/validations/stagiaire";

describe("stagiaireFormSchema", () => {
  it("accepts a valid stagiaire payload", () => {
    const result = stagiaireFormSchema.safeParse({
      nom: "El Idrissi",
      prenom: "Amina",
      email: "amina@example.com",
      cin: "AB123456",
      telephone: "0600000000",
      dateNaissance: "2002-04-15",
      etablissement: "ENSA",
      specialite: "Genie logiciel",
      niveau: "Bac+5",
      annee: "2025-2026",
      photoUrl: "https://example.com/photo.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid payloads", () => {
    const result = stagiaireFormSchema.safeParse({
      nom: "A",
      prenom: "",
      email: "email-invalide",
      cin: "12",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("normalizes empty optional fields to undefined", () => {
    const result = stagiaireFormSchema.parse({
      nom: "Bennani",
      prenom: "Karim",
      email: "karim@example.com",
      cin: "CD567890",
      telephone: "   ",
      etablissement: "",
    });

    expect(result.telephone).toBeUndefined();
    expect(result.etablissement).toBeUndefined();
  });
});
