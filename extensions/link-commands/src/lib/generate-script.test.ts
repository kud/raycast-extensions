import { describe, expect, it } from "vitest";
import { splitPackageFields } from "./convention";
import { buildScript, scriptFilename } from "./generate-script";

const target = "https://sonymusic-pde.datadoghq.com/llm/ai-agents-console/my-usage";

describe("scriptFilename", () => {
  it("puts the scope in front and the brand in the middle", () => {
    expect(scriptFilename({ title: "AI Usage", target, environment: "work", packageName: "Datadog" })).toBe(
      "work.datadog.ai-usage.sh",
    );
  });

  it("drops the detail when the title is only the brand", () => {
    expect(scriptFilename({ title: "Netflix", target: "https://www.netflix.com", packageName: "Netflix" })).toBe(
      "netflix.sh",
    );
  });

  /**
   * The regression. A scope left inside the package slugged into the brand segment, producing
   * `datadog-work.ai-usage.sh` — a name the collection's own `bin/check-naming` rejects. Splitting the
   * package before it reaches here is what the create form now does on blur.
   */
  it("agrees with the reader once the package has been split, rather than slugging a sigil into the brand", () => {
    const typed = "Datadog · @work";
    expect(scriptFilename({ title: "AI Usage", target, packageName: typed })).toBe("datadog-work.ai-usage.sh");

    const { brand, environment } = splitPackageFields(typed);
    expect(scriptFilename({ title: "AI Usage", target, environment, packageName: brand })).toBe(
      "work.datadog.ai-usage.sh",
    );
  });
});

describe("buildScript", () => {
  it("writes the scope back out as its own subtitle field, so the file round-trips", () => {
    const { brand, environment } = splitPackageFields("Datadog · @work");
    const { contents } = buildScript({
      title: "datadoghq.com · AI Usage",
      target,
      environment,
      packageName: brand,
      category: "dev",
    });

    expect(contents).toContain("# @raycast.packageName Datadog · @work · #dev");
  });
});
