import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  categoryName,
  environmentLabel,
  environmentName,
  facetCounts,
  facetsOf,
  packageLabel,
} from "./convention";
import type { ScriptCommand } from "./types";

const command = (title: string, packageName = "") => ({ title, packageName });
const commands = (...pairs: [string, string][]) =>
  pairs.map(([title, packageName]) => ({ title, packageName })) as ScriptCommand[];

describe("facetsOf", () => {
  it("reads all three axes out of the two fields", () => {
    expect(facetsOf(command("Abacus Board", "Jira · @work · #dev"))).toEqual({
      environment: "work",
      name: "Abacus Board",
      brand: "Jira",
      category: "dev",
    });
  });

  it("leaves the environment absent on a personal command", () => {
    expect(facetsOf(command("Watch Later", "YouTube · #media"))).toEqual({
      environment: undefined,
      name: "Watch Later",
      brand: "YouTube",
      category: "media",
    });
  });

  it("does not depend on field order, because each field carries its own sigil", () => {
    expect(facetsOf(command("Board", "@work · #dev · Jira"))).toEqual(
      facetsOf(command("Board", "Jira · @work · #dev")),
    );
  });

  it("lowercases the sigil values but leaves the brand's own casing alone", () => {
    expect(facetsOf(command("Settings", "The Orchard · @WORK · #Dev"))).toMatchObject({
      environment: "work",
      brand: "The Orchard",
      category: "dev",
    });
  });
});

describe("facetsOf, on shapes it does not control", () => {
  it("still reads the scope from a title written before it moved to the subtitle", () => {
    expect(facetsOf(command("@work · Abacus Board", "Jira"))).toEqual({
      environment: "work",
      name: "Abacus Board",
      brand: "Jira",
      category: undefined,
    });
  });

  it("still reads a category written without the separator", () => {
    expect(facetsOf(command("Netflix", "Netflix #media"))).toMatchObject({ brand: "Netflix", category: "media" });
  });

  it("treats a mid-string @ as part of a name rather than a scope", () => {
    expect(facetsOf(command("Chat @ Mozilla", "Mozilla · #dev"))).toMatchObject({
      environment: undefined,
      name: "Chat @ Mozilla",
    });
  });

  it("treats a spaced @ inside the subtitle as part of the brand", () => {
    expect(facetsOf(command("Chat", "Chat @ Mozilla"))).toMatchObject({
      environment: undefined,
      brand: "Chat @ Mozilla",
    });
  });

  it("degrades to a bare brand for a command that never heard of the convention", () => {
    expect(facetsOf(command("Foo", "example.com"))).toEqual({
      environment: undefined,
      name: "Foo",
      brand: "example.com",
      category: undefined,
    });
  });

  it("degrades to no brand at all when the field is empty", () => {
    expect(facetsOf(command("Foo", "   "))).toEqual({
      environment: undefined,
      name: "Foo",
      brand: undefined,
      category: undefined,
    });
  });
});

describe("display forms", () => {
  it("adds the sigil back for section headers, which double as filter strings", () => {
    expect(environmentLabel("work")).toBe("@work");
    expect(categoryLabel("dev")).toBe("#dev");
  });

  it("title-cases the parsed axes, hyphens included", () => {
    expect(environmentName("work")).toBe("Work");
    expect(categoryName("dev")).toBe("Dev");
    expect(environmentName("client-acme")).toBe("Client Acme");
  });

  it("shows a brand verbatim, so a lowercase name survives", () => {
    expect(packageLabel("npm")).toBe("npm");
    expect(packageLabel("france.tv")).toBe("france.tv");
  });
});

describe("facetCounts", () => {
  it("tallies each axis and sorts by value", () => {
    const counted = facetCounts(
      commands(
        ["Board", "Jira · @work · #dev"],
        ["Notifications", "Jira · @work · #dev"],
        ["Watch Later", "YouTube · #media"],
      ),
    );

    expect(counted.environments).toEqual([{ value: "work", count: 2 }]);
    expect(counted.brands).toEqual([
      { value: "Jira", count: 2 },
      { value: "YouTube", count: 1 },
    ]);
    expect(counted.categories).toEqual([
      { value: "dev", count: 2 },
      { value: "media", count: 1 },
    ]);
  });

  it("counts only what is present, so untagged commands do not become a bucket", () => {
    expect(facetCounts(commands(["Foo", ""], ["Bar", "example.com"]))).toMatchObject({
      environments: [],
      categories: [],
      brands: [{ value: "example.com", count: 1 }],
    });
  });
});
