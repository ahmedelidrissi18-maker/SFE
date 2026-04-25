export const navigationItems = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: "dashboard" as const,
    section: "accueil" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Analytique",
    href: "/analytics",
    icon: "analytics" as const,
    section: "accueil" as const,
    roles: ["ADMIN", "RH", "ENCADRANT"] as const,
  },
  {
    label: "Stagiaires",
    href: "/stagiaires",
    icon: "stagiaires" as const,
    section: "suivi" as const,
    roles: ["ADMIN", "RH"] as const,
  },
  {
    label: "Stages",
    href: "/stages",
    icon: "stages" as const,
    section: "suivi" as const,
    roles: ["ADMIN", "RH", "ENCADRANT"] as const,
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: "rapports" as const,
    section: "suivi" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Évaluations",
    href: "/evaluations",
    icon: "evaluations" as const,
    section: "suivi" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "documents" as const,
    section: "suivi" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: "notifications" as const,
    section: "compte" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Sécurité",
    href: "/securite",
    icon: "security" as const,
    section: "compte" as const,
    roles: ["ADMIN", "RH"] as const,
  },
];

export type NavigationItem = (typeof navigationItems)[number];
export type NavigationSection = NavigationItem["section"];
