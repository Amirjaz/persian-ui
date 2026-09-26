import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DirectionProvider, getDirection, useDirection, useExplicitDirection } from "./direction";

describe("getDirection", () => {
  it("follows dir attributes, including nested ones", () => {
    const { container } = render(
      <div dir="rtl">
        <span data-testid="outer">x</span>
        <div dir="ltr">
          <span data-testid="inner">y</span>
        </div>
      </div>,
    );
    expect(getDirection(container.querySelector('[data-testid="outer"]'))).toBe("rtl");
    expect(getDirection(container.querySelector('[data-testid="inner"]'))).toBe("ltr");
  });

  it("follows the CSS direction property", () => {
    const { container } = render(
      <p style={{ direction: "rtl" }}>
        <span>z</span>
      </p>,
    );
    expect(getDirection(container.querySelector("span"))).toBe("rtl");
  });

  it("defaults to ltr", () => {
    expect(getDirection(null)).toBe("ltr");
    const { container } = render(<span>x</span>);
    expect(getDirection(container.querySelector("span"))).toBe("ltr");
  });

  it("falls back to the dir attribute when computed styles are unavailable", () => {
    const { container } = render(
      <div dir="RTL">
        <span>x</span>
      </div>,
    );
    const span = container.querySelector("span")!;
    const spy = vi.spyOn(window, "getComputedStyle").mockReturnValue({ direction: "" } as CSSStyleDeclaration);
    expect(getDirection(span)).toBe("rtl");
    span.parentElement!.removeAttribute("dir");
    expect(getDirection(span)).toBe("ltr");
    spy.mockRestore();
  });
});

describe("DirectionProvider", () => {
  const wrapper = ({ children }: { children: ReactNode }) => <DirectionProvider dir="rtl">{children}</DirectionProvider>;

  it("provides its direction", () => {
    expect(renderHook(() => useDirection(), { wrapper }).result.current).toBe("rtl");
  });

  it("leaves the direction undefined without a provider", () => {
    expect(renderHook(() => useDirection()).result.current).toBeUndefined();
  });

  it("lets a component's own dir prop win", () => {
    expect(renderHook(() => useExplicitDirection("ltr"), { wrapper }).result.current).toBe("ltr");
    expect(renderHook(() => useExplicitDirection(undefined), { wrapper }).result.current).toBe("rtl");
  });

  it("renders no element of its own", () => {
    const { container } = render(
      <DirectionProvider dir="rtl">
        <b>x</b>
      </DirectionProvider>,
    );
    expect(container.innerHTML).toBe("<b>x</b>");
  });
});
