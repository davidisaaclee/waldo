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
  }) {
    return { renderContent, transform };
  },

  clone(p: Piece) {
    return { ...p, transform: mat2d.clone(p.transform) };
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
    mat2d.multiply(
      p.transform,
      mat2d.fromTranslation(mat2d.create(), offset),
      p.transform
    );
  },
};
