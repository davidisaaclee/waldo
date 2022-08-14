import * as React from "react";
import styles from "./Workspace.module.scss";
import { ReadonlyVec2, Mat2d, mat2d, vec2 } from "../utility/gl-matrix";
import classnames from "classnames";
import * as M from "../model/types";
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
}: {
  style?: React.CSSProperties;
  className?: string;
  frameMargin?: number;
  enableSafeAreaBounds?: boolean;
  editable?: boolean;
  enableInteractiveCameraTransform?: boolean;
  pieces: Record<string, M.Piece>;
  onChangePieceSelected?: (pieceId: string, isSelected: boolean) => void;
}) {
  const getPieces = useMutable(pieces);
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

  const temporaryEditsRef = React.useRef<Record<string, Mat2d>>({});

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
    [getPieces, enableInteractiveCameraTransform, inverseCameraTransform]
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
                    <path d={piece.path} fill={piece.fill} />
                  </g>
                ))}
              </g>
            </svg>
          )}
        </div>
      )}
    </Measure>
  );
}
