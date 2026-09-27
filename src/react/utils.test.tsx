import { act, render, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Slot } from "./slot";
import { cx, mergeRefs, useControllableState } from "./utils";

describe("cx", () => {
  it("joins truthy class names", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
  });
});

describe("mergeRefs", () => {
  it("feeds callback and object refs, and skips missing ones", () => {
    const callback = vi.fn();
    const object = createRef<string>();
    mergeRefs<string>(callback, object, undefined, null)("node");
    expect(callback).toHaveBeenCalledWith("node");
    expect(object.current).toBe("node");
  });
});

describe("useControllableState", () => {
  it("keeps its own state when uncontrolled", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string | null>(undefined, "a", onChange));
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("follows the prop when controlled, including null", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string | null>(null, "a", onChange));
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith("b");
  });
});

describe("Slot", () => {
  it("merges handlers, classes and refs into its child", () => {
    const slotClick = vi.fn();
    const childClick = vi.fn();
    const slotRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLButtonElement>();
    const { getByRole } = render(
      <Slot ref={slotRef} onClick={slotClick} className="from-slot" aria-label="open">
        <button type="button" ref={childRef} onClick={childClick} className="from-child">
          x
        </button>
      </Slot>,
    );
    const button = getByRole("button", { name: "open" });
    button.click();
    expect(childClick).toHaveBeenCalled();
    expect(slotClick).toHaveBeenCalled();
    expect(button).toHaveClass("from-slot", "from-child");
    expect(slotRef.current).toBe(button);
    expect(childRef.current).toBe(button);
  });

  it("requires exactly one element", () => {
    // React logs the expected error, and React 18 also re-throws it as a window error event.
    const silence = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener("error", silence);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Slot>{"text" as never}</Slot>)).toThrow();
    vi.restoreAllMocks();
    window.removeEventListener("error", silence);
  });
});
