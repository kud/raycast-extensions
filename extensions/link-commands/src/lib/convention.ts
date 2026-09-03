import type { ScriptCommand } from "./types";

/**
 * Script Commands give you two strings — `title` and `packageName` — and no fields for scope,
 * brand or category. Encoding three axes into those two strings is therefore a naming convention
 * rather than a schema, and this module is the one place that knows it:
 *
 *     title        Abacus Board
 *     packageName  Jira · @work · #dev
 *
 *     title        Watch Later
 *     packageName  YouTube · #media
 *
 * The title holds the name and nothing else, so it stays the string you type to find the command.
 * Every other axis rides in `packageName` as a `·`-delimited field that names itself through its
 * sigil, which is why field order is not load-bearing here and a fourth axis would cost nothing.
 *
 * Everything here degrades rather than fails. A command written by someone who has never heard of
 * the convention still parses — it simply has no environment and no category, and its brand is
 * whatever `packageName` happens to hold. That matters because this extension is published: most
 * of its users will have hostnames, bare labels or nothing at all in that field.
 */

const SEPARATOR = "·";

/** A whole field that is nothing but a sigil and a token — `Chat @ Mozilla` has spaces, so it is a brand. */
const ENVIRONMENT_FIELD = /^@([\p{L}\p{N}][\p{L}\p{N}_-]*)$/u;
const CATEGORY_FIELD = /^#([\p{L}\p{N}][\p{L}\p{N}_-]*)$/u;

/** `Brand #category` — the separator-less form that predates the convention. */
const LEGACY_CATEGORY = /^(.*?)\s+#([\p{L}\p{N}][\p{L}\p{N}_-]*)\s*$/u;

/**
 * The scope used to live in the title as `@work · Name`, and commands written before the move still
 * carry it there. Reading it as a fallback keeps this a rename rather than a flag day: a convention
 * that stops recognising its own previous form strands every command not migrated in the same breath.
 */
const LEGACY_TITLE_ENVIRONMENT = new RegExp(`^@([\\p{L}\\p{N}][\\p{L}\\p{N}_-]*)\\s*${SEPARATOR}\\s*(.+)$`, "u");

export type Facets = {
  /** `work` from `Jira · @work`, absent for personal commands. */
  environment?: string;
  /** What the command actually is — the title, with any legacy scope prefix stripped. */
  name: string;
  /** `packageName` with the sigil fields removed. Undefined when nothing is left. */
  brand?: string;
  /** `media` from `YouTube · #media`, absent when untagged. */
  category?: string;
};

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const sigilValue = (field: string | undefined) => field?.slice(1).toLowerCase();

export type PackageFields = Omit<Facets, "name">;

/**
 * The sigil grammar, as one implementation both directions can share. It used to live inside
 * `facetsOf` and be read-only, while the create form slugified a typed `packageName` whole — so the
 * writer could emit `datadog-work.ai-usage.sh` for a subtitle the reader parsed as `Datadog` scoped
 * to `@work`, and the file failed the collection's own naming gate. A parser and a generator that
 * disagree about one grammar keep producing that until they stop being two implementations.
 */
export const splitPackageFields = (packageName: string | undefined): PackageFields => {
  const fields = (clean(packageName) ?? "")
    .split(SEPARATOR)
    .map((field) => field.trim())
    .filter(Boolean);

  const rawBrand = fields
    .filter((field) => !ENVIRONMENT_FIELD.test(field) && !CATEGORY_FIELD.test(field))
    .join(` ${SEPARATOR} `);
  const legacyBrand = rawBrand.match(LEGACY_CATEGORY);

  return {
    environment: sigilValue(fields.find((field) => ENVIRONMENT_FIELD.test(field))),
    brand: clean(legacyBrand ? legacyBrand[1] : rawBrand),
    category: sigilValue(fields.find((field) => CATEGORY_FIELD.test(field))) ?? legacyBrand?.[2].toLowerCase(),
  };
};

export const facetsOf = (command: Pick<ScriptCommand, "title" | "packageName">): Facets => {
  const legacyTitle = command.title.match(LEGACY_TITLE_ENVIRONMENT);
  const name = clean(legacyTitle ? legacyTitle[2] : command.title) ?? command.title;
  const { brand, environment, category } = splitPackageFields(command.packageName);

  return { environment: environment ?? legacyTitle?.[1].toLowerCase(), name, brand, category };
};

const titleCase = (value: string) =>
  value.replace(/[-_]+/g, " ").replace(/\p{L}+/gu, (word) => word[0].toUpperCase() + word.slice(1));

/** Sigil forms, for section headers — they double as the string you would type to filter. */
export const environmentLabel = (environment: string) => `@${environment}`;
export const categoryLabel = (category: string) => `#${category}`;

/** Plain forms, for the dropdown and the detail pane — the row label supplies the axis, so the sigil is noise. */
export const environmentName = (environment: string) => titleCase(environment);
export const categoryName = (category: string) => titleCase(category);

/**
 * A package is written by hand and carries its own capitalisation — `YouTube`, `The Orchard`, `npm`,
 * `france.tv` — so it is shown verbatim. Title-casing it would produce `Npm`. Environments and
 * categories are parsed lowercase out of a sigil, which is why only those two get cased.
 */
export const packageLabel = (brand: string) => brand;

export type FacetCounts = {
  environments: { value: string; count: number }[];
  brands: { value: string; count: number }[];
  categories: { value: string; count: number }[];
};

const tally = (values: (string | undefined)[]) => {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value));
};

export const facetCounts = (commands: ScriptCommand[]): FacetCounts => {
  const facets = commands.map(facetsOf);

  return {
    environments: tally(facets.map((facet) => facet.environment)),
    brands: tally(facets.map((facet) => facet.brand)),
    categories: tally(facets.map((facet) => facet.category)),
  };
};
