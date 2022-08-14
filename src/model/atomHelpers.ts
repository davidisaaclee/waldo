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
      useBlankFrameInsteadOfDuplicate = false,
    }: {
      replaceCurrentFrame?: boolean;
      useBlankFrameInsteadOfDuplicate?: boolean;
    } = {}) => {
      const frameToInsert = useBlankFrameInsteadOfDuplicate
        ? M.Frame.create()
        : M.Frame.create({ pieces });
      setAnimation((prev) => {
        if (replaceCurrentFrame) {
          M.Animation.replaceFrame(prev, frameToInsert, currentFrameIndex);
        } else {
          M.Animation.insertFrame(prev, frameToInsert, currentFrameIndex + 1);
          setCurrentFrameIndex((prev) => prev + 1);
        }
      });
    },
    [setAnimation, pieces, currentFrameIndex, setCurrentFrameIndex]
  );
}

export function useCloneSelection() {
  const [selection] = useAtom(A.selection);
  const [, setPieces] = useImmerAtom(A.pieces);

  return React.useCallback(() => {
    setPieces((pieces) => {
      const selectedPieces = Object.keys(selection).map((id) => pieces[id]);
      for (const p of selectedPieces) {
        pieces[M.nextId("pieces")] = M.Piece.clone(p);
      }
    });
  }, [selection, setPieces]);
}

export function useRestoreFrameCallback() {
  const [currentFrame] = useAtom(A.currentFrame);
  const [, setPieces] = useAtom(A.pieces);
  return React.useCallback(() => {
    setPieces(currentFrame.pieces);
  }, [setPieces, currentFrame]);
}
