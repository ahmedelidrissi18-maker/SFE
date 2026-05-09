import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDocumentStorageKey,
  readDocumentBuffer,
  serializeDocumentLocation,
  storeDocumentBuffer,
} from "@/lib/document-storage";

const tempDirectories: string[] = [];

describe("document storage", () => {
  afterEach(async () => {
    vi.unstubAllEnvs();

    await Promise.all(
      tempDirectories.splice(0).map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    );
  });

  it("stores and reads documents through the local storage adapter", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "sfe-doc-storage-"));
    tempDirectories.push(tempRoot);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DEFAULT_USER_PASSWORD", "Password123!");
    vi.stubEnv("DOCUMENT_STORAGE_LOCAL_ROOT", tempRoot);

    const storageKey = buildDocumentStorageKey({
      stageId: "stage-123",
      filename: "piece.pdf",
      generated: true,
    });

    const storedDocument = await storeDocumentBuffer({
      storageKey,
      buffer: Buffer.from("bonjour"),
    });
    const buffer = await readDocumentBuffer(storedDocument.location);

    expect(storageKey).toBe("stage-123/generated/piece.pdf");
    expect(storedDocument.location).toBe(serializeDocumentLocation(storageKey));
    expect(buffer.toString("utf8")).toBe("bonjour");
  });
});
