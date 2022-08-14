import { atom, SetStateAction } from "jotai";
import * as M from "./types";
import { keyBy, sample } from "lodash";
// import { produce } from "immer";
import { mat2d } from "../utility/gl-matrix";
import * as K from "../constants";

export const currentFrameIndex_unsafe = atom(0);
export const currentFrameIndex = atom(
  (read) => read(currentFrameIndex_unsafe),
  (read, write, update: SetStateAction<number>) => {
    const proposedNextValue = applySetStateAction(
      update,
      read(currentFrameIndex_unsafe)
    );
    write(
      currentFrameIndex_unsafe,
      Math.max(
        0,
        Math.min(read(animation).frames.length - 1, proposedNextValue)
      )
    );
  }
);
export const currentFrameIndexWrapping = atom(
  (read) => read(currentFrameIndex_unsafe),
  (read, write, update: SetStateAction<number>) => {
    const proposedNextValue = applySetStateAction(
      update,
      read(currentFrameIndex_unsafe)
    );
    write(
      currentFrameIndex_unsafe,
      (proposedNextValue + read(animation).frames.length) %
        read(animation).frames.length
    );
  }
);

// if piece ID is a key of this value, it is selected
export const selection = atom<Record<string, any>>({});

export const animation = atom<M.Animation>(
  M.Animation.create({
    frames: [M.Frame.create()],
  })
);

export const currentFrame = atom(
  (read) => read(animation).frames[read(currentFrameIndex)]
);

export const pieces = atom<Record<string, M.Piece>>(
  keyBy(
    [
      M.Piece.create({
        path: "M 0 0 l 100 0 l 0 100 l -100 0 z",
        fill: sample(K.COLOR_PALETTE)!,
        // renderContent: () => <rect fill="blue" width={100} height={100} />,
        transform: mat2d.compose(mat2d.create(), {
          translation: [100, 0],
          rotation: 0.3,
          scale: [1, 1],
        }),
      }),
      M.Piece.create({
        path: `
        M 0,0
        m -75, 0
        a 75,75 0 1,0 150,0
        a 75,75 0 1,0 -150,0
        `,
        fill: sample(K.COLOR_PALETTE)!,
        transform: mat2d.compose(mat2d.create(), {
          translation: [100, 300],
          rotation: 0,
          scale: [1, 1],
        }),
      }),
      M.Piece.create({
        path: "M 0 0 l 100 0 l -50 100 l -50 -100 Z",
        fill: sample(K.COLOR_PALETTE)!,
        transform: mat2d.compose(mat2d.create(), {
          translation: [200, 200],
          rotation: 0,
          scale: [1, 1],
        }),
      }),
      M.Piece.create({
        path: "M 0 0 l 100 0 l -50 100 l -50 -100 Z",
        fill: sample(K.COLOR_PALETTE)!,
        transform: mat2d.compose(mat2d.create(), {
          translation: [400, 100],
          rotation: 0.8,
          scale: [1, 1],
        }),
      }),
    ],
    () => M.nextId("pieces")
  )
);

function applySetStateAction<Value>(
  action: SetStateAction<Value>,
  prev: Value
): Value {
  return typeof action === "function" ? (action as any)(prev) : action;
}
