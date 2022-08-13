import styles from "./Toolbar.module.scss";
import * as A from "../model/atoms";
import * as AtomHelpers from "../model/atomHelpers";
import { useAtom } from "jotai";
import { Workspace } from "./Workspace";

export function Toolbar() {
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndexWrapping
  );
  const captureFrame = AtomHelpers.useCaptureToFrameCallback();

  const [currentFrame] = useAtom(A.currentFrame);

  return (
    <div className={styles.toolbar}>
      <button
        className={styles.button}
        onClick={() => {
          captureFrame({ replaceCurrentFrame: false });
        }}
      >
        Capture to next frame
      </button>
      <button
        className={styles.button}
        onClick={() => {
          captureFrame({ replaceCurrentFrame: true });
        }}
      >
        Replace frame
      </button>
      <button
        className={styles.button}
        onClick={() => setCurrentFrameIndex((prev) => prev - 1)}
      >
        -1
      </button>
      <button
        className={styles.button}
        onClick={() => setCurrentFrameIndex((prev) => prev + 1)}
      >
        +1
      </button>
      <label className={styles.label}>Frame {currentFrameIndex}</label>
      <Workspace pieces={currentFrame.pieces} />
    </div>
  );
}
