import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale, useTranslation } from "../../i18n";
import { LanguageToggle } from "./LanguageToggle";

// A tiny stand-in "page" that re-renders translated text on locale change, to prove
// LanguageToggle updates the currently rendered page without a reload.
function SamplePage() {
  const { t } = useTranslation();
  return <p data-testid="sample-text">{t("common.startGame")}</p>;
}

describe("LanguageToggle", () => {
  afterEach(() => {
    setLocale("en");
  });

  it("switches locale and updates rendered text on the current page without a reload", async () => {
    render(
      <>
        <LanguageToggle />
        <SamplePage />
      </>,
    );

    expect(screen.getByTestId("sample-text")).toHaveTextContent("Start Game");

    await userEvent.click(screen.getByRole("button", { name: "中文" }));

    expect(screen.getByTestId("sample-text")).toHaveTextContent("开始游戏");
  });
});
