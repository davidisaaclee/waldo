import * as React from "react";
import styles from "./Toolbar.module.scss";
import * as A from "../model/atoms";
import * as AtomHelpers from "../model/atomHelpers";
import { useAtom } from "jotai";
import { Workspace } from "./Workspace";
import { useAnimationFrame } from "../utility/useAnimationFrame";
import { useMutableCallback } from "../utility/useMutable";
import Modal from "react-modal";

const FRAME_DURATION_MS = 100;

export function Toolbar({ onPressOverflow }: { onPressOverflow?: () => void }) {
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndexWrapping
  );
  const captureFrame = AtomHelpers.useCaptureToFrameCallback();
  const [currentFrame] = useAtom(A.currentFrame);
  const [animation] = useAtom(A.animation);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] =
    React.useState(false);

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

  const togglePlayback = React.useCallback(() => {
    setPlayState((prev) => {
      if (prev == null) {
        return {
          startFrameIndex: currentFrameIndex,
          playbackStartedAt: performance.now(),
        };
      } else {
        return null;
      }
    });
  }, [currentFrameIndex, setPlayState]);

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
          onClick={togglePlayback}
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
      <div
        className={styles.previewContainer}
        onClick={() => {
          setIsFullscreenPreviewOpen(true);
        }}
      >
        <Workspace
          className={styles.absoluteFill}
          pieces={currentFrame.pieces}
          frameMargin={0}
        />
      </div>
      <div className={styles.label} style={{ position: "relative" }}>
        <span>
          Frame {currentFrameIndex + 1} / {animation.frames.length}
        </span>
        <button
          style={{
            position: "absolute",
            borderRadius: 15,
            width: 30,
            height: 30,
            padding: 0,
            top: 15,
            right: 10,
          }}
          onClick={onPressOverflow}
        >
          ...
        </button>
      </div>

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

      <Modal
        isOpen={isFullscreenPreviewOpen}
        onRequestClose={() => setIsFullscreenPreviewOpen(false)}
        className={styles.fullscreenPreviewModal}
        overlayClassName={styles.fullscreenPreviewModalOverlay}
      >
        <div
          className={styles.absoluteFill}
          onClick={() => setIsFullscreenPreviewOpen(false)}
        >
          <Workspace
            pieces={currentFrame.pieces}
            className={styles.absoluteFill}
            frameMargin={0}
            hideFrame
          />
        </div>
        <div
          style={{
            position: "absolute",
            transform: "translate(100%, 0)",
            padding: 20,
            right: 0,
            bottom: 0,
          }}
        >
          <button onClick={togglePlayback} style={{ padding: 20 }}>
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
