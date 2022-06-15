import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import { useEffectOnce } from "usehooks-ts";
import "./App.css";
import Controls from "./components/controls";
import { StreamsDisplay } from "./components/streams";
import { StreamDisplay } from "./components/stream";
import Stream from "./types/stream";

import { Socket, Channel } from "phoenix";
import { MembraneWebRTC, Peer } from "@membraneframework/membrane-webrtc-js";
import {
  AUDIO_TRACK_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
} from "./room/consts";

var webrtc;

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
      <StreamsDisplay streams={Object.values(participants.current)} />
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
        onConnectionError: (error) =>
          console.error("Failed to join room", error),
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
        onJoinError: (error) => console.error("Failed to join room", error),
        onTrackReady: (ctx) => console.log("New track", ctx),
        onPeerJoined: (peer) => console.log("Peer joined", peer),
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
        console.log("Received media event", event);

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
  const ref = useRef<{ [key: string]: Stream }>({});

  const setParticipant = (participant: string, data: Stream): void => {
    ref.current[participant] = data;
  };

  const removeParticipant = (participant: string) =>
    delete ref.current[participant];

  const updateParticipant = (
    participant: string,
    transformation: (participant: Stream) => void
  ): void => {
    transformation(ref.current[participant]);
  };

  return {
    participants: ref,
    setParticipant,
    removeParticipant,
    updateParticipant,
  };
}

function useDevices() {
  const [localVideoStream, setLocalVideoStream] = useState<
    MediaStream | undefined
  >(undefined);
  const [localAudioStream, setLocalAudioStream] = useState<
    MediaStream | undefined
  >(undefined);

  const resolve = async () => {};

  return { localAudioStream, localVideoStream };
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
