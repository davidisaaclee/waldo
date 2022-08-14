import * as React from "react";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai/immer";
import * as M from "./types";
import * as A from "./atoms";
import * as K from "../constants";
import { mat2d } from "../utility/gl-matrix";
import { useMutable } from "../utility/useMutable";

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

  const getClones = useGetCopiesOfPieces();

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
        : M.Frame.create({ pieces: getClones() });
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

// different from `useClonePieces` because this returns the copies instead of writing to frame
export function useGetCopiesOfPieces() {
  const [temporaryEditsRef] = useAtom(A.temporaryEditsRef);
  const getPieces = useMutable(useAtom(A.pieces)[0]);

  // pass no argument to clone all active pieces
  return React.useCallback(
    (pieceIds?: string[]) => {
      const pieces = getPieces();
      const idsToClone = pieceIds ?? Object.keys(pieces);
      const out: typeof pieces = {};
      idsToClone.forEach((id) => {
        const p = M.Piece.clone(pieces[id]);
        if (temporaryEditsRef.current[id] != null) {
          p.transform = mat2d.clone(temporaryEditsRef.current[id]);
        }
        out[M.nextId("pieces")] = p;
      });
      return out;
    },
    [temporaryEditsRef]
  );
}

export function useClonePieces() {
  const [, setPieces] = useImmerAtom(A.pieces);
  const [selection] = useAtom(A.selection);
  const getClonesOf = useGetCopiesOfPieces();

  return React.useCallback(() => {
    setPieces((pieces) => {
      Object.assign(pieces, getClonesOf(Object.keys(selection)));
    });
  }, [selection, getClonesOf, setPieces]);
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
