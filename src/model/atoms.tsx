import { atom, SetStateAction } from "jotai";
import * as M from "./types";
import { uniqueId, keyBy } from "lodash";
import { mat2d } from "../utility/gl-matrix";

const _currentFrameIndex_unsafe = atom(0);
export const currentFrameIndex = atom(
  (read) => read(_currentFrameIndex_unsafe),
  (read, write, update: SetStateAction<number>) => {
    const proposedNextValue =
      typeof update === "function"
        ? update(read(_currentFrameIndex_unsafe))
        : update;
    write(
      _currentFrameIndex_unsafe,
      Math.max(
        0,
        Math.min(read(animation).frames.length - 1, proposedNextValue)
      )
    );
  }
);
export const currentFrameIndexWrapping = atom(
  (read) => read(_currentFrameIndex_unsafe),
  (read, write, update: SetStateAction<number>) => {
    const proposedNextValue =
      typeof update === "function"
        ? update(read(_currentFrameIndex_unsafe))
        : update;
    write(
      _currentFrameIndex_unsafe,
      (proposedNextValue + read(animation).frames.length) %
        read(animation).frames.length
    );
  }
);

export const animation = atom<M.Animation>(
  M.Animation.create({
    frames: [
      M.Frame.create({
        pieces: keyBy(
          [
            M.Piece.create({
              renderContent: () => (
                <rect fill="blue" width={100} height={100} />
              ),
              transform: mat2d.compose(mat2d.create(), {
                translation: [100, 0],
                rotation: 0.3,
                scale: [2, 1],
              }),
            }),
            M.Piece.create({
              renderContent: () => <circle fill="yellow" r={80} />,
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
            M.Piece.create({
              renderContent: () => (
                <rect fill="purple" width={150} height={150} />
              ),
              transform: mat2d.compose(mat2d.create(), {
                translation: [1000, 600],
                rotation: 0,
                scale: [1, 1],
              }),
            }),
          ],
          () => uniqueId()
        ),
      }),
    ],
  })
);

export const pieces = atom(
  (get) => get(animation).frames[get(currentFrameIndex)].pieces
);
