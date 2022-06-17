import React, { useState, useRef, useReducer } from "react";
import { useEffectOnce } from "usehooks-ts";
import "./App.css";
import Controls from "./components/controls";
import { StreamsDisplay } from "./components/streams";
import useWebRTC from "./hooks/useWebRTC";
import Stream from "./types/stream";

export const App: React.FC<{}> = (props) => {
  const [username, _setUsername] = useState(
    "user_" + Math.floor(Math.random() * 1000000)
  );

  const { join, leave, participants } = useWebRTC();

  useEffectOnce(() => {
    join("test");
  });

  // return (
  //   <>
  //     <StreamsDisplay streams={Object.values(participants)} />
  //   </>
  // );

  return (
    <div className="app">
      <div className="header">
        <h1>Welcome Membrane Videoroom</h1>
      </div>
      <div className="streams">
        <StreamsDisplay streams={Object.values(participants)} />
      </div>
      <div className="controls">
        <Controls
          onCameraStateChanged={(state) =>
            console.log("Camera state changed", state)
          }
          onMuteStateChanged={(state) =>
            console.log("Mic state changed", state)
          }
          onLeave={() => console.log("Leaving room")}
        />{" "}
      </div>
    </div>
  );
};

export default App;
