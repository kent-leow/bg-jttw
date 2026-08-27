import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssassinationSuspenseScene } from "./assassinationSuspenseScene";

describe("AssassinationSuspenseScene", () => {
  it("renders the swirling ink-cloud suspense scene", () => {
    render(<AssassinationSuspenseScene />);
    expect(screen.getByTestId("assassination-suspense-scene")).toBeInTheDocument();
  });
});

