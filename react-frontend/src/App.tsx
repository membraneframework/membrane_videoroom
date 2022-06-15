import React, { useState, useRef, useReducer } from "react";
import { useEffectOnce } from "usehooks-ts";
import "./App.css";
import Controls from "./components/controls";
import { StreamsDisplay } from "./components/streams";
import Stream from "./types/stream";

import { Socket, Channel } from "phoenix";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";
import {
  AUDIO_TRACK_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
} from "./room/consts";

export const App: React.FC<{}> = (props) => {
  const [username, _setUsername] = useState(
    "user_" + Math.floor(Math.random() * 1000000)
  );

  const { join, leave, participants } = useWebRTC();

  useEffectOnce(() => {
    join("test");
  });

  return (
    <>
      <StreamsDisplay streams={Object.values(participants)} />
    </>
  );
};

function useWebRTC() {
  const webrtc = useRef<MembraneWebRTC | undefined>();
  const { participants, setParticipant, removeParticipant, updateParticipant } =
    useParticipants();

  const socket = useRef<Socket | undefined>();
  const channel = useRef<Channel | undefined>();

  useEffectOnce(() => {
    webrtc.current = new MembraneWebRTC({
      callbacks: {
        onSendMediaEvent: (event) =>
          channel.current.push("mediaEvent", { data: event }),
        onJoinSuccess: async (_peerId, _peersInRoom) => {
          console.log("Joined");

          const { localVideoStream, localAudioStream } = await getDevices();

          localVideoStream?.getTracks().forEach((track) => {
            webrtc.current?.addTrack(track, localVideoStream!);
          });

          localAudioStream?.getTracks().forEach((track) => {
            webrtc.current?.addTrack(track, localAudioStream!);
          });

          setParticipant("local", {
            ownerName: "You",
            videoStream: localVideoStream,
          });
        },
        onTrackReady: (ctx) => {
          console.log("New track", ctx);

          const data: Partial<Stream> = {
            ownerName: ctx.peer.metadata.displayName,
          };

          if (ctx.track!.kind === "video") {
            data.videoStream = ctx.stream!;
          } else {
            data.audioStream = ctx.stream!;
          }

          updateParticipant(ctx.peer.id, data);
        },
      },
    });
  });

  const join = async (displayName: string) => {
    console.log("Joining room");

    if (!socket.current) {
      socket.current = new Socket("ws://localhost:4000/socket");
      socket.current.connect();

      channel.current = socket.current.channel("room:test");
      channel.current.join();

      channel.current.on("mediaEvent", (event: any) => {
        webrtc.current?.receiveMediaEvent(event.data);
      });

      webrtc.current!.join({ displayName: displayName });
    }
  };

  const leave = async () => {
    webrtc.current?.leave();
  };

  return {
    join,
    leave,
    participants,
  };
}

function useParticipants() {
  type State = {
    [key: string]: Stream;
  };

  enum ActionType {
    Set,
    Update,
    Remove,
  }

  type Action = {
    type: ActionType;
    participant: string;
    data?: Partial<Stream>;
  };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case ActionType.Set:
        const stream = action.data as Stream;
        return { ...state, [action.participant]: stream };
      case ActionType.Remove:
        delete state[action.participant];
        return state;
      case ActionType.Update:
        return {
          ...state,
          [action.participant]: {
            ...state[action.participant],
            ...action.data,
          },
        };
      default:
        throw new TypeError("Unhandled action type");
    }
  };

  const initialState: { [key: string]: Stream } = {};
  const [participants, dispatch] = useReducer(reducer, initialState, (a) => a);

  return {
    participants,
    setParticipant: (participant: string, data: Stream) =>
      dispatch({ type: ActionType.Set, participant, data }),
    removeParticipant: (participant: string) =>
      dispatch({ type: ActionType.Remove, participant }),
    updateParticipant: (participant: string, data: Partial<Stream>) =>
      dispatch({ type: ActionType.Update, participant, data }),
  };
}

async function getDevices() {
  var localAudioStream, localVideoStream;

  const hasVideoInput: boolean = (
    await navigator.mediaDevices.enumerateDevices()
  ).some((device) => device.kind === "videoinput");

  // Ask user for permissions if required
  await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: hasVideoInput,
  });

  // Refresh mediaDevices list after ensuring permissions are granted
  // Before that, enumerateDevices() call would not return deviceIds
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = mediaDevices.filter(
    (device) => device.kind === "videoinput"
  );

  for (const device of videoDevices) {
    const constraints = {
      video: {
        ...VIDEO_TRACK_CONSTRAINTS,
        deviceId: { exact: device.deviceId },
      },
    };

    try {
      localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error("Error while getting local video stream", error);
    }
  }

  try {
    localAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_TRACK_CONSTRAINTS,
    });
  } catch (error) {
    console.error("Error while getting local audio stream", error);
  }

  return { localAudioStream, localVideoStream };
}

export default App;
