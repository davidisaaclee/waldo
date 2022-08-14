import * as React from "react";
import { useMutableCallback } from "./useMutable";

export function useAnimationFrame({
  enabled,
  callback,
}: {
  enabled: boolean;
  callback: FrameRequestCallback;
}) {
  const callbackHandleRef = React.useRef<number | null>(null);
  const callback_mutable = useMutableCallback(callback);

  React.useEffect(() => {
    if (enabled) {
      const frame: FrameRequestCallback = (...args) => {
        if (!enabled) {
          callbackHandleRef.current = null;
          return;
        }

        callback_mutable(...args);
        callbackHandleRef.current = requestAnimationFrame(frame);
      };

      callbackHandleRef.current = requestAnimationFrame(frame);
    } else {
      if (callbackHandleRef.current != null) {
        cancelAnimationFrame(callbackHandleRef.current);
        callbackHandleRef.current = null;
      }
    }

    return () => {
      if (callbackHandleRef.current != null) {
        cancelAnimationFrame(callbackHandleRef.current);
        callbackHandleRef.current = null;
      }
    };
  }, [callback_mutable, callbackHandleRef, enabled]);
}
