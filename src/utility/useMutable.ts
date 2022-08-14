import * as React from "react";

export function useMutable<T>(val: T): () => T {
  const ref = React.useRef(val);
  ref.current = val;
  return React.useCallback(() => ref.current, []);
}

/**
 * Wraps a function so that its identity remains stable, while the function may
 * mutate. Useful for passing a callback to `useEffect` without triggering the
 * effect on function change.
 */
export function useMutableCallback<Fn extends (...args: any) => any>(
  fn: Fn
): Fn {
  const getFn = useMutable(fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback<Fn>(((...args: any) => getFn()(...args)) as any, [
    getFn,
  ]);
}

export default useMutable;
