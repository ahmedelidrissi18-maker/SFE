export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics" as const,
    roles: ["ADMIN", "RH", "ENCADRANT"] as const,
  },
  {
    label: "Stagiaires",
    href: "/stagiaires",
    icon: "stagiaires" as const,
    roles: ["ADMIN", "RH"] as const,
  },
  {
    label: "Stages",
    href: "/stages",
    icon: "stages" as const,
    roles: ["ADMIN", "RH", "ENCADRANT"] as const,
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: "rapports" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Evaluations",
    href: "/evaluations",
    icon: "evaluations" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "documents" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: "notifications" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
  },
];
