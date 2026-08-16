import React from "react";
import { render, screen } from "@testing-library/react";
import { PageWrapper } from "../PageWrapper";

describe("PageWrapper", () => {
  it("renders children", () => {
    render(
      <PageWrapper>
        <div>Test Content</div>
      </PageWrapper>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies wrapper styling", () => {
    const { container } = render(
      <PageWrapper>
        <div>Content</div>
      </PageWrapper>
    );

    const wrapper = container.firstChild;
    // The wrapper fills its column and owns the page padding; height comes from
    // the flex shell around it, not from min-h-screen.
    expect(wrapper).toHaveClass("w-full", "bg-page", "px-5", "py-5");
  });

  it("spans the full viewport width without centring", () => {
    const { container } = render(
      <PageWrapper>
        <div>Content</div>
      </PageWrapper>
    );

    // Operational dashboards must use the full usable width — no max-width
    // cap and no auto margins on the shell.
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toMatch(/max-w-|mx-auto/);
  });

  it("renders multiple children", () => {
    render(
      <PageWrapper>
        <section>Section 1</section>
        <section>Section 2</section>
      </PageWrapper>
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
  });

  it("handles empty children", () => {
    const { container } = render(<PageWrapper />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("accepts className prop if provided", () => {
    const { container } = render(
      <PageWrapper>
        <div>Content</div>
      </PageWrapper>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
  });
});
