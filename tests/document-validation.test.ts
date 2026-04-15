import { describe, expect, it } from "vitest";
import {
  documentWorkflowSchema,
  pdfGenerationRequestSchema,
} from "@/lib/validations/document";

describe("document validation", () => {
  it("accepte une transition de soumission simple", () => {
    const result = documentWorkflowSchema.safeParse({
      documentId: "document-1",
      commentaire: "",
      intent: "submit",
    });

    expect(result.success).toBe(true);
  });

  it("exige un motif sur rejet", () => {
    const result = documentWorkflowSchema.safeParse({
      documentId: "document-1",
      commentaire: "",
      intent: "reject",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Un motif est obligatoire pour rejeter un document.",
    );
  });

  it("valide une demande de generation PDF", () => {
    const result = pdfGenerationRequestSchema.safeParse({
      stageId: "stage-1",
      template: "ATTESTATION_STAGE",
    });

    expect(result.success).toBe(true);
  });
});
