import styles from "./App.module.scss";
import classnames from "classnames";
import * as A from "./model/atoms";
import { useAtom } from "jotai";
import { Workspace } from "./components/Workspace";
import { Toolbar } from "./components/Toolbar";

function App() {
  const [currentFrame] = useAtom(A.currentFrame);
  const [workingPieces] = useAtom(A.pieces);

  return (
    <div className={styles.app}>
      <Workspace
        enableSafeAreaBounds
        editable
        pieces={workingPieces}
        className={classnames(styles.absoluteFill, styles.mainWorkspace)}
        // enableInteractiveCameraTransform
      />
      <Workspace
        editable={false}
        pieces={currentFrame.pieces}
        className={classnames(styles.absoluteFill, styles.onionSkinWorkspace)}
      />
      <Toolbar />
    </div>
  );
}

export default App;
