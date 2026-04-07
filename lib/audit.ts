import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditJsonValue = Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;

type AuditEventInput = {
  userId: string;
  action: string;
  entite: string;
  entiteId: string;
  ancienneValeur?: AuditJsonValue;
  nouvelleValeur?: AuditJsonValue;
  ip?: string;
  userAgent?: string;
};

export async function logAuditEvent(input: AuditEventInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entite: input.entite,
        entiteId: input.entiteId,
        ancienneValeur: input.ancienneValeur,
        nouvelleValeur: input.nouvelleValeur,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    console.error("Unable to write audit log", error);
  }
}
