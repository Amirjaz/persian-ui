import { createContext, useContext, type ReactNode } from "react";

export type Direction = "rtl" | "ltr";

const DirectionContext = createContext<Direction | undefined>(undefined);

export interface DirectionProviderProps {
  dir: Direction;
  children?: ReactNode;
}

/**
 * Sets the text direction for every persian-ui component inside it. Components
 * also work without a provider: they follow the direction of the page.
 *
 * The provider renders no element. Components write `dir` on their own root,
 * so their layout and keyboard behaviour match even inside a page with the
 * opposite direction.
 */
export function DirectionProvider({ dir, children }: DirectionProviderProps) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
}

/**
 * The direction set by the nearest `DirectionProvider`, or `undefined` when
 * there is none (components then follow the page's direction).
 */
export function useDirection(): Direction | undefined {
  return useContext(DirectionContext);
}

/** A component's explicit direction: its `dir` prop, else the provider's. */
export function useExplicitDirection(dir: Direction | undefined): Direction | undefined {
  const fromProvider = useContext(DirectionContext);
  return dir ?? fromProvider;
}

/**
 * The direction an element is actually laid out in, whether it comes from a
 * `dir` attribute or from CSS. Read at event time, so it is always current.
 */
export function getDirection(element: Element | null): Direction {
  if (!element) return "ltr";
  const computed = element.ownerDocument.defaultView?.getComputedStyle(element).direction;
  if (computed === "rtl" || computed === "ltr") return computed;
  return element.closest("[dir]")?.getAttribute("dir")?.toLowerCase() === "rtl" ? "rtl" : "ltr";
}
