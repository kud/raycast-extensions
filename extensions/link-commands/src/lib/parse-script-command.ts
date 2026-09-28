import { basename, dirname } from "node:path";
import { titleSlug } from "./deeplink";
import type { ScriptArgument, ScriptCommand } from "./types";

/**
 * Raycast reads a Script Command's metadata from comment lines anywhere near the top of the file,
 * regardless of the language's comment marker (`#`, `//`, `--`, …). Matching on the `@raycast.` token
 * alone rather than on a leading marker is what keeps this working across shell, Node, Python, Swift
 * and AppleScript without a per-language table.
 */
const METADATA_PATTERN = /@raycast\.([A-Za-z][A-Za-z0-9]*)\s*(.*)$/;

export const HEADER_SCAN_LINES = 100;

const ARGUMENT_KEYS = ["argument1", "argument2", "argument3"] as const;

const parseBoolean = (value: string | undefined) => value?.trim().toLowerCase() === "true";

const parseArgument = (raw: string | undefined): ScriptArgument | undefined => {
  if (!raw) return undefined;

  try {
    return JSON.parse(raw) as ScriptArgument;
  } catch {
    return { placeholder: raw };
  }
};

const readMetadata = (body: string) => {
  const metadata: Record<string, string> = {};

  for (const line of body.split("\n").slice(0, HEADER_SCAN_LINES)) {
    const match = line.match(METADATA_PATTERN);
    if (!match) continue;

    const [, key, value] = match;
    if (metadata[key] === undefined) metadata[key] = value.trim();
  }

  return metadata;
};

const stripExtension = (filename: string) => filename.replace(/\.[^.]+$/, "");

export type ParseInput = {
  path: string;
  body: string;
  isExecutable: boolean;
};

/**
 * Keeps both deeplink keys, because Raycast 1 and Raycast 2 address a Script Command differently:
 * `deeplinkId` is the filename without its extension, which Raycast 1 resolves, and `titleSlug` is the
 * slug of `@raycast.title`, which Raycast 2 resolves. `deeplinkFor` picks one for the running version.
 */
export const parseScriptCommand = ({ path, body, isExecutable }: ParseInput): ScriptCommand | undefined => {
  const metadata = readMetadata(body);
  if (!metadata.schemaVersion) return undefined;

  const filename = basename(path);
  const deeplinkId = stripExtension(filename);

  const title = metadata.title || deeplinkId;

  const argumentsList = ARGUMENT_KEYS.map((key) => parseArgument(metadata[key])).filter(
    (argument): argument is ScriptArgument => argument !== undefined,
  );

  return {
    path,
    directory: dirname(path),
    filename,
    deeplinkId,
    titleSlug: titleSlug(title),
    body,
    isExecutable,
    schemaVersion: metadata.schemaVersion,
    title,
    mode: metadata.mode,
    packageName: metadata.packageName,
    icon: metadata.icon,
    iconDark: metadata.iconDark,
    currentDirectoryPath: metadata.currentDirectoryPath,
    needsConfirmation: metadata.needsConfirmation ? parseBoolean(metadata.needsConfirmation) : undefined,
    refreshTime: metadata.refreshTime,
    author: metadata.author,
    authorURL: metadata.authorURL,
    description: metadata.description,
    argumentsList,
  };
};
