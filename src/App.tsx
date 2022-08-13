import * as React from "react";
import styles from "./App.module.scss";
import { ReadonlyVec2, mat2d, vec2 } from "./utility/gl-matrix";
import classnames from "classnames";
import * as M from "./model/types";
import * as A from "./model/atoms";
import * as AtomHelpers from "./model/atomHelpers";
import { useAtom } from "jotai";
import Measure from "react-measure";

// width / height
const BASE_FRAME_SIZE: ReadonlyVec2 = [500, 500];

function App() {
  const [currentFrameIndex, setCurrentFrameIndex] = useAtom(
    A.currentFrameIndexWrapping
  );
  const captureFrame = AtomHelpers.useCaptureToFrameCallback();

  const [currentFrame] = useAtom(A.currentFrame);
  const [workingPieces] = useAtom(A.pieces);

  return (
    <div className={styles.app}>
      <Workspace
        enableSafeAreaBounds
        editable
        pieces={workingPieces}
        // enableInteractiveCameraTransform
      />
      <div className={styles.toolbar}>
        <button
          className={styles.button}
          onClick={() => {
            captureFrame({ replaceCurrentFrame: false });
          }}
        >
          Capture to next frame
        </button>
        <button
          className={styles.button}
          onClick={() => {
            captureFrame({ replaceCurrentFrame: true });
          }}
        >
          Replace frame
        </button>
        <button
          className={styles.button}
          onClick={() => setCurrentFrameIndex((prev) => prev - 1)}
        >
          -1
        </button>
        <button
          className={styles.button}
          onClick={() => setCurrentFrameIndex((prev) => prev + 1)}
        >
          +1
        </button>
        <label className={styles.label}>Frame {currentFrameIndex}</label>
        <Workspace pieces={currentFrame.pieces} />
      </div>
    </div>
  );
}

export function Workspace({
  style,
  className,
  enableSafeAreaBounds = false,
  editable = false,
  enableInteractiveCameraTransform = false,
  pieces,
}: {
  style?: React.CSSProperties;
  className?: string;
  frameMargin?: number;
  enableSafeAreaBounds?: boolean;
  editable?: boolean;
  enableInteractiveCameraTransform?: boolean;
  pieces: Record<string, M.Piece>;
}) {
  const mutateSinglePiece = AtomHelpers.useMutateSinglePiece();
  const [dimensions, setDimensions] = React.useState<ReadonlyVec2 | null>(null);
  const [cameraTransform, setCameraTransform] = React.useState(() =>
    mat2d.create()
  );

  React.useEffect(() => {
    const out = mat2d.create();
    if (dimensions != null && dimensions[0] > 0 && dimensions[1] > 0) {
      const scale = mat2d.scaleToAspectFit(BASE_FRAME_SIZE, dimensions);
      mat2d.multiply(out, out, scale);
    }
    setCameraTransform(out);
  }, [dimensions]);

  // maps pointerId -> info
  const pointerRolesRef = React.useRef<
    Record<
      number,
      {
        piece: string | null;
        prevPosition: ReadonlyVec2;
      }
    >
  >({});

  const inverseCameraTransform = React.useMemo(
    () => mat2d.invert(mat2d.create(), cameraTransform),
    [cameraTransform]
  );

  const onGeneralPointerMove = React.useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      const pointerRole = pointerRolesRef.current[event.pointerId];
      if (pointerRole == null) {
        return;
      }

      const pos = vec2.fromClientPosition(event);
      if (pointerRole.piece == null) {
        if (enableInteractiveCameraTransform) {
          const pointPairs: Array<[ReadonlyVec2, ReadonlyVec2]> = [];

          for (const _pointerId of Object.keys(pointerRolesRef.current)) {
            const pointerId = parseFloat(_pointerId);
            const prevPos = pointerRolesRef.current[pointerId].prevPosition;
            if (pointerId === event.pointerId) {
              pointPairs.push([prevPos, pos]);
            } else {
              pointPairs.push([prevPos, prevPos]);
            }
            const nudged = mat2d.nudgedEstimate(
              mat2d.create(),
              pointPairs.map(([p1, p2]) => [
                vec2.transformMat2d(vec2.create(), p1, inverseCameraTransform),
                vec2.transformMat2d(vec2.create(), p2, inverseCameraTransform),
              ])
            );
            setCameraTransform((prev) =>
              mat2d.mul(mat2d.create(), prev, nudged)
            );
          }
        }
      } else {
        const delta = vec2.sub(
          vec2.create(),
          vec2.transformMat2d(vec2.create(), pos, inverseCameraTransform),
          vec2.transformMat2d(
            vec2.create(),
            pointerRole.prevPosition,
            inverseCameraTransform
          )
        );
        mutateSinglePiece(pointerRole.piece, (p) =>
          M.Piece.translateBy(p, delta)
        );
      }
      pointerRole.prevPosition = pos;
    },
    [mutateSinglePiece, inverseCameraTransform]
  );

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
          {dimensions != null && (
            <svg
              style={{ flex: 1 }}
              onPointerMove={editable ? onGeneralPointerMove : undefined}
              onPointerDown={(event) => {
                if (pointerRolesRef.current[event.pointerId] != null) {
                  return;
                }
                pointerRolesRef.current[event.pointerId] = {
                  piece: null,
                  prevPosition: vec2.fromClientPosition(event),
                };
              }}
              onPointerUp={(event) => {
                if (pointerRolesRef.current[event.pointerId]?.piece == null) {
                  delete pointerRolesRef.current[event.pointerId];
                }
              }}
            >
              <g transform={mat2d.toSvgInstruction(cameraTransform)}>
                {Object.entries(pieces).map(([id, piece]) => (
                  <PieceView
                    key={id}
                    piece={piece}
                    {...(editable
                      ? {
                          onPointerDown: (event) => {
                            if (
                              pointerRolesRef.current[event.pointerId] != null
                            ) {
                              return;
                            }
                            pointerRolesRef.current[event.pointerId] = {
                              piece: id,
                              prevPosition: vec2.fromClientPosition(event),
                            };
                          },
                          onPointerUp: (event) => {
                            if (
                              pointerRolesRef.current[event.pointerId].piece ===
                              id
                            ) {
                              delete pointerRolesRef.current[event.pointerId];
                            }
                          },
                        }
                      : {})}
                  />
                ))}
                {enableSafeAreaBounds && dimensions != null && (
                  // This shouldn't change aspect ratio with viewport; I think the
                  // best thing to do would be to grab aspect ratio at launch, and
                  // resizing window just scales the existing aspect ratio to
                  // fit.
                  <rect
                    stroke="red"
                    strokeWidth={1}
                    width={vec2.x(BASE_FRAME_SIZE)}
                    height={vec2.y(BASE_FRAME_SIZE)}
                    x={0}
                    y={0}
                    fill="none"
                  />
                )}
              </g>
            </svg>
          )}
        </div>
      )}
    </Measure>
  );
}

function PieceView({
  piece,
  onPointerDown,
  onPointerUp,
}: {
  piece: M.Piece;
} & Pick<React.DOMAttributes<SVGElement>, "onPointerDown" | "onPointerUp">) {
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
