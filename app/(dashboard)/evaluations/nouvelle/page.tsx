import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEvaluationFormOptions, saveEvaluationAction } from "@/app/(dashboard)/evaluations/actions";
import { EvaluationForm } from "@/components/features/evaluations/evaluation-form";
import {
  evaluationGridDefinitions,
} from "@/lib/evaluations";

type NewEvaluationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default async function NewEvaluationPage({ searchParams }: NewEvaluationPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "STAGIAIRE") {
    redirect("/acces-refuse");
  }

  const params = (await searchParams) ?? {};
  const defaultStageId = getStringParam(params.stageId)?.trim() ?? "";
  const requestedType = getStringParam(params.type)?.trim() ?? "DEBUT_STAGE";
  const { stages } = await getEvaluationFormOptions();
  const selectedDefinition =
    Object.values(evaluationGridDefinitions).find((definition) => definition.type === requestedType) ??
    evaluationGridDefinitions.DEBUT_STAGE;

  return (
    <EvaluationForm
      title="Planifier une evaluation"
      description="Preparez la grille, renseignez le contexte d evaluation puis soumettez-la au workflow de validation RH."
      action={saveEvaluationAction}
      stages={stages}
      typeDefinitions={Object.values(evaluationGridDefinitions).map((definition) => ({
        value: definition.type,
        label: definition.label,
        description: definition.description,
        criteria: definition.criteria,
      }))}
      defaultValues={{
        stageId: defaultStageId,
        type: selectedDefinition.type,
        scheduledFor: formatDateInput(undefined),
        criteria: selectedDefinition.criteria.map((criterion) => ({
          criterionId: criterion.id,
          label: criterion.label,
          description: criterion.description,
          maxScore: criterion.maxScore,
          score: 0,
          comment: "",
        })),
      }}
      cancelHref="/evaluations"
    />
  );
}
