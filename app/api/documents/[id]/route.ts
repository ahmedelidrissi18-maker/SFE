import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canAccessStageDocuments,
  getDocumentContentType,
  getDocumentDownloadName,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Non authentifie", { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      stage: {
        include: {
          stagiaire: true,
        },
      },
    },
  });

  if (!document || document.isDeleted) {
    return new NextResponse("Document introuvable", { status: 404 });
  }

  const canAccess = canAccessStageDocuments(session.user.role, {
    isStageOwner: document.stage.stagiaire.userId === session.user.id,
    isAssignedEncadrant: document.stage.encadrantId === session.user.id,
  });

  if (!canAccess) {
    return new NextResponse("Acces refuse", { status: 403 });
  }

  try {
    const buffer = await readFile(document.url);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getDocumentContentType(document.nom),
        "Content-Disposition": `attachment; filename="${getDocumentDownloadName(document.nom, document.version)}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Lecture impossible", { status: 500 });
  }
}
