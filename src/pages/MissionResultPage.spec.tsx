import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { MissionResultPage } from "./MissionResultPage";

describe("MissionResultPage", () => {
  it("renders only the aggregate Success result", () => {
    render(<MissionResultPage result="Success" />);
    expect(screen.getByTestId("mission-result")).toHaveTextContent("Success");
  });

  it("renders only the aggregate Fail result", () => {
    render(<MissionResultPage result="Fail" />);
    expect(screen.getByTestId("mission-result")).toHaveTextContent("Fail");
  });

  // Type-level check: MissionResultPageProps only accepts the aggregate "Success" | "Fail"
  // result, so per-player card data cannot be passed as a prop at all.
  it("accepts no per-player card data in its props type", () => {
    type Props = ComponentProps<typeof MissionResultPage>;
    type HasOnlyResult = keyof Props extends "result" ? true : false;
    const typeCheck: HasOnlyResult = true;
    expect(typeCheck).toBe(true);
  });
});
