import React, { useEffect, useRef } from "react";
import Stream from "../types/stream";
import { createUseStyles } from "react-jss";

type StreamDisplayProps = {
  stream: Stream;
};

export const StreamDisplay: React.FC<StreamDisplayProps> = (
  props: StreamDisplayProps
) => {
  const { stream } = props;
  const styles = useStyles();

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream.videoStream) {
      videoRef.current.srcObject = stream.videoStream;
    }
  }, [videoRef]);

  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && stream.audioStream) {
      audioRef.current.srcObject = stream.audioStream;
    }
  }, [audioRef]);

  return (
    <div className={styles.tile}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={stream.audioStream !== undefined}
      />
      {/* <audio ref={audioRef}/> */}
      <span className={styles.name}>{stream.ownerName}</span>
    </div>
  );
};

const useStyles = createUseStyles({
  tile: {
    position: "relative",
    "& video": {
      top: 0,
      left: 0,
      objectFit: "contain",
      objectPosition: "50% 50%",
      maxWidth: "100%",
      maxHeight: "100%",
    },
  },
  name: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: "fit-content",
    height: "fit-content",
  },
});

export default StreamDisplay;
