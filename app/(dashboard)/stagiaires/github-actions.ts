"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { githubService } from "@/lib/github/service";
import { hasRole } from "@/lib/rbac";
import { githubLinkSchema, githubSyncSchema } from "@/lib/validations/github";

export type GithubActionState = {
  error?: string;
};

function buildReturnUrl(stagiaireId: string, success: string) {
  return `/stagiaires/${stagiaireId}?success=${success}`;
}

async function requireGithubManagerSession() {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, ["ADMIN", "RH"])) {
    return null;
  }

  return session;
}

export async function linkGithubAccountAction(
  _previousState: GithubActionState,
  formData: FormData,
): Promise<GithubActionState> {
  const session = await requireGithubManagerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = githubLinkSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees GitHub invalides.",
    };
  }

  const result = await githubService.connectAccount({
    stagiaireId: parsedData.data.stagiaireId,
    username: parsedData.data.username,
    linkedByUserId: session.user.id,
  });

  if (!result.ok) {
    return {
      error: result.message,
    };
  }

  revalidatePath("/stages");
  revalidatePath(`/stagiaires/${parsedData.data.stagiaireId}`);
  redirect(buildReturnUrl(parsedData.data.stagiaireId, "github-linked"));
}

export async function syncGithubActivityAction(
  _previousState: GithubActionState,
  formData: FormData,
): Promise<GithubActionState> {
  const session = await requireGithubManagerSession();

  if (!session?.user) {
    return { error: "Action non autorisee." };
  }

  const parsedData = githubSyncSchema.safeParse(Object.fromEntries(formData));

  if (!parsedData.success) {
    return {
      error: parsedData.error.issues[0]?.message ?? "Donnees GitHub invalides.",
    };
  }

  const result = await githubService.syncActivity({
    stagiaireId: parsedData.data.stagiaireId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    return {
      error: result.message,
    };
  }

  revalidatePath("/stages");
  revalidatePath(`/stagiaires/${parsedData.data.stagiaireId}`);
  redirect(buildReturnUrl(parsedData.data.stagiaireId, "github-synced"));
}
