import { render } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { expect } from "vitest";
import { DirectionProvider, type Direction } from "../src/react/direction";

export interface DirectionSetup {
  dir: Direction;
  /** "page": a `dir` attribute on the page. "provider": a DirectionProvider inside a page of the opposite direction. */
  via: "page" | "provider";
  name: string;
}

/** Every component is tested in all four set-ups. */
export const DIRECTION_SETUPS: DirectionSetup[] = [
  { dir: "rtl", via: "page", name: "rtl page" },
  { dir: "ltr", via: "page", name: "ltr page" },
  { dir: "rtl", via: "provider", name: "rtl provider in an ltr page" },
  { dir: "ltr", via: "provider", name: "ltr provider in an rtl page" },
];

export function renderWithDirection(ui: ReactElement, { dir, via }: DirectionSetup) {
  const page = document.createElement("div");
  page.setAttribute("dir", via === "page" ? dir : dir === "rtl" ? "ltr" : "rtl");
  document.body.appendChild(page);
  return render(via === "provider" ? <DirectionProvider dir={dir}>{ui}</DirectionProvider> : ui, {
    container: page,
  });
}

/** Fails with a readable list of axe-core violations. Layout-based rules can't run in jsdom. */
export async function expectNoA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`,
  );
  expect(violations).toEqual([]);
}
