import * as React from "react";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai/immer";
import * as M from "./types";
import * as A from "./atoms";

export function useMutateSinglePiece() {
  const [, setPieces] = useImmerAtom(A.pieces);

  return React.useCallback(
    (pieceId: string, mutate: (piece: M.Piece) => void) => {
      setPieces((prev) => {
        mutate(prev[pieceId]);
      });
    },
    [setPieces]
  );
}

export function useCaptureToFrameCallback() {
  const [pieces] = useAtom(A.pieces);
  const [, setAnimation] = useImmerAtom(A.animation);
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndex_unsafe
  );

  return React.useCallback(
    ({
      replaceCurrentFrame = false,
    }: { replaceCurrentFrame?: boolean } = {}) => {
      setAnimation((prev) => {
        if (replaceCurrentFrame) {
          M.Animation.replaceFrame(
            prev,
            M.Frame.create({ pieces }),
            currentFrameIndex
          );
        } else {
          M.Animation.insertFrame(
            prev,
            M.Frame.create({ pieces }),
            currentFrameIndex + 1
          );
          setCurrentFrameIndex((prev) => prev + 1);
        }
      });
    },
    [setAnimation, pieces, currentFrameIndex, setCurrentFrameIndex]
  );
}
