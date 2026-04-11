import { describe, expect, it } from "vitest";
import {
  canAccessStageDocuments,
  formatDocumentSize,
  getDocumentTypeLabel,
  validateDocumentUpload,
} from "@/lib/documents";

describe("document helpers", () => {
  it("formats labels and file sizes", () => {
    expect(getDocumentTypeLabel("CONVENTION")).toBe("Convention");
    expect(formatDocumentSize(512)).toBe("512 o");
    expect(formatDocumentSize(2048)).toBe("2.0 Ko");
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
});
