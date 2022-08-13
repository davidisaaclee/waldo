import * as React from "react";
import { atom, useSetAtom } from "jotai";
import * as M from "./types";
import { uniqueId, keyBy } from "lodash";
import { mat2d } from "../utility/gl-matrix";

export const pieces = atom<Record<string, M.Piece>>(
  keyBy(
    [
      M.Piece.create({
        renderContent: () => <rect fill="blue" width={100} height={100} />,
        transform: mat2d.compose(mat2d.create(), {
          translation: [100, 0],
          rotation: 0.3,
          scale: [2, 1],
        }),
      }),
      M.Piece.create({
        renderContent: () => <circle fill="yellow" r={30} />,
        transform: mat2d.compose(mat2d.create(), {
          translation: [100, 300],
          rotation: 0,
          scale: [1, 1],
        }),
      }),
      M.Piece.create({
        renderContent: () => (
          <path d="M 0 0 l 100 0 l -50 100 l -50 -100 Z" fill="orange" />
        ),
        transform: mat2d.compose(mat2d.create(), {
          translation: [500, 200],
          rotation: 0,
          scale: [1, 1],
        }),
      }),
    ],
    () => uniqueId()
  )
);

export function useMutateSinglePiece() {
  const setPieces = useSetAtom(pieces);

  return React.useCallback(
    (pieceId: string, mutate: (piece: M.Piece) => void) => {
      setPieces((prev) => {
        const outPiece = M.Piece.clone(prev[pieceId]);
        mutate(outPiece);
        return {
          ...prev,
          [pieceId]: outPiece,
        };
      });
    },
    [setPieces]
  );
}
