import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders a single Start Game action and the language toggle", () => {
    render(<LandingPage />);

    expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join a Game" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });
});
