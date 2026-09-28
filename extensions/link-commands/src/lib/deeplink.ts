import type { ScriptCommand } from "./types";

type DeeplinkSource = Pick<ScriptCommand, "deeplinkId" | "titleSlug">;

/**
 * Raycast 2's slug rule, the one it applies to both an extension's name and a command's title: accents
 * are folded, anything outside `[a-z0-9 -]` is deleted rather than turned into a separator, and runs of
 * whitespace become a single `-`. So `Toggle Built-in Display` → `toggle-built-in-display`, and
 * `github.com` → `githubcom`, not `github-com`.
 */
export const titleSlug = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/** `environment.raycastVersion` is a plain dotted string such as `1.104.29` or `2.0.3`. */
export const isRaycast2OrLater = (raycastVersion: string) => {
  const major = Number.parseInt(raycastVersion, 10);
  return Number.isFinite(major) && major >= 2;
};

/**
 * The two versions address a Script Command by different keys, and neither resolves the other's form:
 * Raycast 1 takes the filename without its extension under `script-commands/`, Raycast 2 treats Script
 * Commands as an internal extension and takes a slug of `@raycast.title`. A script `flux-quit.sh` titled
 * "Quit Flux" is `raycast://script-commands/flux-quit` on one and
 * `raycast://extensions/raycast/script-commands/quit-flux` on the other. Emitting both is not an option —
 * a toggle reached twice lands where it started — so the running version decides.
 */
export const deeplinkFor = (command: DeeplinkSource, raycastVersion: string) =>
  isRaycast2OrLater(raycastVersion)
    ? `raycast://extensions/raycast/script-commands/${command.titleSlug}`
    : `raycast://script-commands/${encodeURIComponent(command.deeplinkId)}`;

/**
 * Titles are not unique the way paths are, and on Raycast 2 two commands sharing a title slug share a
 * deeplink, which Raycast resolves to whichever it finds first. The extension cannot pick for it, so it
 * only points the collision out. Maps each colliding command's path to the files it collides with.
 */
export const titleCollisions = (commands: Pick<ScriptCommand, "path" | "filename" | "titleSlug">[]) => {
  const bySlug = new Map<string, Pick<ScriptCommand, "path" | "filename">[]>();
  for (const command of commands) {
    bySlug.set(command.titleSlug, [...(bySlug.get(command.titleSlug) ?? []), command]);
  }

  const collisions = new Map<string, string[]>();
  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    for (const command of group) {
      collisions.set(
        command.path,
        group.filter((other) => other.path !== command.path).map((other) => other.filename),
      );
    }
  }

  return collisions;
};
