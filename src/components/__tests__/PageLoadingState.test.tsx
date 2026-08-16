import React from "react";
import { render, screen } from "@testing-library/react";
import { PageLoadingState } from "../PageLoadingState";

describe("PageLoadingState", () => {
  it("renders the default message", () => {
    render(<PageLoadingState />);

    expect(screen.getByText("A carregar dados...")).toBeInTheDocument();
  });

  it("renders a custom message", () => {
    render(<PageLoadingState message="A carregar alertas..." />);

    expect(screen.getByText("A carregar alertas...")).toBeInTheDocument();
  });

  it("renders a spinner element", () => {
    const { container } = render(<PageLoadingState message="A carregar..." />);

    // The spinner is a div with the animate-spin utility class.
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("is wrapped in a page shell", () => {
    const { container } = render(<PageLoadingState message="A carregar..." />);

    expect(container.querySelector(".w-full")).toBeInTheDocument();
  });

  it("keeps the message visible next to the spinner", () => {
    render(<PageLoadingState message="A analisar dados..." />);

    expect(screen.getByText("A analisar dados...")).toBeInTheDocument();
    expect(containerHasSpinner()).toBe(true);

    function containerHasSpinner() {
      return document.querySelector(".animate-spin") !== null;
    }
  });
});