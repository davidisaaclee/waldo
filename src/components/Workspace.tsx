import * as React from "react";
import styles from "./Workspace.module.scss";
import { ReadonlyVec2, Vec2, mat2d, vec2 } from "../utility/gl-matrix";
import classnames from "classnames";
import * as M from "../model/types";
import { useAtom } from "jotai";
import * as A from "../model/atoms";
import * as AtomHelpers from "../model/atomHelpers";
import Measure from "react-measure";
import { useAnimationFrame } from "../utility/useAnimationFrame";
import { useMutable } from "../utility/useMutable";

// width / height
const BASE_FRAME_SIZE: ReadonlyVec2 = [500, 500];

export function Workspace({
  style,
  className,
  editable = false,
  enableInteractiveCameraTransform = false,
  pieces,
  onChangePieceSelected,
  wireframe = false,
  frameMargin = 100,
  hideFrame = false,
}: {
  style?: React.CSSProperties;
  className?: string;
  // how much space outside the frame should be shown?
  frameMargin?: number;
  enableSafeAreaBounds?: boolean;
  editable?: boolean;
  enableInteractiveCameraTransform?: boolean;
  pieces: Record<string, M.Piece>;
  onChangePieceSelected?: (pieceId: string, isSelected: boolean) => void;
  wireframe?: boolean;
  hideFrame?: boolean;
}) {
  const getPieces = useMutable(pieces);
  const mutateSinglePiece = AtomHelpers.useMutateSinglePiece();
  const [dimensions, setDimensions] = React.useState<ReadonlyVec2 | null>(null);
  const [cameraTransform, setCameraTransform] = React.useState(() =>
    mat2d.create()
  );

  // Set initial camera transform (once view is measured)
  React.useEffect(() => {
    const out = mat2d.create();
    if (dimensions != null && dimensions[0] > 0 && dimensions[1] > 0) {
      const scale = vec2.scaleToAspectFit(
        BASE_FRAME_SIZE,
        vec2.sub(vec2.create(), dimensions, vec2.unit(frameMargin * 2))
      );
      mat2d.multiply(
        out,
        mat2d.fromScaling(mat2d.create(), vec2.unit(scale)),
        out
      );

      mat2d.multiply(
        out,
        mat2d.fromTranslation(mat2d.create(), vec2.unit(frameMargin)),
        out
      );

      const centering = (() => {
        const frameWithMarginsSize = vec2.add(
          vec2.create(),
          vec2.scale(vec2.create(), BASE_FRAME_SIZE, scale),
          vec2.unit(frameMargin * 2)
        );

        return vec2.scale(
          vec2.create(),
          vec2.sub(vec2.create(), frameWithMarginsSize, dimensions),
          -0.5
        );
      })();
      mat2d.multiply(
        out,
        mat2d.fromTranslation(mat2d.create(), centering),
        out
      );
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

  const [temporaryEditsRef] = useAtom(A.temporaryEditsRef);

  const [selection] = useAtom(A.selection);

  const onGeneralPointerMove = React.useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      const pointerRole = pointerRolesRef.current[event.pointerId];
      if (pointerRole == null) {
        return;
      }

      const clientToWorkspace = (p: ReadonlyVec2, out: Vec2 = vec2.create()) =>
        vec2.transformMat2d(out, p, inverseCameraTransform);

      const pos = vec2.fromClientPosition(event);
      if (pointerRole.piece == null) {
        // Collect pointer positions into array of [prevPos, currPos] for each pointer.
        // These are in client coordinates.
        const pointPairs: Array<[ReadonlyVec2, ReadonlyVec2]> = [];
        for (const _pointerId of Object.keys(pointerRolesRef.current)) {
          const pointerId = parseFloat(_pointerId);
          const prevPos = clientToWorkspace(
            pointerRolesRef.current[pointerId].prevPosition
          );
          if (pointerId === event.pointerId) {
            pointPairs.push([prevPos, clientToWorkspace(pos)]);
          } else {
            pointPairs.push([prevPos, prevPos]);
          }
        }

        const transform = mat2d.nudgedEstimate(mat2d.create(), pointPairs);

        if (Object.keys(selection).length > 0) {
          // pointer is being dragged over canvas while pieces are selected;
          // use this as a selection transform input.
          Object.keys(selection).forEach((id) => {
            temporaryEditsRef.current[id] = mat2d.multiply(
              temporaryEditsRef.current[id] ?? mat2d.create(),
              transform,
              temporaryEditsRef.current[id] ??
                M.Piece.transform(getPieces()[id])
            );
          });
        } else {
          // pointer is being dragged over canvas with no pieces selected;
          // use this as a camera transform input.
          if (enableInteractiveCameraTransform) {
            setCameraTransform((prev) =>
              mat2d.mul(mat2d.create(), prev, transform)
            );
          }
        }
      } else {
        const delta = (() => {
          const out = vec2.create();
          vec2.transformMat2d(out, pos, inverseCameraTransform);
          vec2.sub(
            out,
            out,
            vec2.transformMat2d(
              vec2.create(),
              pointerRole.prevPosition,
              inverseCameraTransform
            )
          );
          return out;
        })();

        temporaryEditsRef.current[pointerRole.piece] = mat2d.multiply(
          temporaryEditsRef.current[pointerRole.piece] ?? mat2d.create(),
          mat2d.fromTranslation(mat2d.create(), delta),
          temporaryEditsRef.current[pointerRole.piece] ??
            M.Piece.transform(getPieces()[pointerRole.piece])
        );
      }
      pointerRole.prevPosition = pos;
    },
    [
      getPieces,
      enableInteractiveCameraTransform,
      inverseCameraTransform,
      selection,
      temporaryEditsRef,
    ]
  );

  const pieceViewsRef = React.useRef<Record<string, SVGElement>>({});
  useAnimationFrame({
    enabled: true,
    callback() {
      for (const id of Object.keys(temporaryEditsRef.current)) {
        const edit = temporaryEditsRef.current[id];
        const node = pieceViewsRef.current[id];
        if (node == null) {
          return;
        }
        node.setAttribute("transform", mat2d.toSvgInstruction(edit));
      }
    },
  });

  return (
    <Measure
      bounds
      onResize={({ bounds }) => setDimensions([bounds!.width, bounds!.height])}
    >
      {({ measureRef }) => (
        <div
          ref={measureRef}
          className={classnames(styles.workspaceContainer, className)}
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
                const heldPiece =
                  pointerRolesRef.current[event.pointerId]?.piece;
                if (heldPiece != null) {
                  if (temporaryEditsRef.current[heldPiece] != null) {
                    mutateSinglePiece(
                      heldPiece,
                      (prev) =>
                        (prev.transform = temporaryEditsRef.current[heldPiece])
                    );
                    delete temporaryEditsRef.current[heldPiece];
                  }
                  onChangePieceSelected?.(heldPiece, false);
                }

                delete pointerRolesRef.current[event.pointerId];
              }}
            >
              <g transform={mat2d.toSvgInstruction(cameraTransform)}>
                {Object.entries(pieces).map(([id, piece]) => (
                  <g
                    key={id}
                    ref={(ref) => {
                      if (ref == null) {
                        delete pieceViewsRef.current[id];
                      } else {
                        pieceViewsRef.current[id] = ref;
                      }
                    }}
                    transform={mat2d.toSvgInstruction(
                      temporaryEditsRef.current[id] ?? M.Piece.transform(piece)
                    )}
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
                            onChangePieceSelected?.(id, true);
                          },
                        }
                      : {})}
                  >
                    <path
                      d={piece.path}
                      {...(wireframe
                        ? {
                            stroke: "white",
                            fill: "transparent",
                          }
                        : {
                            fill: piece.fill,
                          })}
                    />
                  </g>
                ))}
                {!hideFrame && (
                  <rect
                    width={vec2.x(BASE_FRAME_SIZE)}
                    height={vec2.y(BASE_FRAME_SIZE)}
                    fill="none"
                    stroke="red"
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
