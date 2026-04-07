export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard" as const,
    roles: ["ADMIN", "RH", "ENCADRANT", "STAGIAIRE"] as const,
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
];
