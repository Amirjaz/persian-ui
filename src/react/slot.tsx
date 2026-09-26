import {
  Children,
  cloneElement,
  forwardRef,
  version,
  type ReactElement,
  type Ref,
} from "react";
import { cx, mergeRefs } from "./utils";

type AnyProps = Record<string, unknown>;

/**
 * Renders its only child with `props` merged in (the `asChild` pattern):
 * event handlers run both, class names concatenate, refs are combined, and the
 * child's own props win otherwise. A forwardRef component, because React 18
 * doesn't pass `ref` to function components as a prop.
 */
export const Slot = forwardRef<unknown, AnyProps & { children: ReactElement }>(function Slot(
  { children, ...props },
  forwardedRef,
) {
  // Throws unless there is exactly one element child.
  const child = Children.only(children) as ReactElement<AnyProps>;

  const childProps = child.props;
  const merged: AnyProps = { ...props, ...childProps };
  for (const [key, handler] of Object.entries(props)) {
    const childHandler = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof handler === "function" && typeof childHandler === "function") {
      merged[key] = (...args: unknown[]) => {
        childHandler(...args);
        handler(...args);
      };
    }
  }
  merged.className = cx(props.className as string | undefined, childProps.className as string | undefined);
  merged.ref = mergeRefs(forwardedRef, childRef(child));
  return cloneElement(child, merged);
});

/** React 19 passes `ref` as a prop; React 18 keeps it on the element. */
function childRef(child: ReactElement<AnyProps>): Ref<unknown> | undefined {
  if (!version.startsWith("18.")) return child.props.ref as Ref<unknown> | undefined;
  return (child as unknown as { ref?: Ref<unknown> }).ref;
}
