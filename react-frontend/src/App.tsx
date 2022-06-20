import React, { useState, useRef, useReducer, useEffect } from "react";
import { useEffectOnce } from "usehooks-ts";
import "./App.css";
import Controls from "./components/controls";
import { StreamsDisplay } from "./components/streams";
import { LOCAL_STREAMS, useLocalDevices } from "./hooks/useLocalDevices";
import useWebRTC from "./hooks/useWebRTC";

export const App: React.FC<{}> = (props) => {
  const [username, _setUsername] = useState(
    "user_" + Math.floor(Math.random() * 1000000)
  );

  const { join, leave, participants } = useWebRTC();
  const { setAudioEnabled, setVideoEnabled, initialized } = useLocalDevices();

  const joined = useRef(false);

  useEffect(() => {
    if (!joined.current && initialized) {
      join(username);
      joined.current = true;
    }
  }, [initialized]);

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
          onCameraStateChanged={(state) => {
            setVideoEnabled(state);
          }}
          onMuteStateChanged={(state) => {
            setAudioEnabled(state);
          }}
          onLeave={() => console.log("Leaving room")}
        />{" "}
      </div>
    </div>
  );
};

export default App;
