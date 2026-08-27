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

  it("shows an explicit error instead of spinning forever when the payload is too large to encode", async () => {
    // Exceeds the QR code data-capacity limit even at the lowest error-correction level.
    const oversizedPayload = "x".repeat(10_000);
    render(<QrDisplay payload={oversizedPayload} />);

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert).toHaveTextContent(/too large/i);
  });
});
