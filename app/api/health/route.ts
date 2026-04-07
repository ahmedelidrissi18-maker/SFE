import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "gestion-stagiaires",
    timestamp: new Date().toISOString(),
  });
}
