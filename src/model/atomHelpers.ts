import * as React from "react";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai/immer";
import * as M from "./types";
import * as A from "./atoms";

export function useMutateSinglePiece() {
  const [, setAnim] = useImmerAtom(A.animation);
  const [currentFrameIndex] = useAtom(A.currentFrameIndex);

  return React.useCallback(
    (pieceId: string, mutate: (piece: M.Piece) => void) => {
      setAnim((prev) => {
        mutate(prev.frames[currentFrameIndex].pieces[pieceId]);
      });
    },
    [setAnim, currentFrameIndex]
  );
}

export function usePushDuplicateFrame() {
  const [pieces] = useAtom(A.pieces);
  const [, setAnimation] = useImmerAtom(A.animation);
  const [, setCurrentFrameIndex] = useAtom(A.currentFrameIndex);

  return React.useCallback(() => {
    setAnimation((prev) =>
      M.Animation.insertFrame(
        prev,
        M.Frame.create({ pieces }),
        prev.frames.length
      )
    );
    setCurrentFrameIndex((prev) => prev + 1);
  }, [setAnimation, pieces]);
}
