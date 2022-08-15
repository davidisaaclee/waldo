import { useAtom } from "jotai";
import { produce } from "immer";
import * as A from "../model/atoms";
import * as M from "../model/types";
import classnames from "classnames";
import styles from "./OverflowMenu.module.scss";

export function OverflowMenu({
  className,
  requestClose,
}: {
  className?: string;
  requestClose?: () => void;
}) {
  const [animation, setAnimation] = useAtom(A.animation);
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndex
  );
  const [, setPieces] = useAtom(A.pieces);

  return (
    <div className={classnames(styles.container, className)}>
      <button
        disabled={animation.frames.length < 2}
        onClick={() => {
          setAnimation(
            produce((anim) => {
              anim.frames.splice(currentFrameIndex, 1);
            })
          );
          setCurrentFrameIndex((prev) => prev - 1);
          requestClose?.();
        }}
      >
        Delete current frame
      </button>
      <button
        onClick={() => {
          setAnimation(() =>
            M.Animation.create({
              frames: [M.Frame.create()],
            })
          );
          setCurrentFrameIndex(0);
          requestClose?.();
        }}
      >
        ! Delete all frames !
      </button>
      <button
        onClick={() => {
          setPieces(A.initialPieces());
        }}
      >
        Reset shapes to starter kit
      </button>
    </div>
  );
}
