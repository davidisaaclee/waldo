import * as React from "react";
import styles from "./App.module.scss";
import classnames from "classnames";
import * as A from "./model/atoms";
import { useAtom } from "jotai";
import { useImmerAtom } from "jotai/immer";
import { Workspace } from "./components/Workspace";
import { Toolbar } from "./components/Toolbar";
import { OverflowMenu } from "./components/OverflowMenu";
import Modal from "react-modal";

Modal.setAppElement("#root");

function App() {
  const [currentFrame] = useAtom(A.currentFrame);
  const [workingPieces] = useAtom(A.pieces);
  const [, setSelection] = useImmerAtom(A.selection);
  const [isShowingOverflow, setIsShowingOverflow] = React.useState(false);

  return (
    <div className={styles.app}>
      <Workspace
        enableSafeAreaBounds
        editable
        pieces={workingPieces}
        className={classnames(styles.absoluteFill, styles.mainWorkspace)}
        onChangePieceSelected={(pieceId, isSelected) => {
          setSelection((selection) => {
            if (isSelected) {
              selection[pieceId] = true;
            } else {
              delete selection[pieceId];
            }
          });
        }}
      />
      <Workspace
        editable={false}
        pieces={currentFrame.pieces}
        className={classnames(styles.absoluteFill, styles.onionSkinWorkspace)}
        wireframe
      />
      <Toolbar onPressOverflow={() => setIsShowingOverflow((p) => !p)} />
      <Modal
        className={styles.overflowMenu}
        overlayClassName={styles.overflowMenuOverlay}
        isOpen={isShowingOverflow}
        shouldCloseOnOverlayClick
        onRequestClose={() => setIsShowingOverflow(false)}
      >
        <OverflowMenu />
      </Modal>
    </div>
  );
}

export default App;
