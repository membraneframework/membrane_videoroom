import { useRef } from "react";

import { Socket, Channel } from "phoenix";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";

import {
  AUDIO_TRACK_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
} from "../room/consts";
import useParticipants from "./useParticipants";
import { useEffectOnce } from "usehooks-ts";
import Stream from "../types/stream";

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

export default useWebRTC;

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
