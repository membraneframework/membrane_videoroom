import React, { useState } from "react";
import { createUseStyles } from "react-jss";

type ControlProps = {
  onMuteStateChanged: (muted: boolean) => void;
  onCameraStateChanged: (state: boolean) => void;
  onLeave: () => void;
};

export const Controls: React.FC<ControlProps> = (props: ControlProps) => {
  const styles = useStyles();

  const [muted, setMuted] = useState(false);
  const [cameraState, setCameraState] = useState(true);

  const onMuteClicked = () => {
    setMuted(!muted);
    props.onMuteStateChanged(!muted);
  };

  const onCameraClicked = () => {
    setCameraState(!cameraState);
    props.onCameraStateChanged(!cameraState);
  };

  const onLeaveClicked = props.onLeave;

  return (
    <div className={styles.flexbox}>
      <button onClick={onMuteClicked}>{muted ? "Unmute" : "Mute"}</button>
      <button onClick={onCameraClicked}>
        Camera {cameraState ? "Off" : "On"}
      </button>
      <button onClick={onLeaveClicked}>Leave</button>
    </div>
  );
};

const useStyles = createUseStyles({
  flexbox: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    gap: "10px",
    "& button": {
      fontSize: "0.7em",
    },
  },
});

export default Controls;
