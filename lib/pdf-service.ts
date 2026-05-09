import { PdfGenerationStatus, type Prisma } from "@prisma/client";
import {
  buildDocumentStorageKey,
  storeDocumentBuffer,
} from "@/lib/document-storage";
import {
  buildStoredDocumentName,
  getPdfTemplateDocumentType,
  getPdfTemplateLabel,
  type PdfTemplateKey,
} from "@/lib/documents";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type RequestGenerationInput = {
  stageId: string;
  template: PdfTemplateKey;
  requestedByUserId: string;
};

const winAnsiFallbacks: Record<string, string> = {
  "’": "'",
  "‘": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  "•": "-",
  "…": "...",
  "œ": "oe",
  "Œ": "OE",
  "€": "EUR",
};

function encodePdfWinAnsiText(value: string) {
  return [...value]
    .map((character) => {
      const fallback = winAnsiFallbacks[character];

      if (fallback) {
        return fallback;
      }

      const codePoint = character.codePointAt(0) ?? 0;

      if (codePoint >= 0x20 && codePoint <= 0xff) {
        return character;
      }

      return "?";
    })
    .join("")
    .replace(/[()\\]/g, (match) => `\\${match}`);
}

function buildSimplePdfBuffer(title: string, lines: string[]) {
  const safeTitle = encodePdfWinAnsiText(title);
  const safeLines = [safeTitle, "", ...lines.map(encodePdfWinAnsiText)];
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(${safeTitle}) Tj`,
    "/F1 11 Tf",
    "0 -26 Td",
    ...safeLines.slice(2).map((line) => `(${line || " "}) Tj T*`),
    "ET",
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

async function buildTemplatePayload(stageId: string, template: PdfTemplateKey) {
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      stagiaire: {
        include: {
          user: true,
        },
      },
      encadrant: true,
      rapports: {
        orderBy: [{ semaine: "asc" }],
      },
      evaluations: {
        orderBy: [{ createdAt: "asc" }],
      },
      documents: {
        where: {
          isDeleted: false,
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!stage) {
    throw new Error("stage_not_found_for_pdf_generation");
  }

  const stagiaireName = `${stage.stagiaire.user.prenom} ${stage.stagiaire.user.nom}`.trim();
  const encadrantName = stage.encadrant
    ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`.trim()
    : "Non affecte";
  const baseLines = [
    `Stagiaire: ${stagiaireName}`,
    `Departement: ${stage.departement}`,
    `Sujet: ${stage.sujet}`,
    `Periode: ${stage.dateDebut.toISOString().slice(0, 10)} -> ${stage.dateFin.toISOString().slice(0, 10)}`,
    `Encadrant: ${encadrantName}`,
  ];

  if (template === "ATTESTATION_STAGE") {
    return {
      stage,
      title: `Attestation - ${stagiaireName}`,
      lines: [
        ...baseLines,
        "",
        "Ce document certifie la participation du stagiaire au stage reference ci-dessus.",
      ],
    };
  }

  if (template === "FICHE_RECAP_STAGE") {
    return {
      stage,
      title: `Fiche recapitulative - ${stagiaireName}`,
      lines: [
        ...baseLines,
        "",
        `Rapports: ${stage.rapports.length}`,
        `Evaluations: ${stage.evaluations.length}`,
        `Documents relies: ${stage.documents.length}`,
      ],
    };
  }

  return {
    stage,
    title: `Rapport consolide - ${stagiaireName}`,
    lines: [
      ...baseLines,
      "",
      `Dernier rapport: ${
        stage.rapports.at(-1)
          ? `semaine ${stage.rapports.at(-1)?.semaine} - ${stage.rapports.at(-1)?.statut}`
          : "aucun"
      }`,
      `Derniere evaluation: ${
        stage.evaluations.at(-1)
          ? `${stage.evaluations.at(-1)?.type} - ${stage.evaluations.at(-1)?.status}`
          : "aucune"
      }`,
      "",
      "Synthese generee automatiquement depuis les donnees du stage.",
    ],
  };
}

