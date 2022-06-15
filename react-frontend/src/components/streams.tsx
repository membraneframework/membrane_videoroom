import React, { useState, useEffect } from "react";
import { createUseStyles } from "react-jss";
import StreamDisplay from "./stream";
import Stream from "../types/stream";

type StreamsDisplayProps = {
  streams: Stream[];
};

export const StreamsDisplay: React.FC<StreamsDisplayProps> = (props) => {
  const { streams } = props;

  // const styles = useStyles(streams.length);
  const styles = useStyles(props);

  return (
    <div className={styles.grid}>
      {streams.map((stream, index) => (
        <StreamDisplay stream={stream} key={index} />
      ))}
    </div>
  );
};

const get_min_width = (streams_l: number) => {
  const columns = Math.ceil(Math.sqrt(streams_l));
  return Math.trunc(100 / columns);
};

const get_max_height = (streams_l: number) => {
  const rows = Math.floor(streams_l / Math.sqrt(streams_l));
  return Math.trunc(100 / rows);
};

const useStyles = createUseStyles({
  grid: {
    display: "flex",
    flewFlow: "row wrap",
    gap: "20px",
    "& *": {
      minWidth: (props: StreamsDisplayProps): string =>
        `${get_min_width(props.streams.length)}%`,
      maxHeight: (props: StreamsDisplayProps): string =>
        `${get_max_height(props.streams.length)}%`,
    },
  },
});
