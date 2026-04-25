"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  dashboard: "Tableau de bord",
  analytics: "Analytique",
  stagiaires: "Stagiaires",
  stages: "Stages",
  rapports: "Rapports",
  evaluations: "Evaluations",
  documents: "Documents",
  notifications: "Notifications",
  securite: "Securite",
};

export function CurrentPageTitle() {
  const pathname = usePathname();
  const currentSection = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const pageTitle = pageTitles[currentSection] ?? "Gestion des stagiaires";

  return <h1 className="text-xl font-bold tracking-tight text-on-surface sm:text-2xl">{pageTitle}</h1>;
}