export async function requestGeneration(input: RequestGenerationInput) {
  const job = await prisma.pdfGenerationJob.create({
    data: {
      stageId: input.stageId,
      requestedByUserId: input.requestedByUserId,
      template: input.template,
      payload: {
        stageId: input.stageId,
        template: input.template,
      } as Prisma.InputJsonValue,
    },
  });

  await processPendingPdfGenerationJobs(1);

  return job.id;
}

export async function getJobStatus(jobId: string) {
  return prisma.pdfGenerationJob.findUnique({
    where: { id: jobId },
  });
}

async function claimPdfGenerationJob(job: {
  id: string;
  status: PdfGenerationStatus;
  updatedAt: Date;
}) {
  const claimResult = await prisma.pdfGenerationJob.updateMany({
    where: {
      id: job.id,
      status: job.status,
      updatedAt: job.updatedAt,
    },
    data: {
      status: PdfGenerationStatus.PROCESSING,
      errorMessage: null,
    },
  });

  return claimResult.count > 0;
}

export async function processPendingPdfGenerationJobs(limit = 5) {
  const jobs = await prisma.pdfGenerationJob.findMany({
    where: {
      status: {
        in: [PdfGenerationStatus.PENDING, PdfGenerationStatus.FAILED],
      },
    },
    orderBy: [{ createdAt: "asc" }],
    take: limit,
  });

  let processed = 0;

  for (const job of jobs) {
    const claimed = await claimPdfGenerationJob(job);

    if (!claimed) {
      continue;
    }

    try {
      const payload = await buildTemplatePayload(job.stageId, job.template as PdfTemplateKey);
      const filename = buildStoredDocumentName(
        `${getPdfTemplateLabel(job.template as PdfTemplateKey)}-${payload.stage.stagiaire.user.nom}.pdf`,
      );
      const storageKey = buildDocumentStorageKey({
        stageId: job.stageId,
        filename,
        generated: true,
      });
      const buffer = buildSimplePdfBuffer(payload.title, payload.lines);

      const storedDocument = await storeDocumentBuffer({
        storageKey,
        buffer,
      });

      const createdDocument = await prisma.document.create({
        data: {
          stageId: payload.stage.id,
          auteurId: job.requestedByUserId,
          type: getPdfTemplateDocumentType(job.template as PdfTemplateKey),
          statut: "VALIDE",
          source: "GENERATED",
          nom: `${payload.title}.pdf`,
          url: storedDocument.location,
          tailleOctets: buffer.length,
          version: 1,
          generatedTemplate: job.template,
          validationRequestedAt: new Date(),
          reviewedByUserId: job.requestedByUserId,
          reviewedAt: new Date(),
          validatedAt: new Date(),
        },
      });

      await prisma.pdfGenerationJob.update({
        where: { id: job.id },
        data: {
          status: PdfGenerationStatus.COMPLETED,
          outputDocumentId: createdDocument.id,
          processedAt: new Date(),
        },
      });

      processed += 1;
    } catch (error) {
      logger.error("documents.pdf_generation.processing_failed", {
        jobId: job.id,
        stageId: job.stageId,
        template: job.template,
        error,
      });
      await prisma.pdfGenerationJob.update({
        where: { id: job.id },
        data: {
          status: PdfGenerationStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "pdf_generation_failed",
        },
      });
    }
  }

  return {
    processed,
    pending: jobs.length - processed,
  };
}

export async function download(jobId: string, actorId: string) {
  const job = await prisma.pdfGenerationJob.findUnique({
    where: { id: jobId },
    include: {
      outputDocument: true,
    },
  });

  if (!job || !job.outputDocument) {
    throw new Error("pdf_job_output_not_ready");
  }

  return {
    documentId: job.outputDocument.id,
    actorId,
  };
}
