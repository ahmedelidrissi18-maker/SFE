import { describe, expect, it } from "vitest";
import {
  canManageDocumentReview,
  canPrepareDocumentSignature,
  canReviewDocument,
  canSubmitDocumentForReview,
  canAccessStageDocuments,
  formatDocumentSize,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getPdfTemplateLabel,
  resolveDocumentStatus,
  resolveDocumentType,
  validateDocumentUpload,
} from "@/lib/documents";

describe("document helpers", () => {
  it("formats labels and file sizes", () => {
    expect(getDocumentTypeLabel("CONVENTION")).toBe("Convention");
    expect(getDocumentTypeLabel("FICHE_RECAPITULATIVE")).toBe("Fiche recapitulative");
    expect(getDocumentStatusLabel("EN_VERIFICATION")).toBe("En verification");
    expect(getPdfTemplateLabel("RAPPORT_CONSOLIDE_STAGE")).toBe("Rapport consolide");
    expect(formatDocumentSize(512)).toBe("512 o");
    expect(formatDocumentSize(2048)).toBe("2.0 Ko");
  });

  it("resolves known document filters and ignores invalid ones", () => {
    expect(resolveDocumentStatus("valide")).toBe("VALIDE");
    expect(resolveDocumentStatus("unexpected")).toBeNull();
    expect(resolveDocumentType("rapport")).toBe("RAPPORT");
    expect(resolveDocumentType("not-a-type")).toBeNull();
  });

  it("validates uploads", () => {
    const validFile = new File(["content"], "piece.pdf", {
      type: "application/pdf",
    });

    expect(validateDocumentUpload(validFile)).toBeNull();
    expect(validateDocumentUpload(null)).toBe("Le fichier est obligatoire.");
  });

  it("checks document access by role", () => {
    expect(
      canAccessStageDocuments("ADMIN", {
        isStageOwner: false,
        isAssignedEncadrant: false,
      }),
    ).toBe(true);

    expect(
      canAccessStageDocuments("ENCADRANT", {
        isStageOwner: false,
        isAssignedEncadrant: true,
      }),
    ).toBe(true);

    expect(
      canAccessStageDocuments("STAGIAIRE", {
        isStageOwner: false,
        isAssignedEncadrant: false,
      }),
    ).toBe(false);
  });

  it("applies workflow guards", () => {
    expect(canSubmitDocumentForReview("DEPOSE")).toBe(true);
    expect(canSubmitDocumentForReview("VALIDE")).toBe(false);
    expect(canReviewDocument("EN_VERIFICATION")).toBe(true);
    expect(canReviewDocument("REJETE")).toBe(false);
    expect(
      canManageDocumentReview("ENCADRANT", {
        isAssignedEncadrant: true,
      }),
    ).toBe(true);
    expect(canPrepareDocumentSignature("RH")).toBe(true);
    expect(canPrepareDocumentSignature("STAGIAIRE")).toBe(false);
  });
});
