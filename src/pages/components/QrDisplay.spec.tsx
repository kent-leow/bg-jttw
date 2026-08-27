import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QrDisplay } from "./QrDisplay";

describe("QrDisplay", () => {
  it("renders a QR image for a given payload string", async () => {
    render(<QrDisplay payload="host-offer-payload" />);

    const image = await waitFor(() => screen.getByAltText("QR code"));
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect((image as HTMLImageElement).src).toMatch(/^data:image/);
  });
});
