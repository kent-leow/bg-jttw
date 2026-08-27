import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("renders the Host/Join actions and the language toggle", () => {
    render(<LandingPage />);

    expect(screen.getByRole("button", { name: "Host a Game" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join a Game" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });
});
