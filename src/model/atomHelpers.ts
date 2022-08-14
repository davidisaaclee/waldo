import * as React from "react";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai/immer";
import { keyBy } from "lodash";
import * as M from "./types";
import * as A from "./atoms";
import * as K from "../constants";
import { mat2d } from "../utility/gl-matrix";

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
        : M.Frame.create({
            pieces: keyBy(Object.values(pieces).map(M.Piece.clone), () =>
              M.nextId("pieces")
            ),
          });
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

export function useClonePieces() {
  const [selection] = useAtom(A.selection);
  const [temporaryEditsRef] = useAtom(A.temporaryEditsRef);
  const [, setPieces] = useImmerAtom(A.pieces);

  return React.useCallback(() => {
    setPieces((pieces) => {
      Object.keys(selection).forEach((id) => {
        const p = M.Piece.clone(pieces[id]);
        if (temporaryEditsRef.current[id] != null) {
          p.transform = mat2d.clone(temporaryEditsRef.current[id]);
        }
        pieces[M.nextId("pieces")] = p;
      });
    });
  }, [temporaryEditsRef, selection, setPieces]);
}

let nextPaletteSampleIndex = 0;

export function useChangeSelectionColorCallback() {
  const [selection] = useAtom(A.selection);
  const [, setPieces] = useImmerAtom(A.pieces);
  return React.useCallback(() => {
    const color = K.COLOR_PALETTE[nextPaletteSampleIndex];
    nextPaletteSampleIndex =
      (nextPaletteSampleIndex + 1) % K.COLOR_PALETTE.length;

    setPieces((pieces) => {
      const selectedPieces = Object.keys(selection).map((id) => pieces[id]);
      for (const p of selectedPieces) {
        p.fill = color;
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
