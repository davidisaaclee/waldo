import * as React from "react";
import styles from "./App.module.scss";
import { ReadonlyVec2, mat2d, vec2 } from "./utility/gl-matrix";
import classnames from "classnames";
import * as M from "./model/types";
import * as A from "./model/atoms";
import { useAtom } from "jotai";
import Measure from "react-measure";

function App() {
  return (
    <div className={styles.app}>
      <Workspace />
    </div>
  );
}

export function Workspace({
  style,
  className,
  frameMargin = 20,
}: {
  style?: React.CSSProperties;
  className?: string;
  frameMargin?: number;
}) {
  const [pieces] = useAtom(A.pieces);
  const mutateSinglePiece = A.useMutateSinglePiece();
  const [dimensions, setDimensions] = React.useState<ReadonlyVec2 | null>(null);

  // maps pointerId -> info
  const pointerRolesRef = React.useRef<
    Record<
      number,
      {
        piece: string;
        prevPosition: ReadonlyVec2;
      }
    >
  >({});

  return (
    <Measure
      bounds
      onResize={({ bounds }) => setDimensions([bounds!.width, bounds!.height])}
    >
      {({ measureRef }) => (
        <div
          ref={measureRef}
          className={classnames(styles.workspace, className)}
          style={style}
        >
          <svg
            style={{ flex: 1 }}
            onPointerMove={(event) => {
              const pointerRole = pointerRolesRef.current[event.pointerId];
              if (pointerRole == null) {
                return;
              }

              const pos = vec2.fromClientPosition(event);
              const delta = vec2.sub(
                vec2.create(),
                pos,
                pointerRole.prevPosition
              );
              mutateSinglePiece(pointerRole.piece, (p) =>
                M.Piece.translateBy(p, delta)
              );
              pointerRole.prevPosition = pos;
            }}
          >
            {Object.entries(pieces).map(([id, piece]) => (
              <PieceView
                key={id}
                piece={piece}
                onPointerDown={(event) => {
                  pointerRolesRef.current[event.pointerId] = {
                    piece: id,
                    prevPosition: vec2.fromClientPosition(event),
                  };
                }}
                onPointerUp={(event) => {
                  if (pointerRolesRef.current[event.pointerId].piece === id) {
                    delete pointerRolesRef.current[event.pointerId];
                  }
                }}
              />
            ))}
            {dimensions != null && (
              // This shouldn't change aspect ratio with viewport; I think the
              // best thing to do would be to grab aspect ratio at launch, and
              // resizing window just scales the existing aspect ratio to
              // fit.
              <rect
                stroke="red"
                strokeWidth={1}
                width={vec2.x(dimensions) - frameMargin * 2}
                height={vec2.y(dimensions) - frameMargin * 2}
                x={frameMargin}
                y={frameMargin}
                fill="none"
              />
            )}
          </svg>
        </div>
      )}
    </Measure>
  );
}

function PieceView({
  piece,
  onDrag,
  onPointerDown,
  onPointerUp,
}: {
  piece: M.Piece;
  onDrag?: (delta: ReadonlyVec2) => void;
} & Pick<React.DOMAttributes<SVGElement>, "onPointerDown" | "onPointerUp">) {
  const previousDragPositionRef = React.useRef<ReadonlyVec2 | null>(null);

  // const pointerEventHandlers = React.useMemo<React.DOMAttributes<SVGElement>>(
  //   () => ({
  //     onPointerDown: (event) => {
  //       if (previousDragPositionRef.current != null) {
  //         // already being dragged
  //         return;
  //       }

  //       event.currentTarget.setPointerCapture(event.pointerId);
  //       previousDragPositionRef.current = vec2.fromClientPosition(event);
  //     },
  //     onPointerLeave(event) {
  //       if (event.currentTarget.hasPointerCapture(event.pointerId)) {
  //         event.currentTarget.setPointerCapture(event.pointerId);
  //       }
  //     },
  //     onPointerMove: (event) => {
  //       // console.log("move", event.clientX, event.currentTarget);
  //       if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
  //         console.log("move no cap");
  //         return;
  //       }
  //       const dragPosition = vec2.fromClientPosition(event);
  //       if (previousDragPositionRef.current != null) {
  //         const delta = vec2.sub(
  //           vec2.create(),
  //           dragPosition,
  //           previousDragPositionRef.current
  //         );
  //         onDrag?.(delta);
  //       }
  //       previousDragPositionRef.current = dragPosition;

  //       event.preventDefault();
  //     },
  //     onPointerUp: (event) => {
  //       console.log("pointerup");
  //       event.currentTarget.releasePointerCapture(event.pointerId);
  //       previousDragPositionRef.current = null;
  //     },
  //   }),
  //   [onDrag]
  // );

  return (
    <g
      transform={mat2d.toSvgInstruction(M.Piece.transform(piece))}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {M.Piece.render(piece)}
    </g>
  );
}

export default App;
