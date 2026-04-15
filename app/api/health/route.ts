import { NextResponse } from "next/server";
import { getObservabilitySnapshot } from "@/lib/observability";

export async function GET() {
  const observability = getObservabilitySnapshot();

  return NextResponse.json({
    status: observability.status === "critical" ? "degraded" : "ok",
    service: "gestion-stagiaires",
    timestamp: new Date().toISOString(),
    observability,
  });
}
