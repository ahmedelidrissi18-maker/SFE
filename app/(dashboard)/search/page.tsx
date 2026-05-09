import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { searchGlobally, normalizeGlobalSearchQuery } from "@/lib/global-search";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const sectionIcons = {
  stagiaire: "group",
  stage: "work",
  rapport: "description",
  document: "folder",
  evaluation: "grading",
} as const;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const rawQuery = getStringParam(params.q);
  const query = normalizeGlobalSearchQuery(rawQuery);

  const searchResult =
    query.length >= 2
      ? await searchGlobally({
          query,
          role: session.user.role,
          userId: session.user.id,
        })
      : { query, sections: [] };

  const totalResults = searchResult.sections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Recherche globale"
        title={query ? `Resultats pour "${query}"` : "Recherche transverse"}
        description={
          query
            ? `${totalResults} resultat${totalResults > 1 ? "s" : ""} trouve${totalResults > 1 ? "s" : ""} dans votre perimetre visible.`
            : "Retrouvez rapidement un stagiaire, un stage, un rapport, un document ou une evaluation depuis un point d entree unique."
        }
      />

      {query.length === 0 ? (
        <EmptyState
          eyebrow="Point d entree unique"
          title="Lancez une recherche transverse"
          description="Utilisez le champ de recherche du header pour retrouver rapidement une information metier dans les modules visibles pour votre role."
          icon="search"
          align="left"
        />
      ) : query.length < 2 ? (
        <EmptyState
          eyebrow="Recherche"
          title="Affinez votre saisie"
          description="Saisissez au moins 2 caracteres pour declencher une recherche globale exploitable."
          icon="manage_search"
          align="left"
        />
      ) : searchResult.sections.length === 0 ? (
        <EmptyState
          eyebrow="Aucun resultat"
          title="Aucun element ne correspond a votre recherche"
          description="Essayez un nom, un sujet, un departement, un email, un numero de CIN ou le nom d un document."
          icon="search_off"
          align="left"
        />
      ) : (
        <div className="grid gap-5">
          {searchResult.sections.map((section) => (
            <Card key={section.key} className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                    <MaterialSymbol icon={sectionIcons[section.key]} className="text-[20px]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-on-surface">
                      {section.label}
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      {section.items.length} resultat{section.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {section.items.map((item) => (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="group rounded-[24px] bg-surface-container-low p-4 shadow-[var(--shadow-soft)] transition hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-on-surface">{item.title}</p>
                          {item.status ? <StatusBadge status={item.status} /> : null}
                        </div>
                        <p className="text-sm leading-6 text-on-surface-variant">{item.description}</p>
                        {item.meta ? (
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                            {item.meta}
                          </p>
                        ) : null}
                      </div>
                      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        Ouvrir
                        <MaterialSymbol icon="arrow_outward" className="text-[14px]" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
