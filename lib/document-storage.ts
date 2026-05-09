import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAppEnv } from "@/lib/env";

const LOCAL_STORAGE_SCHEME = "local://";

function getDocumentStorageRoot() {
  return path.resolve(getAppEnv().DOCUMENT_STORAGE_LOCAL_ROOT);
}

function normalizeStorageKey(storageKey: string) {
  return storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
}

function resolveLocalPathFromKey(storageKey: string) {
  const root = getDocumentStorageRoot();
  const candidatePath = path.resolve(root, normalizeStorageKey(storageKey));
  const relativePath = path.relative(root, candidatePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("document_storage_path_escape_detected");
  }

  return candidatePath;
}

export function buildDocumentStorageKey(input: {
  stageId: string;
  filename: string;
  generated?: boolean;
}) {
  const segments = [input.stageId];

  if (input.generated) {
    segments.push("generated");
  }

  segments.push(input.filename);

  return normalizeStorageKey(path.posix.join(...segments));
}

export function serializeDocumentLocation(storageKey: string) {
  return `${LOCAL_STORAGE_SCHEME}${normalizeStorageKey(storageKey)}`;
}

function getStorageKeyFromLocation(location: string) {
  if (location.startsWith(LOCAL_STORAGE_SCHEME)) {
    return location.slice(LOCAL_STORAGE_SCHEME.length);
  }

  return null;
}

export async function storeDocumentBuffer(input: {
  storageKey: string;
  buffer: Buffer;
}) {
  const localPath = resolveLocalPathFromKey(input.storageKey);
  const directory = path.dirname(localPath);

  await mkdir(directory, { recursive: true });
  await writeFile(localPath, input.buffer);

  return {
    location: serializeDocumentLocation(input.storageKey),
    absolutePath: localPath,
  };
}

export async function readDocumentBuffer(location: string) {
  const storageKey = getStorageKeyFromLocation(location);

  if (!storageKey) {
    return readFile(location);
  }

  return readFile(resolveLocalPathFromKey(storageKey));
}

export async function getDocumentStorageHealth() {
  const root = getDocumentStorageRoot();

  try {
    await mkdir(root, { recursive: true });
    await access(root);

    return {
      status: "ok" as const,
      detail: "Stockage documentaire accessible.",
      root,
    };
  } catch (error) {
    return {
      status: "down" as const,
      detail: error instanceof Error ? error.message : "document_storage_unreachable",
      root,
    };
  }
}
