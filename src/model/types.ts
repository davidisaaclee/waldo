import * as React from "react";
import {
  ReadonlyMat2d,
  ReadonlyVec2,
  Mat2d,
  mat2d,
} from "../utility/gl-matrix";

export interface Piece {
  renderContent(): React.ReactNode;
  transform: Mat2d;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Piece = {
  create({
    renderContent,
    transform,
  }: {
    renderContent(): React.ReactNode;
    transform: Mat2d;
  }): Piece {
    return { renderContent, transform };
  },

  // Getters

  transform(p: Piece): ReadonlyMat2d {
    return p.transform;
  },

  render(p: Piece): React.ReactNode {
    return p.renderContent();
  },

  // Setters

  translateBy(p: Piece, offset: ReadonlyVec2): void {
    p.transform = mat2d.multiply(
      // need to change identity of `p.transform` to play nice with immer :(
      mat2d.create(),
      mat2d.fromTranslation(mat2d.create(), offset),
      p.transform
    );
  },
};

export interface Frame {
  pieces: Record<string, Piece>;
}
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Frame = {
  create({ pieces = {} }: { pieces?: Record<string, Piece> } = {}): Frame {
    return { pieces };
  },
};

export interface Animation {
  frames: Frame[];
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Animation = {
  create({ frames }: { frames: Frame[] }): Animation {
    return { frames };
  },

  insertFrame(anim: Animation, frame: Frame, index: number): void {
    anim.frames.splice(index, 0, frame);
  },

  replaceFrame(anim: Animation, frame: Frame, index: number): void {
    anim.frames.splice(index, 1, frame);
  },
};
