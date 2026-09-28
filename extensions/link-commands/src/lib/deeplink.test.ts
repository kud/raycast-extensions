import { describe, expect, it } from "vitest";
import { deeplinkFor, isRaycast2OrLater, titleCollisions, titleSlug } from "./deeplink";
import { parseScriptCommand } from "./parse-script-command";

const script = (title: string) =>
  `#!/bin/bash\n# @raycast.schemaVersion 1\n# @raycast.title ${title}\n# @raycast.mode silent\n`;

describe("titleSlug", () => {
  it("keeps a hyphen inside a word", () => {
    expect(titleSlug("Toggle Built-in Display")).toBe("toggle-built-in-display");
  });

  it("deletes disallowed characters rather than splitting on them", () => {
    expect(titleSlug("github.com")).toBe("githubcom");
    expect(titleSlug("Sprint Board · Linear")).toBe("sprint-board-linear");
  });

  it("folds accents and collapses runs of spaces and hyphens", () => {
    expect(titleSlug("  Café   Crème  ")).toBe("cafe-creme");
    expect(titleSlug("A - B")).toBe("a-b");
  });
});

describe("isRaycast2OrLater", () => {
  it("reads the major version", () => {
    expect(isRaycast2OrLater("1.104.29")).toBe(false);
    expect(isRaycast2OrLater("2.0.0")).toBe(true);
    expect(isRaycast2OrLater("10.1")).toBe(true);
  });

  it("falls back to Raycast 1 on a version it cannot read", () => {
    expect(isRaycast2OrLater("")).toBe(false);
    expect(isRaycast2OrLater("unknown")).toBe(false);
  });
});

describe("deeplinkFor", () => {
  const command = parseScriptCommand({ path: "/scripts/flux.quit.sh", body: script("Quit Flux"), isExecutable: true })!;

  it("addresses Raycast 1 by filename", () => {
    expect(deeplinkFor(command, "1.104.29")).toBe("raycast://script-commands/flux.quit");
  });

  it("addresses Raycast 2 by title slug", () => {
    expect(deeplinkFor(command, "2.0.0")).toBe("raycast://extensions/raycast/script-commands/quit-flux");
  });

  it("encodes a Raycast 1 filename", () => {
    const spaced = parseScriptCommand({ path: "/scripts/my script.sh", body: script("Mine"), isExecutable: true })!;
    expect(deeplinkFor(spaced, "1.0.0")).toBe("raycast://script-commands/my%20script");
  });
});

describe("titleCollisions", () => {
  const parse = (path: string, title: string) => parseScriptCommand({ path, body: script(title), isExecutable: true })!;

  it("pairs commands whose titles slug alike", () => {
    const collisions = titleCollisions([
      parse("/a/github.sh", "github.com"),
      parse("/b/github-work.sh", "GitHub.com"),
      parse("/a/linear.sh", "Linear"),
    ]);

    expect(collisions.get("/a/github.sh")).toEqual(["github-work.sh"]);
    expect(collisions.get("/b/github-work.sh")).toEqual(["github.sh"]);
    expect(collisions.has("/a/linear.sh")).toBe(false);
  });

  it("finds nothing when every title is distinct", () => {
    expect(titleCollisions([parse("/a/x.sh", "X"), parse("/a/y.sh", "Y")]).size).toBe(0);
  });
});
