import { atom, SetStateAction } from "jotai";
import * as M from "./types";
import { keyBy, sample } from "lodash";
import { Mat2d, mat2d } from "../utility/gl-matrix";
import * as K from "../constants";

export const temporaryEditsRef = atom<{ current: Record<string, Mat2d> }>({
  current: {},
});

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
    K.INITIAL_PIECES.map((p) => ({
      ...p,
      fill: sample(K.COLOR_PALETTE)!,
    })),
    () => M.nextId("pieces")
  )
);

function applySetStateAction<Value>(
  action: SetStateAction<Value>,
  prev: Value
): Value {
  return typeof action === "function" ? (action as any)(prev) : action;
}
