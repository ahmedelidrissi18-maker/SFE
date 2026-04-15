import { describe, expect, it } from "vitest";
import { GithubSyncStatus } from "@prisma/client";
import {
  getGithubSyncStatusLabel,
  normalizeGithubUsername,
  parseGithubRepositoryUrl,
} from "@/lib/github/service";

describe("github service helpers", () => {
  it("normalise un username GitHub", () => {
    expect(normalizeGithubUsername("  @octocat ")).toBe("octocat");
  });

  it("parse une URL de depot GitHub exploitable", () => {
    expect(parseGithubRepositoryUrl("https://github.com/openai/openai-node")).toEqual({
      owner: "openai",
      name: "openai-node",
      fullName: "openai/openai-node",
      htmlUrl: "https://github.com/openai/openai-node",
    });
  });

  it("ignore les URL non GitHub", () => {
    expect(parseGithubRepositoryUrl("https://gitlab.com/openai/openai-node")).toBeNull();
  });

  it("mappe les statuts de synchronisation", () => {
    expect(getGithubSyncStatusLabel(GithubSyncStatus.SUCCESS)).toBe("Synchro OK");
    expect(getGithubSyncStatusLabel(GithubSyncStatus.RATE_LIMITED)).toBe("Quota GitHub");
    expect(getGithubSyncStatusLabel(GithubSyncStatus.ERROR)).toBe("Erreur sync");
    expect(getGithubSyncStatusLabel()).toBe("Jamais synchronise");
  });
});
