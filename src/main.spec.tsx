import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("main entry point", () => {
  it("mounts the App component without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
