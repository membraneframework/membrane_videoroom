import { useEffect, useRef, useState } from "react";

import { Socket, Channel } from "phoenix";
import { MembraneWebRTC } from "@membraneframework/membrane-webrtc-js";

import useParticipants from "./useParticipants";
import Stream from "../types/stream";
import { LOCAL_STREAMS, useLocalDevices } from "./useLocalDevices";

function useWebRTC() {
  const { participants, setParticipant, removeParticipant, updateParticipant } =
    useParticipants();

  const webrtc = useRef<MembraneWebRTC | undefined>(
    new MembraneWebRTC({
      callbacks: {
        onSendMediaEvent: (event) =>
          channel.current.push("mediaEvent", { data: event }),
        onJoinSuccess: async (_peerId, _peersInRoom) => {
          LOCAL_STREAMS.video?.getTracks().forEach((track) => {
            webrtc.current?.addTrack(track, LOCAL_STREAMS.video!);
          });

          LOCAL_STREAMS.audio?.getTracks().forEach((track) => {
            webrtc.current?.addTrack(track, LOCAL_STREAMS.audio!);
          });

          setParticipant("local", {
            ownerName: "You",
            videoStream: LOCAL_STREAMS.video,
          });
        },
        onTrackReady: (ctx) => {
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
    })
  );

  const socket = useRef<Socket | undefined>();
  const channel = useRef<Channel | undefined>();

  const join = (displayName: string) => {
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
