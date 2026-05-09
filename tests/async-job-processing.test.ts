import { NotificationDispatchStatus, PdfGenerationStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  notificationPreference: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  notificationDispatchJob: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  pdfGenerationJob: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  stage: {
    findUnique: vi.fn(),
  },
  document: {
    create: vi.fn(),
  },
}));

const storeDocumentBufferMock = vi.hoisted(() => vi.fn());
const buildDocumentStorageKeyMock = vi.hoisted(() => vi.fn());
const buildStoredDocumentNameMock = vi.hoisted(() => vi.fn());
const getPdfTemplateDocumentTypeMock = vi.hoisted(() => vi.fn());
const getPdfTemplateLabelMock = vi.hoisted(() => vi.fn());
const publishNotificationRealtimeEventMock = vi.hoisted(() => vi.fn());
const loggerErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/document-storage", () => ({
  buildDocumentStorageKey: buildDocumentStorageKeyMock,
  storeDocumentBuffer: storeDocumentBufferMock,
}));

vi.mock("@/lib/documents", () => ({
  buildStoredDocumentName: buildStoredDocumentNameMock,
  getPdfTemplateDocumentType: getPdfTemplateDocumentTypeMock,
  getPdfTemplateLabel: getPdfTemplateLabelMock,
}));

vi.mock("@/lib/realtime-notifications", () => ({
  publishNotificationRealtimeEvent: publishNotificationRealtimeEventMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerErrorMock,
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("async job processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.notificationPreference.findMany.mockResolvedValue([]);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });
    prismaMock.notificationDispatchJob.update.mockResolvedValue({});
    prismaMock.pdfGenerationJob.update.mockResolvedValue({});
    buildDocumentStorageKeyMock.mockReturnValue("stage-1/generated/attestation.pdf");
    buildStoredDocumentNameMock.mockImplementation((value: string) => value);
    getPdfTemplateDocumentTypeMock.mockReturnValue("ATTESTATION");
    getPdfTemplateLabelMock.mockReturnValue("Attestation");
    storeDocumentBufferMock.mockResolvedValue({
      location: "local://stage-1/generated/attestation.pdf",
      absolutePath: "C:\\storage\\stage-1\\generated\\attestation.pdf",
    });
    prismaMock.document.create.mockResolvedValue({
      id: "doc-1",
    });
  });

  it("skips a notification job when another worker has already claimed it", async () => {
    prismaMock.notificationDispatchJob.findMany.mockResolvedValue([
      {
        id: "job-1",
        eventType: "DOCUMENT_REJECTED",
        title: "Document rejete",
        message: "Le document doit etre corrige.",
        link: "/documents/doc-1",
        recipientIds: ["user-1"],
        attempts: 0,
        availableAt: new Date("2026-05-08T10:00:00.000Z"),
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
        status: NotificationDispatchStatus.PENDING,
      },
    ]);
    prismaMock.notificationDispatchJob.updateMany.mockResolvedValue({ count: 0 });

    const { processPendingNotificationDispatchJobs } = await import("@/lib/notifications");
    const result = await processPendingNotificationDispatchJobs(1);

    expect(result).toEqual({
      processed: 0,
      pending: 1,
    });
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
    expect(prismaMock.notificationDispatchJob.update).not.toHaveBeenCalled();
  });

  it("processes a notification job only after claiming it atomically", async () => {
    prismaMock.notificationDispatchJob.findMany.mockResolvedValue([
      {
        id: "job-2",
        eventType: "DOCUMENT_REJECTED",
        title: "Document rejete",
        message: "Le document doit etre corrige.",
        link: "/documents/doc-2",
        recipientIds: ["user-1", "user-2"],
        attempts: 1,
        availableAt: new Date("2026-05-08T10:00:00.000Z"),
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
        status: NotificationDispatchStatus.FAILED,
      },
    ]);
    prismaMock.notificationDispatchJob.updateMany.mockResolvedValue({ count: 1 });

    const { processPendingNotificationDispatchJobs } = await import("@/lib/notifications");
    const result = await processPendingNotificationDispatchJobs(1);

    expect(result).toEqual({
      processed: 1,
      pending: 0,
    });
    expect(prismaMock.notificationDispatchJob.updateMany).toHaveBeenCalledWith({
      where: {
        id: "job-2",
        status: NotificationDispatchStatus.FAILED,
        availableAt: new Date("2026-05-08T10:00:00.000Z"),
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
      },
      data: {
        status: NotificationDispatchStatus.PROCESSING,
        attempts: 2,
        lastError: null,
      },
    });
    expect(prismaMock.notification.createMany).toHaveBeenCalled();
    expect(prismaMock.notificationDispatchJob.update).toHaveBeenCalledWith({
      where: { id: "job-2" },
      data: {
        status: NotificationDispatchStatus.COMPLETED,
        processedAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  it("skips a PDF job when another worker has already claimed it", async () => {
    prismaMock.pdfGenerationJob.findMany.mockResolvedValue([
      {
        id: "pdf-job-1",
        stageId: "stage-1",
        template: "ATTESTATION_STAGE",
        requestedByUserId: "user-1",
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
        status: PdfGenerationStatus.PENDING,
      },
    ]);
    prismaMock.pdfGenerationJob.updateMany.mockResolvedValue({ count: 0 });

    const { processPendingPdfGenerationJobs } = await import("@/lib/pdf-service");
    const result = await processPendingPdfGenerationJobs(1);

    expect(result).toEqual({
      processed: 0,
      pending: 1,
    });
    expect(prismaMock.stage.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.document.create).not.toHaveBeenCalled();
    expect(prismaMock.pdfGenerationJob.update).not.toHaveBeenCalled();
  });

  it("processes a PDF job only after claiming it atomically", async () => {
    prismaMock.pdfGenerationJob.findMany.mockResolvedValue([
      {
        id: "pdf-job-2",
        stageId: "stage-1",
        template: "ATTESTATION_STAGE",
        requestedByUserId: "user-1",
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
        status: PdfGenerationStatus.FAILED,
      },
    ]);
    prismaMock.pdfGenerationJob.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.stage.findUnique.mockResolvedValue({
      id: "stage-1",
      departement: "Cloud",
      sujet: "Portail stagiaires",
      dateDebut: new Date("2026-04-01T00:00:00.000Z"),
      dateFin: new Date("2026-06-01T00:00:00.000Z"),
      encadrant: {
        prenom: "Sara",
        nom: "Admin",
      },
      stagiaire: {
        user: {
          prenom: "Ali",
          nom: "Bennani",
        },
      },
      rapports: [],
      evaluations: [],
      documents: [],
    });

    const { processPendingPdfGenerationJobs } = await import("@/lib/pdf-service");
    const result = await processPendingPdfGenerationJobs(1);

    expect(result).toEqual({
      processed: 1,
      pending: 0,
    });
    expect(prismaMock.pdfGenerationJob.updateMany).toHaveBeenCalledWith({
      where: {
        id: "pdf-job-2",
        status: PdfGenerationStatus.FAILED,
        updatedAt: new Date("2026-05-08T10:00:00.000Z"),
      },
      data: {
        status: PdfGenerationStatus.PROCESSING,
        errorMessage: null,
      },
    });
    expect(prismaMock.document.create).toHaveBeenCalled();
    expect(prismaMock.pdfGenerationJob.update).toHaveBeenCalledWith({
      where: { id: "pdf-job-2" },
      data: {
        status: PdfGenerationStatus.COMPLETED,
        outputDocumentId: "doc-1",
        processedAt: expect.any(Date),
      },
    });
  });
});
