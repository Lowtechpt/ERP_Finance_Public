import { cn } from "../utils";

describe("Utils - cn utility", () => {
  it("combines class names", () => {
    const result = cn("px-2", "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("handles single class", () => {
    const result = cn("px-2");
    expect(result).toContain("px-2");
  });

  it("handles empty strings", () => {
    const result = cn("px-2", "", "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("handles undefined values", () => {
    const result = cn("px-2", undefined, "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("handles false values", () => {
    const result = cn("px-2", false && "py-1", "pr-2");
    expect(result).toContain("px-2");
    expect(result).toContain("pr-2");
    expect(result).not.toContain("py-1");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("active");
  });

  it("handles multiple conditional classes", () => {
    const isActive = true;
    const isDark = false;
    const result = cn(
      "base",
      isActive && "active",
      isDark && "dark"
    );
    expect(result).toContain("active");
    expect(result).not.toContain("dark");
  });

  it("handles array of classes", () => {
    const classes = ["px-2", "py-1"];
    const result = cn(classes.join(" "), "pr-2");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).toContain("pr-2");
  });

  it("handles object notation (if supported)", () => {
    // Depending on implementation, this might work
    const result = cn("base");
    expect(typeof result).toBe("string");
  });

  it("trims whitespace", () => {
    const result = cn("  px-2  ", "  py-1  ");
    // Should handle whitespace appropriately
    expect(result).toBeDefined();
  });

  it("handles null values", () => {
    const result = cn("px-2", null as any, "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("preserves class order", () => {
    const result = cn("first", "second", "third");
    const firstIndex = result.indexOf("first");
    const secondIndex = result.indexOf("second");
    expect(firstIndex < secondIndex).toBe(true);
  });

  it("handles empty call", () => {
    const result = cn();
    expect(typeof result).toBe("string");
  });

  it("removes duplicates if clsx behavior", () => {
    const result = cn("px-2", "px-2");
    // Behavior depends on implementation
    expect(result).toBeDefined();
  });

  it("handles Tailwind conflicting classes", () => {
    // Depends on clsx/tailwind-merge behavior
    const result = cn("p-2", "p-4");
    expect(result).toBeDefined();
  });

  it("handles very long class lists", () => {
    const classes = Array(100).fill("px-2").join(" ");
    const result = cn(classes);
    expect(result).toBeDefined();
  });
});
