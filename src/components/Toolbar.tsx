import * as React from "react";
import styles from "./Toolbar.module.scss";
import * as A from "../model/atoms";
import * as AtomHelpers from "../model/atomHelpers";
import { useAtom } from "jotai";
import { Workspace } from "./Workspace";
import { useAnimationFrame } from "../utility/useAnimationFrame";
import { useMutableCallback } from "../utility/useMutable";

const FRAME_DURATION_MS = 100;

export function Toolbar() {
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndexWrapping
  );
  const captureFrame = AtomHelpers.useCaptureToFrameCallback();
  const [currentFrame] = useAtom(A.currentFrame);
  const [animation] = useAtom(A.animation);

  const [playState, setPlayState] = React.useState<{
    startFrameIndex: number;
    playbackStartedAt: DOMHighResTimeStamp;
  } | null>(null);

  const isPlaying = React.useMemo(() => playState != null, [playState]);

  useAnimationFrame({
    enabled: isPlaying,
    callback: (timeMs) => {
      if (playState == null) {
        return;
      }

      const desiredFrameIndex =
        playState.startFrameIndex +
        Math.floor((timeMs - playState.playbackStartedAt) / FRAME_DURATION_MS);
      setCurrentFrameIndex(desiredFrameIndex);
    },
  });

  const [selection] = useAtom(A.selection);
  const cloneSelection = AtomHelpers.useClonePieces();
  const cloneSelectionButtonRef =
    React.useRef<React.ElementRef<"button">>(null);
  const changeSelectionColor = useMutableCallback(
    AtomHelpers.useChangeSelectionColorCallback()
  );
  const changeColorButtonRef = React.useRef<React.ElementRef<"button">>(null);

  const restoreFrame = AtomHelpers.useRestoreFrameCallback();

  React.useEffect(() => {
    const buttonForKey: Record<
      string,
      React.RefObject<React.ElementRef<"button">>
    > = {
      d: cloneSelectionButtonRef,
      c: changeColorButtonRef,
    };
    function onKeyPress(event: KeyboardEvent) {
      buttonForKey[event.key]?.current?.click();
    }
    document.addEventListener("keypress", onKeyPress);
    return () => document.removeEventListener("keypress", onKeyPress);
  }, []);

  return (
    <div className={styles.toolbar}>
      <button
        className={styles.button}
        disabled={isPlaying}
        onClick={() => {
          captureFrame({ replaceCurrentFrame: false });
        }}
      >
        Capture to next frame
      </button>
      <button
        className={styles.button}
        disabled={isPlaying}
        onClick={() => {
          captureFrame({ replaceCurrentFrame: true });
        }}
      >
        Replace frame
      </button>
      <button
        className={styles.button}
        disabled={isPlaying}
        onClick={restoreFrame}
      >
        Restore frame
      </button>
      <button
        className={styles.button}
        disabled={isPlaying}
        onClick={() => {
          captureFrame({
            replaceCurrentFrame: false,
            useBlankFrameInsteadOfDuplicate: true,
          });
        }}
      >
        Insert blank frame
      </button>
      <div className={styles.transport}>
        <button
          className={styles.button}
          style={isPlaying ? { display: "none" } : undefined}
          onClick={() => setCurrentFrameIndex((prev) => prev - 1)}
        >
          -1
        </button>
        <button
          className={styles.button}
          style={{ flex: 1 }}
          onClick={() =>
            setPlayState((prev) => {
              if (prev == null) {
                return {
                  startFrameIndex: currentFrameIndex,
                  playbackStartedAt: performance.now(),
                };
              } else {
                return null;
              }
            })
          }
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          className={styles.button}
          style={isPlaying ? { display: "none" } : undefined}
          disabled={isPlaying}
          onClick={() => setCurrentFrameIndex((prev) => prev + 1)}
        >
          +1
        </button>
      </div>
      <Workspace pieces={currentFrame.pieces} className={styles.preview} />
      <label className={styles.label}>
        Frame {currentFrameIndex + 1} / {animation.frames.length}
      </label>

      {Object.keys(selection).length > 0 && (
        <>
          <button
            ref={cloneSelectionButtonRef}
            className={styles.button}
            onClick={cloneSelection}
          >
            <u>D</u>uplicate selection
          </button>
          <button
            ref={changeColorButtonRef}
            className={styles.button}
            onClick={changeSelectionColor}
          >
            <u>C</u>hange color
          </button>
        </>
      )}
    </div>
  );
}
